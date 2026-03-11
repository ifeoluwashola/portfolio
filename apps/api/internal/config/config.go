package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DatabaseURL    string
	GithubToken    string
	AllowedOrigins string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	return &Config{
		Port: getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", 
			"postgres://"+getEnv("DB_USER", "postgres")+":"+getEnv("DB_PASSWORD", "postgres")+"@"+getEnv("DB_HOST", "localhost")+":"+getEnv("DB_PORT", "5432")+"/"+getEnv("DB_NAME", "portfolio")+"?sslmode=disable",
		),
		GithubToken:    getEnv("GITHUB_TOKEN", ""),
		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
