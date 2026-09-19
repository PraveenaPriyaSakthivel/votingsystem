package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/livepoll/backend/internal/models"
	"github.com/livepoll/backend/internal/realtime"
	"github.com/livepoll/backend/internal/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PollService orchestrates poll creation, voting, and live result broadcasting.
type PollService struct {
	polls *repository.PollRepository
	redis *realtime.RedisStore
}

// NewPollService constructs a PollService with its dependencies.
func NewPollService(polls *repository.PollRepository, redis *realtime.RedisStore) *PollService {
	return &PollService{polls: polls, redis: redis}
}

// CreatePoll validates the request, builds the Poll document, and persists it.
func (s *PollService) CreatePoll(ctx context.Context, req models.CreatePollRequest, creatorID, creatorName string) (*models.Poll, error) {
	// Deduplicate options.
	seen := make(map[string]bool)
	for _, opt := range req.Options {
		if seen[opt] {
			return nil, errors.New("duplicate poll options are not allowed")
		}
		seen[opt] = true
	}

	// Validate end time is in the future if set.
	if req.EndsAt != nil && req.EndsAt.Before(time.Now()) {
		return nil, errors.New("end time must be in the future")
	}

	oid, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return nil, errors.New("invalid creator id")
	}

	options := make([]models.PollOption, len(req.Options))
	for i, text := range req.Options {
		options[i] = models.PollOption{
			ID:    fmt.Sprintf("opt_%d", i+1),
			Text:  text,
			Votes: 0,
		}
	}

	poll := &models.Poll{
		Title:         req.Title,
		Description:   req.Description,
		Options:       options,
		CreatorID:     oid,
		CreatorName:   creatorName,
		AllowMultiple: req.AllowMultiple,
		EndsAt:        req.EndsAt,
	}

	if err = s.polls.Create(ctx, poll); err != nil {
		return nil, err
	}

	// Seed Redis with zero counts so GetVotes works immediately.
	seedMap := make(map[string]int64, len(options))
	for _, opt := range options {
		seedMap[opt.ID] = 0
	}
	_ = s.redis.SeedVotes(ctx, poll.ID.Hex(), seedMap)

	return poll, nil
}

// GetPoll fetches a poll by ID and merges live Redis vote counts into it.
func (s *PollService) GetPoll(ctx context.Context, pollID string) (*models.Poll, error) {
	poll, err := s.polls.FindByID(ctx, pollID)
	if err != nil {
		return nil, err
	}
	if poll == nil {
		return nil, nil
	}

	// Merge live Redis counts into the poll document.
	s.mergeLiveCounts(ctx, poll)
	return poll, nil
}

// GetMyPolls returns all polls for the authenticated creator with live counts.
func (s *PollService) GetMyPolls(ctx context.Context, creatorID string) ([]models.Poll, error) {
	polls, err := s.polls.FindByCreator(ctx, creatorID)
	if err != nil {
		return nil, err
	}
	for i := range polls {
		s.mergeLiveCounts(ctx, &polls[i])
	}
	return polls, nil
}

// Vote validates and records a vote, then broadcasts the updated result via Redis Pub/Sub.
func (s *PollService) Vote(ctx context.Context, pollID, voterKey string, req models.VoteRequest) (*models.PollResult, error) {
	poll, err := s.polls.FindByID(ctx, pollID)
	if err != nil {
		return nil, err
	}
	if poll == nil {
		return nil, errors.New("poll not found")
	}
	if !poll.IsActive {
		return nil, errors.New("this poll is closed")
	}
	if poll.EndsAt != nil && poll.EndsAt.Before(time.Now()) {
		return nil, errors.New("this poll has ended")
	}

	// Build valid option ID set for fast lookup.
	validOptions := make(map[string]bool, len(poll.Options))
	for _, opt := range poll.Options {
		validOptions[opt.ID] = true
	}

	// Validate requested option IDs.
	if !poll.AllowMultiple && len(req.OptionIDs) > 1 {
		return nil, errors.New("this poll does not allow multiple selections")
	}
	for _, oid := range req.OptionIDs {
		if !validOptions[oid] {
			return nil, fmt.Errorf("invalid option id: %s", oid)
		}
	}

	// Check for duplicate vote (per voter key).
	voted, err := s.polls.HasVoted(ctx, pollID, voterKey)
	if err != nil {
		return nil, errors.New("internal error checking vote status")
	}
	if voted {
		return nil, errors.New("you have already voted on this poll")
	}

	// Record votes atomically in Redis and durably in MongoDB.
	for _, optID := range req.OptionIDs {
		if _, err = s.redis.IncrVote(ctx, pollID, optID); err != nil {
			return nil, fmt.Errorf("failed to record vote: %w", err)
		}
		if err = s.polls.IncrementOptionVote(ctx, pollID, optID); err != nil {
			return nil, fmt.Errorf("failed to persist vote: %w", err)
		}
		if err = s.polls.RecordVote(ctx, pollID, voterKey, optID); err != nil {
			return nil, err
		}
	}

	// Build and broadcast live result.
	result, err := s.buildResult(ctx, poll)
	if err != nil {
		return nil, err
	}

	msg, _ := json.Marshal(result)
	_ = s.redis.Publish(ctx, pollID, string(msg))

	return result, nil
}

// GetResults returns the current live result for a poll (no auth required).
func (s *PollService) GetResults(ctx context.Context, pollID string) (*models.PollResult, error) {
	poll, err := s.polls.FindByID(ctx, pollID)
	if err != nil {
		return nil, err
	}
	if poll == nil {
		return nil, errors.New("poll not found")
	}
	return s.buildResult(ctx, poll)
}

// SetActive toggles whether a poll is open for voting.
func (s *PollService) SetActive(ctx context.Context, pollID, creatorID string, active bool) error {
	return s.polls.SetActive(ctx, pollID, creatorID, active)
}

// DeletePoll removes a poll owned by the caller.
func (s *PollService) DeletePoll(ctx context.Context, pollID, creatorID string) error {
	// Remove Redis vote hash.
	_ = s.redis.Client().Del(ctx, fmt.Sprintf("poll:votes:%s", pollID))
	return s.polls.Delete(ctx, pollID, creatorID)
}

// HasVoted checks whether a voter has already voted.
func (s *PollService) HasVoted(ctx context.Context, pollID, voterKey string) (bool, error) {
	return s.polls.HasVoted(ctx, pollID, voterKey)
}

// ---------- internal helpers ----------

// mergeLiveCounts overlays the Redis vote counts onto a poll's options in-place.
func (s *PollService) mergeLiveCounts(ctx context.Context, poll *models.Poll) {
	counts, err := s.redis.GetVotes(ctx, poll.ID.Hex())
	if err != nil || len(counts) == 0 {
		return
	}
	var total int64
	for i, opt := range poll.Options {
		if v, ok := counts[opt.ID]; ok {
			n, _ := strconv.ParseInt(v, 10, 64)
			poll.Options[i].Votes = n
			total += n
		}
	}
	poll.TotalVotes = total
}

// buildResult constructs a PollResult with live Redis counts and percentages.
func (s *PollService) buildResult(ctx context.Context, poll *models.Poll) (*models.PollResult, error) {
	counts, err := s.redis.GetVotes(ctx, poll.ID.Hex())
	if err != nil {
		return nil, fmt.Errorf("failed to get vote counts: %w", err)
	}

	var total int64
	optionCounts := make(map[string]int64, len(poll.Options))
	for _, opt := range poll.Options {
		var v int64
		if s, ok := counts[opt.ID]; ok {
			v, _ = strconv.ParseInt(s, 10, 64)
		}
		optionCounts[opt.ID] = v
		total += v
	}

	results := make([]models.OptionResult, len(poll.Options))
	for i, opt := range poll.Options {
		votes := optionCounts[opt.ID]
		var pct float64
		if total > 0 {
			pct = float64(votes) / float64(total) * 100
		}
		results[i] = models.OptionResult{
			ID:         opt.ID,
			Text:       opt.Text,
			Votes:      votes,
			Percentage: pct,
		}
	}

	return &models.PollResult{
		PollID:     poll.ID.Hex(),
		TotalVotes: total,
		Options:    results,
		UpdatedAt:  time.Now(),
	}, nil
}
