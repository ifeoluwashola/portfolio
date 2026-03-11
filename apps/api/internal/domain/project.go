package domain

import (
	"context"
	"time"
)

type Project struct {
	ID           int       `json:"id"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Tags         []string  `json:"tags"`
	GithubURL    string    `json:"githubUrl"`
	CaseStudyURL string    `json:"caseStudyUrl"`
	Color        string    `json:"color"`
	BorderColor  string    `json:"borderColor"`
	CreatedAt    time.Time `json:"created_at"`
}

type ProjectRepository interface {
	CreateProject(ctx context.Context, project *Project) error
	GetProjects(ctx context.Context) ([]*Project, error)
	DeleteProject(ctx context.Context, id int) error
	UpdateProject(ctx context.Context, project *Project) error
}

type ProjectDataService interface {
	GetProjects(ctx context.Context) ([]*Project, error)
	CreateProject(ctx context.Context, project *Project) error
	DeleteProject(ctx context.Context, id int) error
	UpdateProject(ctx context.Context, project *Project) error
}
