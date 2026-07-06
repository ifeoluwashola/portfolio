package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type WaitlistLead struct {
	ID              uuid.UUID `json:"id"`
	Name            string    `json:"name"`
	Email           string    `json:"email"`
	WhatsappNumber  string    `json:"whatsapp_number"`
	JoinedAt        time.Time `json:"joined_at"`
	DepositPaid     bool      `json:"deposit_paid"`
	TotalAmountPaid int       `json:"total_amount_paid"`
}

type AddWaitlistRequest struct {
	Name           string `json:"name"`
	Email          string `json:"email"`
	WhatsappNumber string `json:"whatsapp_number"`
}

type BroadcastRequest struct {
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

type CheckoutRequest struct {
	Email     string  `json:"email"`
	AmountNgn float64 `json:"amount_ngn"`
}

type WaitlistRepository interface {
	AddLead(ctx context.Context, lead *WaitlistLead) error
	GetLeads(ctx context.Context, limit, offset int) ([]*WaitlistLead, error)
	GetTotalLeadsCount(ctx context.Context) (int, error)
	GetAllLeads(ctx context.Context) ([]*WaitlistLead, error)
	GetLeadByEmail(ctx context.Context, email string) (*WaitlistLead, error)
}

type WaitlistService interface {
	JoinWaitlist(ctx context.Context, req *AddWaitlistRequest) (*WaitlistLead, error)
	GetWaitlistLeads(ctx context.Context, limit, offset int) ([]*WaitlistLead, int, error)
	BroadcastToWaitlist(ctx context.Context, subject, body string) error
	InitializeCheckout(ctx context.Context, email string, amountNgn float64) (string, error)
}
