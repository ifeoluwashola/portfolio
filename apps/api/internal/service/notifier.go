package service

import (
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
)

// Notifier defines the interface for sending notifications.
type Notifier interface {
	SendNotification(lead *domain.ContactLead) error
}
