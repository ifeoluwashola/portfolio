package postgres

import (
	"context"
	"fmt"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/google/uuid"
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
		// If it doesn't exist, that's fine, we'll just return 0s
	}

	// Get comments
	commentsMap := make(map[int]*domain.BlogComment)
	var orderedComments []*domain.BlogComment
	var topLevelComments []*domain.BlogComment

	rows, err := r.db.Query(context.Background(),
		"SELECT id, slug, display_name, content, student_id, parent_id, likes, created_at FROM blog_comments WHERE slug = $1 ORDER BY created_at ASC", slug)

	if err != nil {
		return metrics, []domain.BlogComment{}, err
	}
	defer rows.Close()

	for rows.Next() {
		c := &domain.BlogComment{Replies: []domain.BlogComment{}}
		if err := rows.Scan(&c.ID, &c.Slug, &c.DisplayName, &c.Content, &c.StudentID, &c.ParentID, &c.Likes, &c.CreatedAt); err != nil {
			return metrics, []domain.BlogComment{}, err
		}
		commentsMap[c.ID] = c
		orderedComments = append(orderedComments, c)
	}

	var getRoot func(id int) int
	getRoot = func(id int) int {
		c, ok := commentsMap[id]
		if !ok || c.ParentID == nil {
			return id
		}
		return getRoot(*c.ParentID)
	}

	for _, c := range orderedComments {
		if c.ParentID == nil {
			topLevelComments = append(topLevelComments, c)
		} else {
			rootID := getRoot(c.ID)
			if root, exists := commentsMap[rootID]; exists {
				root.Replies = append(root.Replies, *c)
			}
		}
	}

	// Reverse top level comments to show newest first
	result := make([]domain.BlogComment, len(topLevelComments))
	for i, c := range topLevelComments {
		// Reverse it so newest is at top
		result[len(topLevelComments)-1-i] = *c
	}

	return metrics, result, nil
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

func (r *blogRepository) GetComment(id int) (*domain.BlogComment, error) {
	c := &domain.BlogComment{}
	err := r.db.QueryRow(context.Background(),
		"SELECT id, slug, display_name, content, student_id, parent_id, likes, created_at FROM blog_comments WHERE id = $1", id).
		Scan(&c.ID, &c.Slug, &c.DisplayName, &c.Content, &c.StudentID, &c.ParentID, &c.Likes, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return c, nil
}

func (r *blogRepository) AddComment(comment *domain.BlogComment) error {
	return r.db.QueryRow(context.Background(),
		`INSERT INTO blog_comments (slug, display_name, content, student_id, parent_id)
		 VALUES ($1, $2, $3, $4, $5) RETURNING id, likes, created_at`,
		comment.Slug, comment.DisplayName, comment.Content, comment.StudentID, comment.ParentID).Scan(&comment.ID, &comment.Likes, &comment.CreatedAt)
}

func (r *blogRepository) AddCommentLike(commentID int, studentID uuid.UUID) error {
	// Insert into blog_comment_likes and increment likes in blog_comments
	tx, err := r.db.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	_, err = tx.Exec(context.Background(),
		`INSERT INTO blog_comment_likes (comment_id, student_id) VALUES ($1, $2)`, commentID, studentID)
	if err != nil {
		// likely unique constraint violation, meaning already liked
		return err
	}

	_, err = tx.Exec(context.Background(),
		`UPDATE blog_comments SET likes = likes + 1 WHERE id = $1`, commentID)
	if err != nil {
		return err
	}

	return tx.Commit(context.Background())
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

func (r *blogRepository) UpdateComment(ctx context.Context, id int, studentID uuid.UUID, content string) error {
	cmdTag, err := r.db.Exec(ctx, "UPDATE blog_comments SET content = $1 WHERE id = $2 AND student_id = $3", content, id, studentID)
	if err != nil {
		return err
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("comment not found or unauthorized")
	}
	return nil
}
