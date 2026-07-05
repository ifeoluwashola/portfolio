package service

import (
	"context"
	"errors"
	"fmt"
	"regexp"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/notifications"
)

type WaitlistService struct {
	repo     domain.WaitlistRepository
	notifier *notifications.ResendNotifier
}

func NewWaitlistService(repo domain.WaitlistRepository, notifier *notifications.ResendNotifier) domain.WaitlistService {
	return &WaitlistService{
		repo:     repo,
		notifier: notifier,
	}
}

func (s *WaitlistService) JoinWaitlist(ctx context.Context, req *domain.AddWaitlistRequest) (*domain.WaitlistLead, error) {
	if req.Name == "" {
		return nil, errors.New("name is required")
	}

	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(req.Email) {
		return nil, errors.New("invalid email address")
	}

	if req.WhatsappNumber == "" {
		return nil, errors.New("whatsapp number is required")
	}

	lead := &domain.WaitlistLead{
		Name:           req.Name,
		Email:          req.Email,
		WhatsappNumber: req.WhatsappNumber,
	}

	err := s.repo.AddLead(ctx, lead)
	if err != nil {
		return nil, fmt.Errorf("failed to join waitlist: %w", err)
	}

	return lead, nil
}

func (s *WaitlistService) GetWaitlistLeads(ctx context.Context, limit, offset int) ([]*domain.WaitlistLead, int, error) {
	leads, err := s.repo.GetLeads(ctx, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to fetch waitlist leads: %w", err)
	}

	total, err := s.repo.GetTotalLeadsCount(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to fetch waitlist count: %w", err)
	}

	return leads, total, nil
}

func (s *WaitlistService) BroadcastToWaitlist(ctx context.Context, subject, body string) error {
	if subject == "" {
		return errors.New("subject is required")
	}
	if body == "" {
		return errors.New("body is required")
	}

	leads, err := s.repo.GetAllLeads(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch leads for broadcast: %w", err)
	}

	if len(leads) == 0 {
		return nil
	}

	for _, lead := range leads {
		// Use existing SendCohortEmail to send the promotional waitlist email
		_ = s.notifier.SendCohortEmail(lead.Name, lead.Email, subject, body)
	}

	return nil
}
