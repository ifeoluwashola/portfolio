package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type CohortApplication struct {
	ID            uuid.UUID `json:"id"`
	FirstName     string    `json:"first_name"`
	LastName      string    `json:"last_name"`
	Email         string    `json:"email"`
	CurrentRole   string    `json:"current_role"`
	Goal          string    `json:"goal"`
	Reference     string    `json:"reference"`
	PaymentStatus string    `json:"payment_status"`
	CreatedAt     time.Time `json:"created_at"`
}

type AcademyApplyRequest struct {
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Email       string `json:"email"`
	CurrentRole string `json:"current_role"`
	Goal        string `json:"goal"`
}

type AcademyApplyResponse struct {
	AuthorizationURL string `json:"authorization_url"`
	Reference        string `json:"reference"`
}

// Paystack Initialisation Response Structure mapping
type PaystackInitResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    struct {
		AuthorizationURL string `json:"authorization_url"`
		AccessCode       string `json:"access_code"`
		Reference        string `json:"reference"`
	} `json:"data"`
}

// Paystack Webhook Event payload
type PaystackWebhookEvent struct {
	Event string `json:"event"`
	Data  struct {
		Reference string `json:"reference"`
		Customer  struct {
			Email string `json:"email"`
		} `json:"customer"`
	} `json:"data"`
}

type AcademyRepository interface {
	CreateApplication(ctx context.Context, app *CohortApplication) error
	UpdatePaymentStatus(ctx context.Context, reference, status string) error
	GetApplicationByReference(ctx context.Context, reference string) (*CohortApplication, error)
}

type AcademyService interface {
	InitializeApplication(ctx context.Context, req *AcademyApplyRequest) (*AcademyApplyResponse, error)
	ProcessWebhook(ctx context.Context, signature string, body []byte) error
}
