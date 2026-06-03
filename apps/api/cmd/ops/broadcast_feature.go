package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/config"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/database"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/notifications"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/repository/postgres"
	"github.com/google/uuid"
)

func main() {
	cfg := config.LoadConfig()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	dbPool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbPool.Close()

	academyRepo := postgres.NewAcademyRepository(dbPool)
	telegramSvc := notifications.NewTelegramService(academyRepo, cfg)

	dryRun := os.Getenv("DRY_RUN") == "true"
	if dryRun {
		fmt.Println("--- DRY RUN MODE ---")
	} else {
		fmt.Println("--- STARTING BROADCAST ---")
	}

	// 1. Fetch active students to send in-app notifications
	students, err := academyRepo.GetAllStudents(ctx)
	if err != nil {
		log.Fatalf("Failed to get students: %v", err)
	}

	inAppMsg := "🚀 New Feature: The Academy Materials now support Threaded Comments, @Mentions, and Likes! Join the discussion."
	var notifs []*domain.Notification
	activeStudentCount := 0

	for _, s := range students {
		if s.Status == "active" {
			activeStudentCount++
			if !dryRun {
				notifs = append(notifs, &domain.Notification{
					ID:           uuid.New(),
					UserID:       s.ID.String(),
					Type:         "feature_announcement",
					Message:      inAppMsg,
					ReferenceURL: func(s string) *string { return &s }("/academy/materials"),
					CreatedAt:    time.Now(),
				})
			}
		}
	}

	if dryRun {
		fmt.Printf("[DRY-RUN] Would send in-app notifications to %d active students.\n", activeStudentCount)
	} else {
		if len(notifs) > 0 {
			err = academyRepo.BulkCreateNotifications(ctx, notifs)
			if err != nil {
				log.Printf("Warning: Failed to bulk create in-app notifications: %v", err)
			} else {
				fmt.Printf("Sent in-app notifications to %d active students.\n", len(notifs))
			}
		}
	}

	// 2. Fetch all active cohorts to broadcast Telegram message
	rows, err := dbPool.Query(ctx, "SELECT id, name FROM cohorts WHERE status = 'active'")
	if err != nil {
		log.Fatalf("Failed to query cohorts: %v", err)
	}
	defer rows.Close()

	telegramMsg := `🎉 *New Academy Feature Update!* 🎉

We've just upgraded the Academy Materials pages with enhanced discussion interactivity:
💬 *Threaded Conversations:* Reply directly to specific comments.
🏷 *Mentions:* Tag your peers using @username.
❤️ *Likes:* Upvote insightful comments and replies!

Head over to your student portal to try it out!`

	cohortCount := 0
	for rows.Next() {
		var cohortID int
		var cohortName string
		if err := rows.Scan(&cohortID, &cohortName); err != nil {
			log.Printf("Failed to scan cohort row: %v", err)
			continue
		}
		
		cohortCount++
		if dryRun {
			fmt.Printf("[DRY-RUN] Would send Telegram message to cohort: %s (ID: %d)\n", cohortName, cohortID)
		} else {
			err := telegramSvc.SendCohortMessage(ctx, cohortID, telegramMsg)
			if err != nil {
				log.Printf("Warning: Failed to send telegram message to cohort %s (ID %d): %v", cohortName, cohortID, err)
			} else {
				fmt.Printf("Sent telegram message to cohort: %s\n", cohortName)
			}
		}
	}

	if dryRun {
		fmt.Printf("[DRY-RUN] Found %d active cohorts for Telegram broadcast.\n", cohortCount)
	}

	fmt.Println("--- BROADCAST SCRIPT COMPLETED ---")
}
