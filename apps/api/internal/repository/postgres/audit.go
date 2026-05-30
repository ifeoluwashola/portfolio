package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
)

type AuditRepository struct {
	pool *pgxpool.Pool
}

func NewAuditRepository(pool *pgxpool.Pool) domain.AuditRepository {
	return &AuditRepository{
		pool: pool,
	}
}

func (r *AuditRepository) CreateAuditLog(ctx context.Context, log *domain.AuditLog) error {
	query := `
		INSERT INTO audit_logs (actor_id, actor_role, action, resource_type, resource_id, details, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at
	`
	err := r.pool.QueryRow(
		ctx,
		query,
		log.ActorID,
		log.ActorRole,
		log.Action,
		log.ResourceType,
		log.ResourceID,
		log.Details,
		log.IPAddress,
		log.UserAgent,
	).Scan(&log.ID, &log.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to insert audit log: %w", err)
	}

	return nil
}

func (r *AuditRepository) GetRecentAuditLogs(ctx context.Context, limit int) ([]*domain.AuditLog, error) {
	query := `
		SELECT id, actor_id, actor_role, action, resource_type, resource_id, details, ip_address, user_agent, created_at
		FROM audit_logs
		ORDER BY created_at DESC
		LIMIT $1
	`
	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query audit logs: %w", err)
	}
	defer rows.Close()

	var logs []*domain.AuditLog
	for rows.Next() {
		var l domain.AuditLog
		err := rows.Scan(
			&l.ID,
			&l.ActorID,
			&l.ActorRole,
			&l.Action,
			&l.ResourceType,
			&l.ResourceID,
			&l.Details,
			&l.IPAddress,
			&l.UserAgent,
			&l.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan audit log: %w", err)
		}
		logs = append(logs, &l)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("row iteration error: %w", err)
	}

	return logs, nil
}
