package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
)

type ProjectDataService struct {
	repo domain.ProjectRepository
}

func NewProjectDataService(repo domain.ProjectRepository) domain.ProjectDataService {
	return &ProjectDataService{
		repo: repo,
	}
}

func (s *ProjectDataService) GetProjects(ctx context.Context) ([]*domain.Project, error) {
	projects, err := s.repo.GetProjects(ctx)
	if err != nil {
		return nil, fmt.Errorf("error fetching projects: %w", err)
	}
	// Return empty array instead of null for JSON serialization if no projects exist
	if projects == nil {
		return []*domain.Project{}, nil
	}
	return projects, nil
}

func (s *ProjectDataService) CreateProject(ctx context.Context, project *domain.Project) error {
	if project.Title == "" || project.Description == "" {
		return errors.New("title and description are required")
	}
	if len(project.Tags) == 0 {
		return errors.New("at least one tag is required")
	}

	// Set defaults if not provided
	if project.Color == "" {
		project.Color = "from-sky-500/20 to-transparent"
	}
	if project.BorderColor == "" {
		project.BorderColor = "border-sky-500/20"
	}

	err := s.repo.CreateProject(ctx, project)
	if err != nil {
		return fmt.Errorf("error creating project in database: %w", err)
	}

	return nil
}

func (s *ProjectDataService) DeleteProject(ctx context.Context, id int) error {
	if id <= 0 {
		return errors.New("invalid project ID")
	}

	err := s.repo.DeleteProject(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete project: %w", err)
	}

	return nil
}

func (s *ProjectDataService) UpdateProject(ctx context.Context, project *domain.Project) error {
	if project.ID <= 0 {
		return errors.New("invalid project ID")
	}
	if project.Title == "" || project.Description == "" {
		return errors.New("title and description are required")
	}
	if len(project.Tags) == 0 {
		return errors.New("at least one tag is required")
	}

	// Set defaults if not provided to match create
	if project.Color == "" {
		project.Color = "from-sky-500/20 to-transparent"
	}
	if project.BorderColor == "" {
		project.BorderColor = "border-sky-500/20"
	}

	err := s.repo.UpdateProject(ctx, project)
	if err != nil {
		return fmt.Errorf("error updating project in database: %w", err)
	}

	return nil
}
