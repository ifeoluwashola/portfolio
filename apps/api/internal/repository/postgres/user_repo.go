package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
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

// --- Refresh Token Repository Implementation ---

func (r *UserRepository) CreateRefreshToken(ctx context.Context, rt *domain.RefreshToken) error {
	query := `
		INSERT INTO refresh_tokens (token_hash, user_type, user_id, family_id, expires_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`
	return r.pool.QueryRow(
		ctx,
		query,
		rt.TokenHash,
		rt.UserType,
		rt.UserID,
		rt.FamilyID,
		rt.ExpiresAt,
	).Scan(&rt.ID, &rt.CreatedAt)
}

func (r *UserRepository) GetRefreshTokenByHash(ctx context.Context, hash string) (*domain.RefreshToken, error) {
	query := `
		SELECT id, token_hash, user_type, user_id, family_id, expires_at, revoked, created_at
		FROM refresh_tokens
		WHERE token_hash = $1
	`
	var rt domain.RefreshToken
	err := r.pool.QueryRow(ctx, query, hash).Scan(
		&rt.ID, &rt.TokenHash, &rt.UserType, &rt.UserID, &rt.FamilyID, &rt.ExpiresAt, &rt.Revoked, &rt.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &rt, nil
}

func (r *UserRepository) RevokeRefreshTokenFamily(ctx context.Context, familyID uuid.UUID) error {
	query := `UPDATE refresh_tokens SET revoked = true WHERE family_id = $1`
	_, err := r.pool.Exec(ctx, query, familyID)
	return err
}

func (r *UserRepository) RevokeRefreshToken(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE refresh_tokens SET revoked = true WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}

func (r *UserRepository) CleanupExpiredRefreshTokens(ctx context.Context) error {
	query := `DELETE FROM refresh_tokens WHERE expires_at < NOW()`
	_, err := r.pool.Exec(ctx, query)
	return err
}
