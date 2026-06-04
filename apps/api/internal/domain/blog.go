package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// BlogMetrics represents the views and likes for a specific blog post
type BlogMetrics struct {
	Slug  string `json:"slug"`
	Views int    `json:"views"`
	Likes int    `json:"likes"`
}

// BlogComment represents a single comment on a blog post
type BlogComment struct {
	ID          int           `json:"id"`
	Slug        string        `json:"slug"`
	DisplayName string        `json:"display_name"`
	Content     string        `json:"content"`
	StudentID   *uuid.UUID    `json:"student_id,omitempty"`
	ParentID    *int          `json:"parent_id,omitempty"`
	Likes       int           `json:"likes"`
	CreatedAt   time.Time     `json:"created_at"`
	Replies     []BlogComment `json:"replies,omitempty"`
	ReplyCount  int           `json:"reply_count"`
}

// BlogStats represents the aggregate stats returned to the admin dashboard
type BlogStats struct {
	Slug     string `json:"slug"`
	Views    int    `json:"views"`
	Likes    int    `json:"likes"`
	Comments int    `json:"comments"`
}

// BlogRepository defines the data access methods for blog metrics and comments
type BlogRepository interface {
	GetMetricsAndComments(slug string) (*BlogMetrics, []BlogComment, error)
	IncrementViews(slug string) error
	IncrementLikes(slug string) error
	GetComment(id int) (*BlogComment, error)
	AddComment(comment *BlogComment) error
	AddCommentLike(commentID int, studentID uuid.UUID) error
	GetAdminStats() ([]BlogStats, error)
	UpdateComment(ctx context.Context, id int, studentID uuid.UUID, content string) error
}

// BlogService defines the business logic methods for blog operations
type BlogService interface {
	GetPostData(slug string) (*BlogMetrics, []BlogComment, error)
	RegisterView(slug string) error
	RegisterLike(slug string) error
	LeaveComment(slug, displayName, content string, studentID *uuid.UUID, parentID *int) (*BlogComment, error)
	LikeComment(commentID int, studentID uuid.UUID) error
	GetAdminStats() ([]BlogStats, error)
	EditComment(ctx context.Context, commentID int, studentID uuid.UUID, content string) error
}
