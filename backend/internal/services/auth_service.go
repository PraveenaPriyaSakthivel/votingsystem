package services

import (
	"context"
	"errors"

	"github.com/livepoll/backend/internal/auth"
	"github.com/livepoll/backend/internal/models"
	"github.com/livepoll/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

// AuthService handles user registration and login business logic.
type AuthService struct {
	users     *repository.UserRepository
	jwtSecret string
}

// NewAuthService constructs an AuthService with its dependencies.
func NewAuthService(users *repository.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{users: users, jwtSecret: jwtSecret}
}

// Signup creates a new user, hashes their password, and returns a JWT.
func (s *AuthService) Signup(ctx context.Context, req models.SignupRequest) (*models.AuthResponse, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	user := &models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hash),
	}
	if err = s.users.Create(ctx, user); err != nil {
		return nil, err
	}

	token, err := auth.GenerateToken(user.ID.Hex(), user.Username, s.jwtSecret)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &models.AuthResponse{Token: token, User: *user}, nil
}

// Login verifies credentials and returns a JWT on success.
func (s *AuthService) Login(ctx context.Context, req models.LoginRequest) (*models.AuthResponse, error) {
	user, err := s.users.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("internal error")
	}
	if user == nil {
		return nil, errors.New("invalid email or password")
	}

	if err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	token, err := auth.GenerateToken(user.ID.Hex(), user.Username, s.jwtSecret)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &models.AuthResponse{Token: token, User: *user}, nil
}
