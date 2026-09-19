package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/livepoll/backend/internal/config"
	"github.com/livepoll/backend/internal/handlers"
	"github.com/livepoll/backend/internal/middleware"
	"github.com/livepoll/backend/internal/realtime"
	"github.com/livepoll/backend/internal/repository"
	"github.com/livepoll/backend/internal/services"
	"go.mongodb.org/mongo-driver/mongo"
)

func main() {
	// Load .env if it exists (no-op in production containers).
	_ = godotenv.Load()

	cfg := config.Load()

	// ── MongoDB ──────────────────────────────────────────────────────────────
	mongoClient, err := repository.NewMongoClient(cfg.MongoURI)
	if err != nil {
		log.Fatalf("MongoDB connection failed: %v", err)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = mongoClient.Disconnect(ctx)
	}()
	db := mongoClient.Database(cfg.MongoDB)

	// ── Repositories ─────────────────────────────────────────────────────────
	userRepo, err := repository.NewUserRepository(db)
	if err != nil {
		log.Fatalf("UserRepository setup failed: %v", err)
	}
	pollRepo, err := repository.NewPollRepository(db)
	if err != nil {
		log.Fatalf("PollRepository setup failed: %v", err)
	}

	// ── Redis ────────────────────────────────────────────────────────────────
	redisStore, err := realtime.NewRedisStore(cfg.RedisAddr, cfg.RedisPasswd)
	if err != nil {
		log.Fatalf("Redis connection failed: %v", err)
	}

	// ── Services ─────────────────────────────────────────────────────────────
	authSvc := services.NewAuthService(userRepo, cfg.JWTSecret)
	pollSvc := services.NewPollService(pollRepo, redisStore)

	// ── Handlers ─────────────────────────────────────────────────────────────
	authHandler := handlers.NewAuthHandler(authSvc)
	pollHandler := handlers.NewPollHandler(pollSvc, redisStore)

	// ── Router ───────────────────────────────────────────────────────────────
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.AllowOrigin},
		AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Voter-Fingerprint"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "time": time.Now()})
	})

	api := r.Group("/api")
	{
		// Auth — no JWT required.
		authRoutes := api.Group("/auth")
		{
			authRoutes.POST("/signup", authHandler.Signup)
			authRoutes.POST("/login", authHandler.Login)
		}

		// Public poll routes — no JWT required.
		polls := api.Group("/polls")
		{
			polls.GET("/:id", pollHandler.GetPoll)
			polls.GET("/:id/results", pollHandler.GetResults)
			polls.GET("/:id/stream", pollHandler.StreamResults) // SSE
			polls.GET("/:id/voted", pollHandler.CheckVoted)
			polls.POST("/:id/vote", pollHandler.Vote)
		}

		// Protected poll routes — JWT required.
		protected := api.Group("/polls")
		protected.Use(middleware.RequireAuth(cfg.JWTSecret))
		{
			protected.GET("/my", pollHandler.GetMyPolls)
			protected.POST("", pollHandler.CreatePoll)
			protected.PATCH("/:id/active", pollHandler.SetActive)
			protected.DELETE("/:id", pollHandler.DeletePoll)
		}
	}

	// ── Graceful shutdown ────────────────────────────────────────────────────
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 0, // 0 = no timeout for SSE streams
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("LivePoll server listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Forced shutdown: %v", err)
	}

	// Disconnect MongoDB cleanly.
	_ = disconnectMongo(mongoClient)
	log.Println("Server exited")
}

func disconnectMongo(client *mongo.Client) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return client.Disconnect(ctx)
}
