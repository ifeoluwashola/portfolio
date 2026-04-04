package postgres

import (
	"context"
	"fmt"
	"time"

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
		INSERT INTO users (username, email, first_name, last_name, password_hash, role, is_first_login)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
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
		user.Role,
		user.IsFirstLogin,
	).Scan(&user.ID, &user.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to insert user: %w", err)
	}

	return nil
}

func (r *UserRepository) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, username, email, first_name, last_name, password_hash, role, is_first_login, created_at
		FROM users
		WHERE email = $1
	`
	var p domain.User
	err := r.pool.QueryRow(ctx, query, email).Scan(
		&p.ID, &p.Username, &p.Email, &p.FirstName, &p.LastName,
		&p.PasswordHash, &p.Role, &p.IsFirstLogin, &p.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return &p, nil
}

func (r *UserRepository) GetUserByUsername(ctx context.Context, username string) (*domain.User, error) {
	query := `
		SELECT id, username, email, first_name, last_name, password_hash, role, is_first_login, created_at
		FROM users
		WHERE username = $1
	`
	var p domain.User
	err := r.pool.QueryRow(ctx, query, username).Scan(
		&p.ID, &p.Username, &p.Email, &p.FirstName, &p.LastName,
		&p.PasswordHash, &p.Role, &p.IsFirstLogin, &p.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return &p, nil
}

func (r *UserRepository) GetUserByID(ctx context.Context, id int) (*domain.User, error) {
	query := `
		SELECT id, username, email, first_name, last_name, password_hash, role, is_first_login, created_at
		FROM users
		WHERE id = $1
	`
	var p domain.User
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.Username, &p.Email, &p.FirstName, &p.LastName,
		&p.PasswordHash, &p.Role, &p.IsFirstLogin, &p.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return &p, nil
}

func (r *UserRepository) UpdateUserPassword(ctx context.Context, id int, passwordHash string) error {
	query := `UPDATE users SET password_hash = $1, is_first_login = false WHERE id = $2`
	_, err := r.pool.Exec(ctx, query, passwordHash, id)
	return err
}

func (r *UserRepository) SetFirstLoginDone(ctx context.Context, id int) error {
	query := `UPDATE users SET is_first_login = false WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}

// --- Token Revocation (persistent storage fallback) ---

func (r *UserRepository) RevokeToken(ctx context.Context, tokenHash string, expiresAt time.Time) error {
	query := `
		INSERT INTO revoked_tokens (token_hash, expires_at)
		VALUES ($1, $2)
		ON CONFLICT (token_hash) DO NOTHING
	`
	_, err := r.pool.Exec(ctx, query, tokenHash, expiresAt)
	return err
}

func (r *UserRepository) IsTokenRevoked(ctx context.Context, tokenHash string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM revoked_tokens WHERE token_hash = $1 AND expires_at > NOW())`
	var exists bool
	err := r.pool.QueryRow(ctx, query, tokenHash).Scan(&exists)
	return exists, err
}

func (r *UserRepository) CleanupExpiredTokens(ctx context.Context) error {
	query := `DELETE FROM revoked_tokens WHERE expires_at < NOW()`
	_, err := r.pool.Exec(ctx, query)
	return err
}
