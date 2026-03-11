package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"regexp"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
)

type ContactService struct {
	repo domain.ContactRepository
}

func NewContactService(repo domain.ContactRepository) domain.ContactService {
	return &ContactService{
		repo: repo,
	}
}

func (s *ContactService) ProcessNewLead(ctx context.Context, lead *domain.ContactLead) error {
	if lead.FirstName == "" || lead.LastName == "" {
		return errors.New("first and last name are required")
	}

	if lead.Message == "" {
		return errors.New("message is required")
	}

	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(lead.Email) {
		return errors.New("invalid email address")
	}

	err := s.repo.CreateContact(ctx, lead)
	if err != nil {
		log.Printf("Error creating contact in repository: %v", err)
		return fmt.Errorf("could not process lead right now")
	}

	// Could trigger Slack/Email notifications here.
	log.Printf("Successfully captured new lead from: %s %s [%s]", lead.FirstName, lead.LastName, lead.Email)

	return nil
}

func (s *ContactService) GetContacts(ctx context.Context) ([]*domain.ContactLead, error) {
	contacts, err := s.repo.GetContacts(ctx)
	if err != nil {
		return nil, fmt.Errorf("error fetching contacts: %w", err)
	}
	if contacts == nil {
		return []*domain.ContactLead{}, nil
	}
	return contacts, nil
}

func (s *ContactService) GetContactByID(ctx context.Context, id int) (*domain.ContactLead, error) {
	contact, err := s.repo.GetContactByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("error fetching contact details: %w", err)
	}
	return contact, nil
}
