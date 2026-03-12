package postgres

import (
	"context"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type blogRepository struct {
	db *pgxpool.Pool
}

func NewBlogRepository(db *pgxpool.Pool) domain.BlogRepository {
	return &blogRepository{db: db}
}

func (r *blogRepository) GetMetricsAndComments(slug string) (*domain.BlogMetrics, []domain.BlogComment, error) {
	metrics := &domain.BlogMetrics{Slug: slug, Views: 0, Likes: 0}
	
	// Try to get metrics
	err := r.db.QueryRow(context.Background(),
		"SELECT views, likes FROM blog_metrics WHERE slug = $1", slug).Scan(&metrics.Views, &metrics.Likes)
	
	if err != nil {
		// If it doesn't exist, that's fine, we'll just return 0s (handled by the struct initialization)
	}

	// Get comments
	comments := make([]domain.BlogComment, 0)
	rows, err := r.db.Query(context.Background(),
		"SELECT id, slug, display_name, content, created_at FROM blog_comments WHERE slug = $1 ORDER BY created_at DESC", slug)
	
	if err != nil {
		return metrics, comments, err
	}
	defer rows.Close()

	for rows.Next() {
		var c domain.BlogComment
		if err := rows.Scan(&c.ID, &c.Slug, &c.DisplayName, &c.Content, &c.CreatedAt); err != nil {
			return metrics, comments, err
		}
		comments = append(comments, c)
	}

	return metrics, comments, nil
}

func (r *blogRepository) IncrementViews(slug string) error {
	_, err := r.db.Exec(context.Background(),
		`INSERT INTO blog_metrics (slug, views, likes) VALUES ($1, 1, 0)
		 ON CONFLICT (slug) DO UPDATE SET views = blog_metrics.views + 1`, slug)
	return err
}

func (r *blogRepository) IncrementLikes(slug string) error {
	_, err := r.db.Exec(context.Background(),
		`INSERT INTO blog_metrics (slug, views, likes) VALUES ($1, 0, 1)
		 ON CONFLICT (slug) DO UPDATE SET likes = blog_metrics.likes + 1`, slug)
	return err
}

func (r *blogRepository) AddComment(comment *domain.BlogComment) error {
	return r.db.QueryRow(context.Background(),
		`INSERT INTO blog_comments (slug, display_name, content)
		 VALUES ($1, $2, $3) RETURNING id, created_at`,
		comment.Slug, comment.DisplayName, comment.Content).Scan(&comment.ID, &comment.CreatedAt)
}

func (r *blogRepository) GetAdminStats() ([]domain.BlogStats, error) {
	stats := make([]domain.BlogStats, 0)
	
	// Left join metrics with comments count
	query := `
		SELECT 
			COALESCE(m.slug, c.slug) as slug,
			COALESCE(m.views, 0) as views,
			COALESCE(m.likes, 0) as likes,
			COUNT(c.id) as comments
		FROM blog_metrics m
		FULL OUTER JOIN blog_comments c ON m.slug = c.slug
		GROUP BY COALESCE(m.slug, c.slug), m.views, m.likes
		ORDER BY views DESC, likes DESC
	`
	
	rows, err := r.db.Query(context.Background(), query)
	if err != nil {
		return stats, err
	}
	defer rows.Close()

	for rows.Next() {
		var s domain.BlogStats
		if err := rows.Scan(&s.Slug, &s.Views, &s.Likes, &s.Comments); err != nil {
			return stats, err
		}
		stats = append(stats, s)
	}

	return stats, nil
}
