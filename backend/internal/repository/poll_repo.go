package repository

import (
	"context"
	"errors"
	"time"

	"github.com/livepoll/backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// PollRepository handles all poll persistence operations.
type PollRepository struct {
	polls *mongo.Collection
	votes *mongo.Collection
}

// NewPollRepository creates the repo and sets up indexes.
func NewPollRepository(db *mongo.Database) (*PollRepository, error) {
	polls := db.Collection("polls")
	votes := db.Collection("votes")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Index polls by creator for the dashboard query.
	_, err := polls.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "creator_id", Value: 1}},
	})
	if err != nil {
		return nil, err
	}

	// Compound unique index: one voter IP+fingerprint per option per poll.
	_, err = votes.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "poll_id", Value: 1},
			{Key: "voter_key", Value: 1},
			{Key: "option_id", Value: 1},
		},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return nil, err
	}

	return &PollRepository{polls: polls, votes: votes}, nil
}

// Create inserts a new poll and returns it with its generated ID.
func (r *PollRepository) Create(ctx context.Context, poll *models.Poll) error {
	poll.ID = primitive.NewObjectID()
	poll.CreatedAt = time.Now()
	poll.UpdatedAt = time.Now()
	poll.IsActive = true
	_, err := r.polls.InsertOne(ctx, poll)
	return err
}

// FindByID fetches a single poll by its hex ID string.
func (r *PollRepository) FindByID(ctx context.Context, id string) (*models.Poll, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, errors.New("invalid poll id")
	}
	var poll models.Poll
	err = r.polls.FindOne(ctx, bson.M{"_id": oid}).Decode(&poll)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &poll, err
}

// FindByCreator returns all polls created by a specific user, newest first.
func (r *PollRepository) FindByCreator(ctx context.Context, creatorID string) ([]models.Poll, error) {
	oid, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return nil, errors.New("invalid creator id")
	}
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
	cursor, err := r.polls.Find(ctx, bson.M{"creator_id": oid}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var polls []models.Poll
	if err = cursor.All(ctx, &polls); err != nil {
		return nil, err
	}
	return polls, nil
}

// UpdateVoteCount atomically increments the vote count for a specific option
// in MongoDB (Redis is the source-of-truth for live counts; this keeps Mongo
// in sync for durability).
func (r *PollRepository) IncrementOptionVote(ctx context.Context, pollID, optionID string) error {
	oid, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return errors.New("invalid poll id")
	}
	_, err = r.polls.UpdateOne(ctx,
		bson.M{"_id": oid, "options.id": optionID},
		bson.M{
			"$inc": bson.M{
				"options.$.votes": 1,
				"total_votes":     1,
			},
			"$set": bson.M{"updated_at": time.Now()},
		},
	)
	return err
}

// SetActive toggles whether a poll accepts votes.
func (r *PollRepository) SetActive(ctx context.Context, pollID, creatorID string, active bool) error {
	pollOID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return errors.New("invalid poll id")
	}
	creatorOID, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return errors.New("invalid creator id")
	}
	res, err := r.polls.UpdateOne(ctx,
		bson.M{"_id": pollOID, "creator_id": creatorOID},
		bson.M{"$set": bson.M{"is_active": active, "updated_at": time.Now()}},
	)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return errors.New("poll not found or not owned by you")
	}
	return nil
}

// Delete removes a poll and all its vote records.
func (r *PollRepository) Delete(ctx context.Context, pollID, creatorID string) error {
	pollOID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return errors.New("invalid poll id")
	}
	creatorOID, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return errors.New("invalid creator id")
	}
	res, err := r.polls.DeleteOne(ctx, bson.M{"_id": pollOID, "creator_id": creatorOID})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return errors.New("poll not found or not owned by you")
	}
	// Clean up vote records.
	_, _ = r.votes.DeleteMany(ctx, bson.M{"poll_id": pollID})
	return nil
}

// HasVoted checks whether a voter key has already voted on this poll.
func (r *PollRepository) HasVoted(ctx context.Context, pollID, voterKey string) (bool, error) {
	count, err := r.votes.CountDocuments(ctx, bson.M{
		"poll_id":   pollID,
		"voter_key": voterKey,
	})
	return count > 0, err
}

// RecordVote stores a vote record to prevent double-voting.
func (r *PollRepository) RecordVote(ctx context.Context, pollID, voterKey, optionID string) error {
	_, err := r.votes.InsertOne(ctx, bson.M{
		"poll_id":    pollID,
		"voter_key":  voterKey,
		"option_id":  optionID,
		"created_at": time.Now(),
	})
	if mongo.IsDuplicateKeyError(err) {
		return errors.New("already voted")
	}
	return err
}
