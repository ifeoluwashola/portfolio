package postgres

import (
	"context"
	"fmt"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) domain.UserRepository {
	return &UserRepository{
		pool: pool,
	}
}

func (r *UserRepository) CreateUser(ctx context.Context, user *domain.User) error {
	query := `
		INSERT INTO users (username, email, first_name, last_name, password_hash)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`
	err := r.pool.QueryRow(
		ctx,
		query,
		user.Username,
		user.Email,
		user.FirstName,
		user.LastName,
		user.PasswordHash,
	).Scan(&user.ID, &user.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to insert user: %w", err)
	}

	return nil
}

func (r *UserRepository) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, username, email, first_name, last_name, password_hash, created_at
		FROM users
		WHERE email = $1
	`
	var p domain.User
	err := r.pool.QueryRow(ctx, query, email).Scan(
		&p.ID,
		&p.Username,
		&p.Email,
		&p.FirstName,
		&p.LastName,
		&p.PasswordHash,
		&p.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return &p, nil
}

func (r *UserRepository) GetUserByUsername(ctx context.Context, username string) (*domain.User, error) {
	query := `
		SELECT id, username, email, first_name, last_name, password_hash, created_at
		FROM users
		WHERE username = $1
	`
	var p domain.User
	err := r.pool.QueryRow(ctx, query, username).Scan(
		&p.ID,
		&p.Username,
		&p.Email,
		&p.FirstName,
		&p.LastName,
		&p.PasswordHash,
		&p.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return &p, nil
}
