package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PollOption is a single answer choice in a poll.
type PollOption struct {
	ID    string `bson:"id"    json:"id"`
	Text  string `bson:"text"  json:"text"`
	Votes int64  `bson:"votes" json:"votes"`
}

// Poll is the core document stored in MongoDB.
type Poll struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"   json:"id"`
	Title        string             `bson:"title"           json:"title"`
	Description  string             `bson:"description"     json:"description"`
	Options      []PollOption       `bson:"options"         json:"options"`
	CreatorID    primitive.ObjectID `bson:"creator_id"      json:"creator_id"`
	CreatorName  string             `bson:"creator_name"    json:"creator_name"`
	IsActive     bool               `bson:"is_active"       json:"is_active"`
	AllowMultiple bool              `bson:"allow_multiple"  json:"allow_multiple"`
	EndsAt       *time.Time         `bson:"ends_at"         json:"ends_at"`
	CreatedAt    time.Time          `bson:"created_at"      json:"created_at"`
	UpdatedAt    time.Time          `bson:"updated_at"      json:"updated_at"`
	TotalVotes   int64              `bson:"total_votes"     json:"total_votes"`
}

// CreatePollRequest is the validated payload for poll creation.
type CreatePollRequest struct {
	Title         string     `json:"title"          binding:"required,min=3,max=200"`
	Description   string     `json:"description"    binding:"max=500"`
	Options       []string   `json:"options"        binding:"required,min=2,max=10,dive,min=1,max=100"`
	AllowMultiple bool       `json:"allow_multiple"`
	EndsAt        *time.Time `json:"ends_at"`
}

// VoteRequest is the validated payload for casting a vote.
type VoteRequest struct {
	OptionIDs []string `json:"option_ids" binding:"required,min=1,max=10,dive,min=1"`
}

// PollResult is the live tally sent to clients over SSE and REST.
type PollResult struct {
	PollID     string             `json:"poll_id"`
	TotalVotes int64              `json:"total_votes"`
	Options    []OptionResult     `json:"options"`
	UpdatedAt  time.Time          `json:"updated_at"`
}

// OptionResult pairs an option with its current vote count and percentage.
type OptionResult struct {
	ID         string  `json:"id"`
	Text       string  `json:"text"`
	Votes      int64   `json:"votes"`
	Percentage float64 `json:"percentage"`
}
