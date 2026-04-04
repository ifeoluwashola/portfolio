package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/cache"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/config"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	repo         domain.UserRepository
	cfg          *config.Config
	cache        cache.TokenCache
	notification domain.NotificationService
}

func NewAuthService(repo domain.UserRepository, cfg *config.Config, tokenCache cache.TokenCache, notification domain.NotificationService) domain.AuthService {
	return &AuthService{
		repo:         repo,
		cfg:          cfg,
		cache:        tokenCache,
		notification: notification,
	}
}

func (s *AuthService) LoginUser(ctx context.Context, email, password string) (*domain.AdminAuthResponse, error) {
	if email == "" || password == "" {
		return nil, errors.New("email and password are required")
	}

	user, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      user.ID,
		"email":    user.Email,
		"username": user.Username,
		"role":     user.Role,
		"type":     "admin",
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
		"iat":      time.Now().Unix(),
	})

	tokenString, err := token.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &domain.AdminAuthResponse{
		Token:        tokenString,
		IsFirstLogin: user.IsFirstLogin,
		Role:         user.Role,
		User:         user,
	}, nil
}

func (s *AuthService) InviteAdmin(ctx context.Context, inviterID int, req *domain.InviteAdminRequest) error {
	if req.Email == "" || req.FirstName == "" || req.LastName == "" {
		return errors.New("email, first_name, and last_name are required")
	}

	// Check if user already exists
	if existing, _ := s.repo.GetUserByEmail(ctx, req.Email); existing != nil {
		return errors.New("an admin with this email already exists")
	}

	// Generate a secure temporary password
	tempPassword, err := generateTempPassword(16)
	if err != nil {
		return fmt.Errorf("failed to generate temporary password: %w", err)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(tempPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Generate username from email prefix
	username := req.Email[:findAtIndex(req.Email)]

	user := &domain.User{
		Username:     username,
		Email:        req.Email,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		PasswordHash: string(hashedPassword),
		Role:         "admin",
		IsFirstLogin: true,
	}

	err = s.repo.CreateUser(ctx, user)
	if err != nil {
		return fmt.Errorf("failed to create admin user: %w", err)
	}

	// Send invite email with temporary password
	if s.notification != nil {
		_ = s.notification.SendAdminInviteEmail(req.FirstName, req.Email, tempPassword)
	}

	return nil
}

func (s *AuthService) ChangeAdminPassword(ctx context.Context, userID int, req *domain.ChangeAdminPasswordRequest) error {
	if req.NewPassword == "" || len(req.NewPassword) < 8 {
		return errors.New("password must be at least 8 characters")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	return s.repo.UpdateUserPassword(ctx, userID, string(hashedPassword))
}

func (s *AuthService) RevokeToken(ctx context.Context, rawToken string) error {
	hash := hashToken(rawToken)

	// Parse the token to get expiry for TTL
	token, _ := jwt.Parse(rawToken, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.cfg.JWTSecret), nil
	})

	var ttl time.Duration = 24 * time.Hour // default
	if token != nil {
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if exp, ok := claims["exp"].(float64); ok {
				remaining := time.Until(time.Unix(int64(exp), 0))
				if remaining > 0 {
					ttl = remaining
				}
			}
		}
	}

	// Write to cache (fast path)
	_ = s.cache.Revoke(ctx, hash, ttl)

	// Write to DB (persistent fallback)
	return s.repo.RevokeToken(ctx, hash, time.Now().Add(ttl))
}

// hashToken creates a SHA-256 hash of a JWT for storage (never store raw tokens)
func hashToken(rawToken string) string {
	h := sha256.Sum256([]byte(rawToken))
	return hex.EncodeToString(h[:])
}

// HashToken is exported for use by middleware
func HashToken(rawToken string) string {
	return hashToken(rawToken)
}

func generateTempPassword(length int) (string, error) {
	const charset = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%"
	result := make([]byte, length)
	for i := range result {
		idx, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		result[i] = charset[idx.Int64()]
	}
	return string(result), nil
}

func findAtIndex(email string) int {
	for i, c := range email {
		if c == '@' {
			return i
		}
	}
	return len(email)
}
