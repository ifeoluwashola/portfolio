package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
)

type WaitlistRepository struct {
	pool *pgxpool.Pool
}

func NewWaitlistRepository(pool *pgxpool.Pool) domain.WaitlistRepository {
	return &WaitlistRepository{
		pool: pool,
	}
}

func (r *WaitlistRepository) AddLead(ctx context.Context, lead *domain.WaitlistLead) error {
	query := `
		INSERT INTO waitlist (name, email, whatsapp_number)
		VALUES ($1, $2, $3)
		RETURNING id, joined_at, deposit_paid, total_amount_paid
	`
	err := r.pool.QueryRow(ctx, query, lead.Name, lead.Email, lead.WhatsappNumber).Scan(&lead.ID, &lead.JoinedAt, &lead.DepositPaid, &lead.TotalAmountPaid)
	if err != nil {
		return fmt.Errorf("failed to add waitlist lead: %w", err)
	}
	return nil
}

func (r *WaitlistRepository) GetLeads(ctx context.Context, limit, offset int) ([]*domain.WaitlistLead, error) {
	query := `
		SELECT id, name, email, whatsapp_number, joined_at, deposit_paid, total_amount_paid
		FROM waitlist
		ORDER BY joined_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := r.pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query waitlist leads: %w", err)
	}
	defer rows.Close()

	leads := []*domain.WaitlistLead{}
	for rows.Next() {
		var lead domain.WaitlistLead
		err := rows.Scan(&lead.ID, &lead.Name, &lead.Email, &lead.WhatsappNumber, &lead.JoinedAt, &lead.DepositPaid, &lead.TotalAmountPaid)
		if err != nil {
			return nil, fmt.Errorf("failed to scan waitlist row: %w", err)
		}
		leads = append(leads, &lead)
	}
	return leads, nil
}

func (r *WaitlistRepository) GetTotalLeadsCount(ctx context.Context) (int, error) {
	query := `SELECT COUNT(*) FROM waitlist`
	var count int
	err := r.pool.QueryRow(ctx, query).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get total waitlist count: %w", err)
	}
	return count, nil
}

func (r *WaitlistRepository) GetAllLeads(ctx context.Context) ([]*domain.WaitlistLead, error) {
	query := `
		SELECT id, name, email, whatsapp_number, joined_at, deposit_paid, total_amount_paid
		FROM waitlist
		ORDER BY joined_at DESC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query all waitlist leads: %w", err)
	}
	defer rows.Close()

	leads := []*domain.WaitlistLead{}
	for rows.Next() {
		var lead domain.WaitlistLead
		err := rows.Scan(&lead.ID, &lead.Name, &lead.Email, &lead.WhatsappNumber, &lead.JoinedAt, &lead.DepositPaid, &lead.TotalAmountPaid)
		if err != nil {
			return nil, fmt.Errorf("failed to scan waitlist row: %w", err)
		}
		leads = append(leads, &lead)
	}
	return leads, nil
}

func (r *WaitlistRepository) GetLeadByEmail(ctx context.Context, email string) (*domain.WaitlistLead, error) {
	query := `
		SELECT id, name, email, whatsapp_number, joined_at, deposit_paid, total_amount_paid
		FROM waitlist
		WHERE email = $1
	`
	var lead domain.WaitlistLead
	err := r.pool.QueryRow(ctx, query, email).Scan(&lead.ID, &lead.Name, &lead.Email, &lead.WhatsappNumber, &lead.JoinedAt, &lead.DepositPaid, &lead.TotalAmountPaid)
	if err != nil {
		return nil, fmt.Errorf("failed to get waitlist lead by email: %w", err)
	}
	return &lead, nil
}
