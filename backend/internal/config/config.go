package config

import (
	"os"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	Port        string
	MongoURI    string
	MongoDB     string
	RedisAddr   string
	RedisPasswd string
	JWTSecret   string
	AllowOrigin string
}

// Load reads configuration from environment variables with sensible defaults.
func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		MongoURI:    getEnv("MONGO_URI", "mongodb://localhost:27017"),
		MongoDB:     getEnv("MONGO_DB", "livepoll"),
		RedisAddr:   getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPasswd: getEnv("REDIS_PASSWORD", ""),
		JWTSecret:   getEnv("JWT_SECRET", "change-me-in-production-please"),
		AllowOrigin: getEnv("ALLOW_ORIGIN", "http://localhost:5173"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
