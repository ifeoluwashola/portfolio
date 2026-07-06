package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/config"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/notifications"
)

type WaitlistService struct {
	repo     domain.WaitlistRepository
	notifier *notifications.ResendNotifier
	cfg      *config.Config
}

func NewWaitlistService(repo domain.WaitlistRepository, notifier *notifications.ResendNotifier, cfg *config.Config) domain.WaitlistService {
	return &WaitlistService{
		repo:     repo,
		notifier: notifier,
		cfg:      cfg,
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

	existing, err := s.repo.GetLeadByEmail(ctx, req.Email)
	if err == nil && existing != nil {
		return existing, nil
	}

	lead := &domain.WaitlistLead{
		Name:           req.Name,
		Email:          req.Email,
		WhatsappNumber: req.WhatsappNumber,
	}

	err = s.repo.AddLead(ctx, lead)
	if err != nil {
		return nil, fmt.Errorf("failed to join waitlist: %w", err)
	}

	// Send welcome email for new waitlist signups
	if s.notifier != nil {
		_ = s.notifier.SendWaitlistWelcomeEmail(req.Name, req.Email)
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

func (s *WaitlistService) InitializeCheckout(ctx context.Context, email string, amountNgn float64) (string, error) {
	if email == "" {
		return "", errors.New("email is required")
	}
	if amountNgn <= 0 {
		return "", errors.New("amount must be greater than zero")
	}

	// 1. Verify email exists in waitlist
	_, err := s.repo.GetLeadByEmail(ctx, email)
	if err != nil {
		return "", fmt.Errorf("email is not registered on the waitlist: %w", err)
	}

	// 2. Convert NGN -> Kobo
	amountKobo := int(amountNgn * 100)

	// 3. Initialize transaction on Paystack
	paystackReqBody := map[string]interface{}{
		"email":        email,
		"amount":       amountKobo,
		"callback_url": s.cfg.FrontendURL + "/academy/deposit-success",
		"metadata": map[string]interface{}{
			"transaction_type": "waitlist_deposit",
			"email":            email,
		},
	}

	bodyBytes, err := json.Marshal(paystackReqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal paystack payload: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", "https://api.paystack.co/transaction/initialize", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("failed to create http request: %w", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+s.cfg.PaystackSecretKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("failed to communicate with Paystack: %w", err)
	}
	defer resp.Body.Close()

	var paystackResp domain.PaystackInitResponse
	if err := json.NewDecoder(resp.Body).Decode(&paystackResp); err != nil {
		return "", fmt.Errorf("failed to decode response from paystack: %w", err)
	}

	if !paystackResp.Status {
		return "", fmt.Errorf("paystack initialization failed: %s", paystackResp.Message)
	}

	return paystackResp.Data.AuthorizationURL, nil
}
