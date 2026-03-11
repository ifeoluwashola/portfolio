package domain

import (
	"context"
)

// ProjectStats represents live statistics for a project repository
type ProjectStats struct {
	Name        string `json:"name"`
	Stars       int    `json:"stars"`
	Forks       int    `json:"forks"`
	OpenIssues  int    `json:"open_issues"`
	Description string `json:"description"`
}

// GithubRepository defines the interface for interacting with the GitHub API
type GithubRepository interface {
	GetRepoStats(ctx context.Context, owner, repo string) (*ProjectStats, error)
}

// ProjectService defines the business logic wrapper for fetching project stats
type ProjectService interface {
	GetGuardrailStats(ctx context.Context) (*ProjectStats, error)
}
