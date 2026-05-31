package cron

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/config"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/notifications"
)

func StartSessionReminderCron(ctx context.Context, repo domain.AcademyRepository, telegramSvc notifications.TelegramService, cfg *config.Config) {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	slog.Info("Started session reminder cron engine")

	for {
		select {
		case <-ctx.Done():
			slog.Info("Stopping session reminder cron engine")
			return
		case <-ticker.C:
			processReminders(ctx, repo, telegramSvc, cfg)
		}
	}
}

func processReminders(ctx context.Context, repo domain.AcademyRepository, telegramSvc notifications.TelegramService, cfg *config.Config) {
	// Look for sessions starting between 9 and 10 minutes from now
	now := time.Now()
	from := now.Add(9 * time.Minute)
	to := now.Add(10 * time.Minute)

	sessions, err := repo.GetUpcomingSessions(ctx, from, to)
	if err != nil {
		slog.Error("Failed to fetch upcoming sessions for reminders", "error", err)
		return
	}

	for _, session := range sessions {
		// Needs to get cohort ID, but we only have CohortWeekID
		// We'll have to get the week to get the cohort ID
		week, err := repo.GetWeekByID(ctx, session.CohortWeekID)
		if err != nil {
			slog.Error("Failed to fetch week for session", "session_id", session.ID, "error", err)
			continue
		}

		sessionLink := fmt.Sprintf("%s/academy/sessions/%d", cfg.FrontendURL, session.ID)
		msg := fmt.Sprintf("🚨 <b>Live Ops Session starting in 10 minutes!</b>\n\nTopic: %s\n<a href=\"%s\">Enter the Live Ops Bridge</a>", session.Title, sessionLink)

		err = telegramSvc.SendCohortMessage(ctx, week.CohortID, msg)
		if err != nil {
			slog.Error("Failed to send telegram reminder", "session_id", session.ID, "error", err)
			continue
		}

		err = repo.MarkSessionReminderSent(ctx, session.ID)
		if err != nil {
			slog.Error("Failed to mark session reminder as sent", "session_id", session.ID, "error", err)
		}
	}
}
