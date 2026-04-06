package database

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"os"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
)

// RunMigrations executes all pending SQL migrations found in the migrations directory.
// It uses golang-migrate to track the state of applied migrations in the database.
func RunMigrations(ctx context.Context, databaseURL string) error {
	slog.Info("Starting database migrations...")

	// Open a standard sql.DB connection for golang-migrate
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return fmt.Errorf("could not open database for migrations: %w", err)
	}
	defer db.Close()

	if err := db.PingContext(ctx); err != nil {
		return fmt.Errorf("could not ping database before migrations: %w", err)
	}

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("could not create migration driver: %w", err)
	}

	// The migration source is either local or relative to the working directory in Docker
	path := "file://migrations"
	if _, err := os.Stat("internal/database/migrations"); err == nil {
		path = "file://internal/database/migrations"
	}

	m, err := migrate.NewWithDatabaseInstance(
		path,
		"postgres", driver)
	if err != nil {
		return fmt.Errorf("could not create migrate instance: %w", err)
	}

	if err := m.Up(); err != nil {
		if err == migrate.ErrNoChange {
			slog.Info("Database schema is already up to date")
			return nil
		}
		return fmt.Errorf("migration failed: %w", err)
	}

	slog.Info("Database migrations applied successfully")
	return nil
}
