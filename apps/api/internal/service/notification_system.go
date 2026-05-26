package service

import (
	"context"
	"time"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/google/uuid"
)

// NotificationSystem defines the centralized in-app notification system
type NotificationSystem interface {
	NotifyUser(ctx context.Context, actorID *string, targetUserID string, notifType string, message string, referenceURL *string) error
	NotifyCohort(ctx context.Context, actorID *string, cohortID int, notifType string, message string, referenceURL *string) error
}

type notificationSystem struct {
	repo domain.AcademyRepository
}

func NewNotificationSystem(repo domain.AcademyRepository) NotificationSystem {
	return &notificationSystem{
		repo: repo,
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

	return s.repo.BulkCreateNotifications(ctx, notifications)
}
