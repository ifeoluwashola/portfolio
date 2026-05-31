package notifications

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/config"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
)

type TelegramService interface {
	SendCohortMessage(ctx context.Context, cohortID int, markdownText string) error
}

type telegramService struct {
	repo domain.AcademyRepository
	cfg  *config.Config
}

func NewTelegramService(repo domain.AcademyRepository, cfg *config.Config) TelegramService {
	return &telegramService{
		repo: repo,
		cfg:  cfg,
	}
}

func (s *telegramService) SendCohortMessage(ctx context.Context, cohortID int, markdownText string) error {
	if s.cfg.TelegramBotToken == "" {
		// Silently skip if no bot token is configured
		return nil
	}

	cohort, err := s.repo.GetCohortByID(ctx, cohortID)
	if err != nil {
		return fmt.Errorf("failed to get cohort: %w", err)
	}

	if cohort.TelegramChatID == nil || *cohort.TelegramChatID == "" {
		// Silently skip if no chat ID is configured for this cohort
		return nil
	}

	payload := map[string]interface{}{
		"chat_id":    *cohort.TelegramChatID,
		"text":       markdownText,
		"parse_mode": "HTML",
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", s.cfg.TelegramBotToken)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(payloadBytes))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send message: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("telegram API returned status: %s", resp.Status)
	}

	return nil
}
