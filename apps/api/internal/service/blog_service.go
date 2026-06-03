package service

import (
	"context"
	"fmt"
	"regexp"
	"time"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/google/uuid"
)

type blogService struct {
	repo        domain.BlogRepository
	academyRepo domain.AcademyRepository
}

func NewBlogService(repo domain.BlogRepository, academyRepo domain.AcademyRepository) domain.BlogService {
	return &blogService{repo: repo, academyRepo: academyRepo}
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

func (s *blogService) LeaveComment(slug, displayName, content string, studentID *uuid.UUID, parentID *int) (*domain.BlogComment, error) {
	comment := &domain.BlogComment{
		Slug:        slug,
		DisplayName: displayName,
		Content:     content,
		StudentID:   studentID,
		ParentID:    parentID,
	}

	if err := s.repo.AddComment(comment); err != nil {
		return nil, err
	}

	// ─── Notification Logic ───
	// 1. Reply Notification
	if parentID != nil {
		// Fetch parent to find who to notify.
		// A fast way is to parse the parent comment from GetPostData but that's inefficient.
		// But since we just need the parent author, let's just get it. 
		// For simplicity, we can fetch all comments and find the parent.
		_, comments, err := s.repo.GetMetricsAndComments(slug)
		if err == nil {
			var parentAuthorID *uuid.UUID
			// flatten comments to search
			for _, c := range comments {
				if c.ID == *parentID {
					parentAuthorID = c.StudentID
					break
				}
				for _, reply := range c.Replies {
					if reply.ID == *parentID {
						parentAuthorID = reply.StudentID
						break
					}
				}
			}

			if parentAuthorID != nil && (studentID == nil || *parentAuthorID != *studentID) {
				notif := &domain.Notification{
					ID:           uuid.New(),
					UserID:       parentAuthorID.String(),
					Type:         "blog_reply",
					Message:      fmt.Sprintf("%s replied to your comment.", displayName),
					ReferenceURL: func(s string) *string { return &s }(fmt.Sprintf("/academy/materials/%s", slug)),
					CreatedAt:    time.Now(),
				}
				if studentID != nil {
					notif.ActorID = func(s string) *string { return &s }(studentID.String())
				}
				_ = s.academyRepo.CreateNotification(context.Background(), notif)
			}
		}
	}

	// 2. Mentions Notification
	// regex for @FirstNameLastName
	re := regexp.MustCompile(`@([a-zA-Z0-9_-]+)`)
	matches := re.FindAllStringSubmatch(content, -1)
	if len(matches) > 0 {
		// Fetch all students to match the name (first+last without spaces)
		students, err := s.academyRepo.GetAllStudents(context.Background())
		if err == nil {
			studentMap := make(map[string]uuid.UUID)
			for _, st := range students {
				studentMap[st.Username] = st.ID
			}

			for _, match := range matches {
				if len(match) > 1 {
					mentionedName := match[1]
					if mentionedID, exists := studentMap[mentionedName]; exists {
						// Don't notify if tagging oneself
						if studentID == nil || mentionedID != *studentID {
							notif := &domain.Notification{
								ID:           uuid.New(),
								UserID:       mentionedID.String(),
								Type:         "blog_mention",
								Message:      fmt.Sprintf("%s mentioned you in a comment.", displayName),
								ReferenceURL: func(s string) *string { return &s }(fmt.Sprintf("/academy/materials/%s", slug)),
								CreatedAt:    time.Now(),
							}
							if studentID != nil {
								notif.ActorID = func(s string) *string { return &s }(studentID.String())
							}
							_ = s.academyRepo.CreateNotification(context.Background(), notif)
						}
					}
				}
			}
		}
	}

	return comment, nil
}

func (s *blogService) LikeComment(commentID int, studentID uuid.UUID) error {
	err := s.repo.AddCommentLike(commentID, studentID)
	if err != nil {
		return err
	}

	// Notification logic for liking a comment
	comment, err := s.repo.GetComment(commentID)
	if err == nil && comment.StudentID != nil && *comment.StudentID != studentID {
		
		// Let's get the actor name
		studentActor, err := s.academyRepo.GetStudentByID(context.Background(), studentID)
		actorName := "Someone"
		if err == nil && studentActor != nil {
			actorName = studentActor.FirstName + " " + studentActor.LastName
		}

		notif := &domain.Notification{
			ID:           uuid.New(),
			UserID:       comment.StudentID.String(),
			Type:         "blog_like",
			Message:      fmt.Sprintf("%s liked your comment.", actorName),
			ReferenceURL: func(s string) *string { return &s }(fmt.Sprintf("/academy/materials/%s", comment.Slug)),
			ActorID:      func(s string) *string { return &s }(studentID.String()),
			CreatedAt:    time.Now(),
		}
		_ = s.academyRepo.CreateNotification(context.Background(), notif)
	}

	return nil
}

func (s *blogService) GetAdminStats() ([]domain.BlogStats, error) {
	return s.repo.GetAdminStats()
}

func (s *blogService) EditComment(ctx context.Context, commentID int, studentID uuid.UUID, content string) error {
	return s.repo.UpdateComment(ctx, commentID, studentID, content)
}
