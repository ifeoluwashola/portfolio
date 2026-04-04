package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port              string
	DatabaseURL       string
	GithubToken       string
	AllowedOrigins    string
	ResendAPIKey      string
	NotificationEmail string
	PaystackSecretKey string
	FrontendURL       string
	JWTSecret         string
	RedisURL          string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("FATAL: JWT_SECRET environment variable is required but not set")
	}

	return &Config{
		Port: getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", 
			"postgres://"+getEnv("DB_USER", "postgres")+":"+getEnv("DB_PASSWORD", "postgres")+"@"+getEnv("DB_HOST", "localhost")+":"+getEnv("DB_PORT", "5432")+"/"+getEnv("DB_NAME", "portfolio")+"?sslmode=disable",
		),
		GithubToken:       getEnv("GITHUB_TOKEN", ""),
		AllowedOrigins:    getEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001"),
		ResendAPIKey:      getEnv("RESEND_API_KEY", ""),
		NotificationEmail: getEnv("NOTIFICATION_EMAIL", ""),
		PaystackSecretKey: getEnv("PAYSTACK_SECRET_KEY", ""),
		FrontendURL:       getEnv("FRONTEND_URL", "http://localhost:3000"),
		JWTSecret:         jwtSecret,
		RedisURL:          getEnv("REDIS_URL", ""),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
