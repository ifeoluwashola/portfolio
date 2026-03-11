package service

import (
	"context"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	repo domain.UserRepository
}

func NewAuthService(repo domain.UserRepository) domain.AuthService {
	return &AuthService{
		repo: repo,
	}
}

func (s *AuthService) RegisterUser(ctx context.Context, username, email, password, firstName, lastName string) (*domain.User, error) {
	if username == "" || email == "" || password == "" {
		return nil, errors.New("username, email, and password are required")
	}

	// Check if user exists (ignoring errors for simplicity, we just check if it returns a user)
	if existing, _ := s.repo.GetUserByEmail(ctx, email); existing != nil {
		return nil, errors.New("user with that email already exists")
	}
	if existing, _ := s.repo.GetUserByUsername(ctx, username); existing != nil {
		return nil, errors.New("user with that username already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &domain.User{
		Username:     username,
		Email:        email,
		FirstName:    firstName,
		LastName:     lastName,
		PasswordHash: string(hashedPassword),
	}

	err = s.repo.CreateUser(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create user in database: %w", err)
	}

	return user, nil
}

func (s *AuthService) LoginUser(ctx context.Context, email, password string) (string, *domain.User, error) {
	if email == "" || password == "" {
		return "", nil, errors.New("email and password are required")
	}

	user, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return "", nil, errors.New("invalid email or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return "", nil, errors.New("invalid email or password")
	}

	// Generate JWT
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "default_unsafe_secret_for_dev_only" // Fallback for local testing
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // 24 hours expiry
	})

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return tokenString, user, nil
}
