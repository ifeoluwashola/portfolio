package domain

import (
	"context"
	"time"
)

type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	FirstName    string    `json:"first_name"`
	LastName     string    `json:"last_name"`
	PasswordHash string    `json:"-"` // Never expose the password hash
	CreatedAt    time.Time `json:"created_at"`
}

type UserRepository interface {
	CreateUser(ctx context.Context, user *User) error
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	GetUserByUsername(ctx context.Context, username string) (*User, error)
}

type AuthService interface {
	RegisterUser(ctx context.Context, username, email, password, firstName, lastName string) (*User, error)
	LoginUser(ctx context.Context, email, password string) (string, *User, error)
}
