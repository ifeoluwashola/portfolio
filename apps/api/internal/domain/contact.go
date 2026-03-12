package domain

import (
	"context"
	"time"
)

// ContactLead represents a lead from the "Book a Consultation" form.
type ContactLead struct {
	ID        int       `json:"id"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Email     string    `json:"email"`
	Company   string    `json:"company"`
	Role      *string   `json:"role"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}

// ContactRepository defines the interface for data access.
type ContactRepository interface {
	CreateContact(ctx context.Context, lead *ContactLead) error
	GetContacts(ctx context.Context) ([]*ContactLead, error)
	GetContactByID(ctx context.Context, id int) (*ContactLead, error)
}

// ContactService defines the interface for business logic.
type ContactService interface {
	ProcessNewLead(ctx context.Context, lead *ContactLead) error
	GetContacts(ctx context.Context) ([]*ContactLead, error)
	GetContactByID(ctx context.Context, id int) (*ContactLead, error)
}
