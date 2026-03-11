package service

import (
	"context"
	"fmt"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
)

type ProjectService struct {
	repo domain.GithubRepository
}

func NewProjectService(repo domain.GithubRepository) domain.ProjectService {
	return &ProjectService{
		repo: repo,
	}
}

func (s *ProjectService) GetGuardrailStats(ctx context.Context) (*domain.ProjectStats, error) {
	// Assuming the owner is "Ifeoluwashola" and repo is "guardrail" based on context.
	// You might want to make this configurable in the future.
	stats, err := s.repo.GetRepoStats(ctx, "Ifeoluwashola", "guardrail")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch guardrail stats: %w", err)
	}
	
	// Could implement a caching layer here in the future
	return stats, nil
}
