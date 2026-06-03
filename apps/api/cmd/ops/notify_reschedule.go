//go:build ignore

package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/config"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/database"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/notifications"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/repository/postgres"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/service"
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
	userRepo := postgres.NewUserRepository(dbPool) // Not used here but needed for service init
	resendNotifier := notifications.NewResendNotifier(cfg)
	
	// We only need the academy service to call BroadcastReschedule
	academySvc := service.NewAcademyService(academyRepo, userRepo, cfg, nil, resendNotifier)

	reason := "This adjustment allows us to finalize class preparations and ensure a seamless learning experience without any interruptions."
	
	dryRun := os.Getenv("DRY_RUN") == "true"
	if dryRun {
		fmt.Println("--- DRY RUN MODE ---")
		students, _ := academyRepo.GetAllStudents(ctx)
		count := 0
		for _, s := range students {
			if s.Status == "active" {
				fmt.Printf("[DRY-RUN] Would notify: %s (%s)\n", s.FirstName, s.Email)
				count++
			}
		}
		fmt.Printf("Total students to notify: %d\n", count)
		return
	}

	fmt.Println("Starting broadcast notification...")
	err = academySvc.BroadcastReschedule(ctx, reason)
	if err != nil {
		log.Fatalf("Broadcast failed: %v", err)
	}

	fmt.Println("Broadcast completed successfully.")
}
