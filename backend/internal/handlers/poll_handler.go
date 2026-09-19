package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/livepoll/backend/internal/middleware"
	"github.com/livepoll/backend/internal/models"
	"github.com/livepoll/backend/internal/realtime"
	"github.com/livepoll/backend/internal/services"
)

// PollHandler exposes all poll-related HTTP endpoints.
type PollHandler struct {
	svc   *services.PollService
	redis *realtime.RedisStore
}

// NewPollHandler creates a new PollHandler.
func NewPollHandler(svc *services.PollService, redis *realtime.RedisStore) *PollHandler {
	return &PollHandler{svc: svc, redis: redis}
}

// CreatePoll godoc
// POST /api/polls  (authenticated)
func (h *PollHandler) CreatePoll(c *gin.Context) {
	var req models.CreatePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	creatorID := c.GetString(middleware.UserIDKey)
	creatorName := c.GetString(middleware.UsernameKey)

	poll, err := h.svc.CreatePoll(c.Request.Context(), req, creatorID, creatorName)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, poll)
}

// GetPoll godoc
// GET /api/polls/:id  (public)
func (h *PollHandler) GetPoll(c *gin.Context) {
	pollID := c.Param("id")
	if pollID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "poll id is required"})
		return
	}

	poll, err := h.svc.GetPoll(c.Request.Context(), pollID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if poll == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "poll not found"})
		return
	}

	c.JSON(http.StatusOK, poll)
}

// GetMyPolls godoc
// GET /api/polls/my  (authenticated)
func (h *PollHandler) GetMyPolls(c *gin.Context) {
	creatorID := c.GetString(middleware.UserIDKey)

	polls, err := h.svc.GetMyPolls(c.Request.Context(), creatorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"polls": polls})
}

// Vote godoc
// POST /api/polls/:id/vote  (public — identified by voter fingerprint)
func (h *PollHandler) Vote(c *gin.Context) {
	pollID := c.Param("id")
	if pollID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "poll id is required"})
		return
	}

	var req models.VoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Voter identity: use IP + optional client fingerprint header.
	voterKey := voterFingerprint(c)

	result, err := h.svc.Vote(c.Request.Context(), pollID, voterKey, req)
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "you have already voted on this poll" {
			status = http.StatusConflict
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetResults godoc
// GET /api/polls/:id/results  (public)
func (h *PollHandler) GetResults(c *gin.Context) {
	pollID := c.Param("id")
	if pollID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "poll id is required"})
		return
	}

	result, err := h.svc.GetResults(c.Request.Context(), pollID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// CheckVoted godoc
// GET /api/polls/:id/voted  (public)
func (h *PollHandler) CheckVoted(c *gin.Context) {
	pollID := c.Param("id")
	voterKey := voterFingerprint(c)

	voted, err := h.svc.HasVoted(c.Request.Context(), pollID, voterKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"voted": voted})
}

// SetActive godoc
// PATCH /api/polls/:id/active  (authenticated, owner only)
func (h *PollHandler) SetActive(c *gin.Context) {
	pollID := c.Param("id")
	creatorID := c.GetString(middleware.UserIDKey)

	var body struct {
		Active bool `json:"active"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.SetActive(c.Request.Context(), pollID, creatorID, body.Active); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"active": body.Active})
}

// DeletePoll godoc
// DELETE /api/polls/:id  (authenticated, owner only)
func (h *PollHandler) DeletePoll(c *gin.Context) {
	pollID := c.Param("id")
	creatorID := c.GetString(middleware.UserIDKey)

	if err := h.svc.DeletePoll(c.Request.Context(), pollID, creatorID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "poll deleted"})
}

// StreamResults godoc
// GET /api/polls/:id/stream  (public — Server-Sent Events)
//
// Subscribes to the Redis Pub/Sub channel for this poll and forwards
// every update to the browser as an SSE event. The connection stays open
// until the client disconnects.
func (h *PollHandler) StreamResults(c *gin.Context) {
	pollID := c.Param("id")
	if pollID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "poll id is required"})
		return
	}

	// Verify the poll exists before opening the stream.
	result, err := h.svc.GetResults(c.Request.Context(), pollID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "poll not found"})
		return
	}

	// Set SSE headers.
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no") // disable nginx buffering

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "streaming unsupported"})
		return
	}

	// Send the current state immediately so the client doesn't wait for a vote.
	initial, _ := json.Marshal(result)
	fmt.Fprintf(c.Writer, "data: %s\n\n", initial)
	flusher.Flush()

	// Subscribe to Redis Pub/Sub for live updates.
	sub := h.redis.Subscribe(c.Request.Context(), pollID)
	defer sub.Close()

	ch := sub.Channel()
	ticker := time.NewTicker(30 * time.Second) // heartbeat to keep connection alive
	defer ticker.Stop()

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				return
			}
			fmt.Fprintf(c.Writer, "data: %s\n\n", msg.Payload)
			flusher.Flush()

		case <-ticker.C:
			// Send a comment as a keep-alive heartbeat.
			fmt.Fprintf(c.Writer, ": heartbeat\n\n")
			flusher.Flush()

		case <-c.Request.Context().Done():
			// Client disconnected.
			return
		}
	}
}

// voterFingerprint builds a voter identity string from the request.
// Uses a client-provided fingerprint header if present, otherwise falls back to IP.
func voterFingerprint(c *gin.Context) string {
	fp := c.GetHeader("X-Voter-Fingerprint")
	if fp != "" && len(fp) <= 128 {
		return "fp:" + fp
	}
	return "ip:" + c.ClientIP()
}
