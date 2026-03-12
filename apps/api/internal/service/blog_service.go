package service

import (
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
)

type blogService struct {
	repo domain.BlogRepository
}

func NewBlogService(repo domain.BlogRepository) domain.BlogService {
	return &blogService{repo: repo}
}

func (s *blogService) GetPostData(slug string) (*domain.BlogMetrics, []domain.BlogComment, error) {
	return s.repo.GetMetricsAndComments(slug)
}

func (s *blogService) RegisterView(slug string) error {
	return s.repo.IncrementViews(slug)
}

func (s *blogService) RegisterLike(slug string) error {
	return s.repo.IncrementLikes(slug)
}

func (s *blogService) LeaveComment(slug, displayName, content string) (*domain.BlogComment, error) {
	comment := &domain.BlogComment{
		Slug:        slug,
		DisplayName: displayName,
		Content:     content,
	}

	if err := s.repo.AddComment(comment); err != nil {
		return nil, err
	}

	return comment, nil
}

func (s *blogService) GetAdminStats() ([]domain.BlogStats, error) {
	return s.repo.GetAdminStats()
}
