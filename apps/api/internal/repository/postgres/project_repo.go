package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
)

type ProjectRepository struct {
	pool *pgxpool.Pool
}

func NewProjectRepository(pool *pgxpool.Pool) domain.ProjectRepository {
	return &ProjectRepository{
		pool: pool,
	}
}

func (r *ProjectRepository) GetProjects(ctx context.Context) ([]*domain.Project, error) {
	query := `
		SELECT id, title, description, tags, github_url, case_study_url, color, border_color, created_at
		FROM projects
		ORDER BY created_at ASC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query projects: %w", err)
	}
	defer rows.Close()

	var projects []*domain.Project
	for rows.Next() {
		var p domain.Project
		err := rows.Scan(
			&p.ID,
			&p.Title,
			&p.Description,
			&p.Tags,
			&p.GithubURL,
			&p.CaseStudyURL,
			&p.Color,
			&p.BorderColor,
			&p.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan project row: %w", err)
		}
		projects = append(projects, &p)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("row iteration error: %w", err)
	}

	return projects, nil
}

func (r *ProjectRepository) CreateProject(ctx context.Context, project *domain.Project) error {
	query := `
		INSERT INTO projects (title, description, tags, github_url, case_study_url, color, border_color)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`
	err := r.pool.QueryRow(
		ctx,
		query,
		project.Title,
		project.Description,
		project.Tags,
		project.GithubURL,
		project.CaseStudyURL,
		project.Color,
		project.BorderColor,
	).Scan(&project.ID, &project.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to insert project: %w", err)
	}

	return nil
}

func (r *ProjectRepository) DeleteProject(ctx context.Context, id int) error {
	query := `DELETE FROM projects WHERE id = $1`
	cmdTag, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete project: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("project not found")
	}

	return nil
}

func (r *ProjectRepository) UpdateProject(ctx context.Context, project *domain.Project) error {
	query := `
		UPDATE projects 
		SET title = $1, description = $2, tags = $3, github_url = $4, case_study_url = $5, color = $6, border_color = $7
		WHERE id = $8
	`
	cmdTag, err := r.pool.Exec(
		ctx,
		query,
		project.Title,
		project.Description,
		project.Tags,
		project.GithubURL,
		project.CaseStudyURL,
		project.Color,
		project.BorderColor,
		project.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update project: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("project not found or unchanged")
	}

	return nil
}
