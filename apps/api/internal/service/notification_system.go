package service

import (
	"context"
	"time"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/config"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/notifications"
	"github.com/google/uuid"
	"fmt"
	"strings"
)

// NotificationSystem defines the centralized in-app notification system
type NotificationSystem interface {
	NotifyUser(ctx context.Context, actorID *string, targetUserID string, notifType string, message string, referenceURL *string) error
	NotifyCohort(ctx context.Context, actorID *string, cohortID int, notifType string, message string, referenceURL *string) error
}

type notificationSystem struct {
	repo        domain.AcademyRepository
	telegramSvc notifications.TelegramService
	cfg         *config.Config
}

func NewNotificationSystem(repo domain.AcademyRepository, telegramSvc notifications.TelegramService, cfg *config.Config) NotificationSystem {
	return &notificationSystem{
		repo:        repo,
		telegramSvc: telegramSvc,
		cfg:         cfg,
	}
}

func (s *notificationSystem) NotifyUser(ctx context.Context, actorID *string, targetUserID string, notifType string, message string, referenceURL *string) error {
	notif := &domain.Notification{
		ID:           uuid.New(),
		UserID:       targetUserID,
		ActorID:      actorID,
		Type:         notifType,
		Message:      message,
		ReferenceURL: referenceURL,
		IsRead:       false,
		CreatedAt:    time.Now(),
	}
	return s.repo.CreateNotification(ctx, notif)
}

func (s *notificationSystem) NotifyCohort(ctx context.Context, actorID *string, cohortID int, notifType string, message string, referenceURL *string) error {
	// Fetch all students for the given cohort
	// We need a method to get all students in a cohort, or we can just fetch all students and filter.
	// Wait, AcademyRepository doesn't have a GetStudentsByCohortID yet.
	// We can use GetAllStudents and filter by cohortID.
	students, err := s.repo.GetAllStudents(ctx)
	if err != nil {
		return err
	}

	var notifications []*domain.Notification
	now := time.Now()
	for _, st := range students {
		if st.CohortID == cohortID {
			notifications = append(notifications, &domain.Notification{
				ID:           uuid.New(),
				UserID:       st.ID.String(),
				ActorID:      actorID,
				Type:         notifType,
				Message:      message,
				ReferenceURL: referenceURL,
				IsRead:       false,
				CreatedAt:    now,
			})
		}
	}

	if len(notifications) == 0 {
		return nil
	}

	// Trigger telegram message asynchronously
	if s.telegramSvc != nil {
		go func() {
			var link string
			if referenceURL != nil {
				frontendURL := s.cfg.FrontendURL
				if frontendURL == "" {
					frontendURL = "https://kyberncloud.com"
				}
				fullURL := strings.TrimSuffix(frontendURL, "/")
				if !strings.HasPrefix(*referenceURL, "/") {
					fullURL += "/"
				}
				fullURL += *referenceURL
				link = "\n\n🔗 " + fullURL
			}
			msgText := fmt.Sprintf("🔔 *%s*\n\n%s%s", notifType, message, link)
			// A background context since the parent ctx might cancel before this finishes
			_ = s.telegramSvc.SendCohortMessage(context.Background(), cohortID, msgText)
		}()
	}

	return s.repo.BulkCreateNotifications(ctx, notifications)
}
