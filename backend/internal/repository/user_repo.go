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

// UserRepository handles all user persistence operations.
type UserRepository struct {
	col *mongo.Collection
}

// NewUserRepository creates the repo and ensures required indexes exist.
func NewUserRepository(db *mongo.Database) (*UserRepository, error) {
	col := db.Collection("users")

	// Unique index on email and username to prevent duplicates.
	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "username", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if _, err := col.Indexes().CreateMany(ctx, indexes); err != nil {
		return nil, err
	}

	return &UserRepository{col: col}, nil
}

// Create inserts a new user document.
func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	user.ID = primitive.NewObjectID()
	user.CreatedAt = time.Now()
	_, err := r.col.InsertOne(ctx, user)
	if mongo.IsDuplicateKeyError(err) {
		return errors.New("email or username already taken")
	}
	return err
}

// FindByEmail looks up a user by their email address.
func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.col.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &user, err
}

// FindByID looks up a user by their ObjectID string.
func (r *UserRepository) FindByID(ctx context.Context, id string) (*models.User, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	var user models.User
	err = r.col.FindOne(ctx, bson.M{"_id": oid}).Decode(&user)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	return &user, err
}
