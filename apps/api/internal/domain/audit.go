package domain

import (
	"context"
	"time"
)

type AuditLog struct {
	ID           string    `json:"id"`
	ActorID      string    `json:"actor_id"`
	ActorRole    string    `json:"actor_role"`
	Action       string    `json:"action"`
	ResourceType string    `json:"resource_type"`
	ResourceID   *string   `json:"resource_id,omitempty"`
	Details      []byte    `json:"details,omitempty"`
	IPAddress    *string   `json:"ip_address,omitempty"`
	UserAgent    *string   `json:"user_agent,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

type AuditRepository interface {
	CreateAuditLog(ctx context.Context, log *AuditLog) error
	GetRecentAuditLogs(ctx context.Context, limit int) ([]*AuditLog, error)
}

type AuditService interface {
	LogAction(ctx context.Context, actorID, actorRole, action, resourceType string, resourceID *string, details interface{}, ipAddress, userAgent *string) error
	GetRecentAuditLogs(ctx context.Context, limit int) ([]*AuditLog, error)
}
