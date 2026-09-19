package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/livepoll/backend/internal/models"
	"github.com/livepoll/backend/internal/services"
)

// AuthHandler exposes signup and login endpoints.
type AuthHandler struct {
	svc *services.AuthService
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(svc *services.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

// Signup godoc
// POST /api/auth/signup
func (h *AuthHandler) Signup(c *gin.Context) {
	var req models.SignupRequest
	// binding:"required,..." tags enforce all validation server-side.
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.svc.Signup(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, resp)
}

// Login godoc
// POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.svc.Login(c.Request.Context(), req)
	if err != nil {
		// Always return 401 for bad credentials; never leak which field is wrong.
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}
