package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	FirstName    string    `json:"first_name"`
	LastName     string    `json:"last_name"`
	Role         string    `json:"role"`
	IsFirstLogin bool      `json:"is_first_login"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

type UserRepository interface {
	CreateUser(ctx context.Context, user *User) error
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	GetUserByUsername(ctx context.Context, username string) (*User, error)
	GetUserByID(ctx context.Context, id int) (*User, error)
	UpdateUserPassword(ctx context.Context, id int, passwordHash string) error
	SetFirstLoginDone(ctx context.Context, id int) error

	// Token revocation (persistent fallback for cache)
	RevokeToken(ctx context.Context, tokenHash string, expiresAt time.Time) error
	IsTokenRevoked(ctx context.Context, tokenHash string) (bool, error)
	CleanupExpiredTokens(ctx context.Context) error
}

type RefreshToken struct {
	ID        uuid.UUID `json:"id"`
	TokenHash string    `json:"token_hash"`
	UserType  string    `json:"user_type"` // 'admin' or 'student'
	UserID    string    `json:"user_id"`   // string representation of ID
	FamilyID  uuid.UUID `json:"family_id"`
	ExpiresAt time.Time `json:"expires_at"`
	Revoked   bool      `json:"revoked"`
	CreatedAt time.Time `json:"created_at"`
}

type RefreshTokenRepository interface {
	CreateRefreshToken(ctx context.Context, rt *RefreshToken) error
	GetRefreshTokenByHash(ctx context.Context, hash string) (*RefreshToken, error)
	RevokeRefreshTokenFamily(ctx context.Context, familyID uuid.UUID) error
	RevokeRefreshToken(ctx context.Context, id uuid.UUID) error
	CleanupExpiredRefreshTokens(ctx context.Context) error
}

type AuthService interface {
	LoginUser(ctx context.Context, email, password string) (*AdminAuthResponse, error)
	RefreshAdminToken(ctx context.Context, refreshToken string) (*AdminAuthResponse, string, error)
	InviteAdmin(ctx context.Context, inviterID int, req *InviteAdminRequest) error
	ChangeAdminPassword(ctx context.Context, userID int, req *ChangeAdminPasswordRequest) error
	RevokeToken(ctx context.Context, rawToken string) error
	RevokeRefreshTokens(ctx context.Context, refreshToken string) error
	GetAdminSession(ctx context.Context, userID int) (*AdminSessionResponse, error)
}

type AdminSessionResponse struct {
	UserID       int    `json:"user_id"`
	Role         string `json:"role"`
	IsFirstLogin bool   `json:"is_first_login"`
}

type InviteAdminRequest struct {
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type ChangeAdminPasswordRequest struct {
	NewPassword string `json:"new_password"`
}

type AdminAuthResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token,omitempty"`
	IsFirstLogin bool   `json:"is_first_login"`
	Role         string `json:"role"`
	User         *User  `json:"user"`
}
