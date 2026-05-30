package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
)

type auditService struct {
	repo domain.AuditRepository
}

func NewAuditService(repo domain.AuditRepository) domain.AuditService {
	return &auditService{
		repo: repo,
	}
}

func (s *auditService) LogAction(ctx context.Context, actorID, actorRole, action, resourceType string, resourceID *string, details interface{}, ipAddress, userAgent *string) error {
	var detailsBytes []byte
	if details != nil {
		b, err := json.Marshal(details)
		if err != nil {
			slog.Warn("Failed to marshal audit details", slog.Any("error", err), slog.String("action", action))
		} else {
			detailsBytes = b
		}
	} else {
		detailsBytes = []byte("{}")
	}

	logEntry := &domain.AuditLog{
		ActorID:      actorID,
		ActorRole:    actorRole,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Details:      detailsBytes,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
	}

	err := s.repo.CreateAuditLog(ctx, logEntry)
	if err != nil {
		// We don't want audit log failures to crash the main request usually, but we should log it loudly
		slog.Error("Failed to write audit log to database", slog.Any("error", err), slog.Any("logEntry", logEntry))
		return fmt.Errorf("failed to create audit log: %w", err)
	}

	return nil
}

func (s *auditService) GetRecentAuditLogs(ctx context.Context, limit int, query string, hours int) ([]*domain.AuditLog, error) {
	return s.repo.GetRecentAuditLogs(ctx, limit, query, hours)
}

func (s *auditService) CleanupOldLogs(ctx context.Context, days int) error {
	return s.repo.CleanupOldLogs(ctx, days)
}
