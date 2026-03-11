package service

import (
	"context"
	"fmt"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
)

type ProfileService struct {
	repo domain.ProfileRepository
}

func NewProfileService(repo domain.ProfileRepository) domain.ProfileService {
	return &ProfileService{
		repo: repo,
	}
}

func (s *ProfileService) GetProfile(ctx context.Context) (*domain.Profile, error) {
	profile, err := s.repo.GetProfile(ctx)
	if err != nil {
		return nil, fmt.Errorf("error fetching profile: %w", err)
	}

    // Ensure valid JSON defaults if returning a blank profile
    if profile.ID == 0 {
        profile.Experiences = []byte("[]")
        profile.Education = []byte("[]")
        profile.Certifications = []byte("[]")
        profile.TechnicalSkills = []byte("[]")
    }

	return profile, nil
}

func (s *ProfileService) UpsertProfile(ctx context.Context, profile *domain.Profile) error {
	// Add business logic/validation if needed (e.g., verifying URLs)

    // Ensure JSON arrays are at least empty brackets and not null strings
    if string(profile.Experiences) == "" || string(profile.Experiences) == "null" {
        profile.Experiences = []byte("[]")
    }
    if string(profile.Education) == "" || string(profile.Education) == "null" {
        profile.Education = []byte("[]")
    }
    if string(profile.Certifications) == "" || string(profile.Certifications) == "null" {
        profile.Certifications = []byte("[]")
    }
    if string(profile.TechnicalSkills) == "" || string(profile.TechnicalSkills) == "null" {
        profile.TechnicalSkills = []byte("[]")
    }

	err := s.repo.UpsertProfile(ctx, profile)
	if err != nil {
		return fmt.Errorf("error saving profile in database: %w", err)
	}

	return nil
}
