package realtime

import (
	"context"
	"fmt"
	"strings"

	"github.com/redis/go-redis/v9"
)

const (
	// pollVoteKey is a Redis Hash: field=optionID, value=count
	pollVoteKey = "poll:votes:%s"
	// pollChannel is the Pub/Sub channel for live result broadcasts
	pollChannel = "poll:updates:%s"
)

// RedisStore wraps go-redis and provides domain-specific methods
// for vote counting and real-time pub/sub messaging.
type RedisStore struct {
	client *redis.Client
}

// NewRedisStore connects to Redis and pings to verify connectivity.
//
// addr can be either:
//   - a full URL:  rediss://:password@host:port  (Upstash / TLS)
//   - a plain addr: host:port                    (local Redis, no TLS)
//
// When addr starts with "redis://" or "rediss://", go-redis ParseURL handles
// TLS, ServerName, and authentication automatically — which is what Upstash
// requires. Plain host:port is kept for local development.
func NewRedisStore(addr, password string) (*RedisStore, error) {
	var opts *redis.Options
	var err error

	if strings.HasPrefix(addr, "redis://") || strings.HasPrefix(addr, "rediss://") {
		// Full URL mode — TLS and auth are encoded in the URL itself.
		opts, err = redis.ParseURL(addr)
		if err != nil {
			return nil, fmt.Errorf("redis: invalid URL %q: %w", addr, err)
		}
	} else {
		// Plain host:port mode — used for local development.
		opts = &redis.Options{
			Addr:     addr,
			Password: password,
			DB:       0,
		}
	}

	client := redis.NewClient(opts)
	if err := client.Ping(context.Background()).Err(); err != nil {
		return nil, fmt.Errorf("redis ping failed: %w", err)
	}
	return &RedisStore{client: client}, nil
}

// IncrVote atomically increments the vote counter for a specific option
// in a poll and returns the new count for that option.
// Redis Hash: key=poll:votes:<pollID>, field=<optionID>, value=count
func (r *RedisStore) IncrVote(ctx context.Context, pollID, optionID string) (int64, error) {
	key := fmt.Sprintf(pollVoteKey, pollID)
	return r.client.HIncrBy(ctx, key, optionID, 1).Result()
}

// GetVotes returns all option vote counts for a poll from Redis.
// Returns a map[optionID]count.
func (r *RedisStore) GetVotes(ctx context.Context, pollID string) (map[string]string, error) {
	key := fmt.Sprintf(pollVoteKey, pollID)
	return r.client.HGetAll(ctx, key).Result()
}

// SeedVotes pre-populates Redis with vote counts from MongoDB
// so that Redis is always the live source-of-truth.
func (r *RedisStore) SeedVotes(ctx context.Context, pollID string, options map[string]int64) error {
	key := fmt.Sprintf(pollVoteKey, pollID)
	// Only seed if the key doesn't already exist (avoids overwriting live data).
	exists, err := r.client.Exists(ctx, key).Result()
	if err != nil {
		return err
	}
	if exists > 0 {
		return nil
	}
	fields := make(map[string]interface{}, len(options))
	for optID, count := range options {
		fields[optID] = count
	}
	if len(fields) == 0 {
		return nil
	}
	return r.client.HMSet(ctx, key, fields).Err()
}

// Publish broadcasts a JSON message to all SSE subscribers watching this poll.
func (r *RedisStore) Publish(ctx context.Context, pollID, message string) error {
	channel := fmt.Sprintf(pollChannel, pollID)
	return r.client.Publish(ctx, channel, message).Err()
}

// Subscribe returns a PubSub subscription for live updates on a poll.
// Callers are responsible for closing the subscription.
func (r *RedisStore) Subscribe(ctx context.Context, pollID string) *redis.PubSub {
	channel := fmt.Sprintf(pollChannel, pollID)
	return r.client.Subscribe(ctx, channel)
}

// Client exposes the raw redis.Client for any advanced operations.
func (r *RedisStore) Client() *redis.Client {
	return r.client
}
