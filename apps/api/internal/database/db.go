package database

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPool(ctx context.Context, configURL string) (*pgxpool.Pool, error) {
	poolConfig, err := pgxpool.ParseConfig(configURL)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database url: %w", err)
	}

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	err = pool.Ping(ctx)
	if err != nil {
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	log.Println("Connected to PostgreSQL successfully")
	return pool, nil
}
