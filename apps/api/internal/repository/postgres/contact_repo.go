package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
)

type ContactRepository struct {
	pool *pgxpool.Pool
}

func NewContactRepository(pool *pgxpool.Pool) domain.ContactRepository {
	return &ContactRepository{
		pool: pool,
	}
}

func (r *ContactRepository) CreateContact(ctx context.Context, lead *domain.ContactLead) error {
	query := `
		INSERT INTO contacts (first_name, last_name, email, company, role, message)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`
	err := r.pool.QueryRow(
		ctx,
		query,
		lead.FirstName,
		lead.LastName,
		lead.Email,
		lead.Company,
		lead.Role,
		lead.Message,
	).Scan(&lead.ID, &lead.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to insert contact lead: %w", err)
	}

	return nil
}

func (r *ContactRepository) GetContacts(ctx context.Context) ([]*domain.ContactLead, error) {
	query := `
		SELECT id, first_name, last_name, email, company, role, message, created_at
		FROM contacts
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query contacts: %w", err)
	}
	defer rows.Close()

	var contacts []*domain.ContactLead
	for rows.Next() {
		var c domain.ContactLead
		err := rows.Scan(
			&c.ID,
			&c.FirstName,
			&c.LastName,
			&c.Email,
			&c.Company,
			&c.Role,
			&c.Message,
			&c.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan contact row: %w", err)
		}
		contacts = append(contacts, &c)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("row iteration error: %w", err)
	}

	return contacts, nil
}

func (r *ContactRepository) GetContactByID(ctx context.Context, id int) (*domain.ContactLead, error) {
	query := `
		SELECT id, first_name, last_name, email, company, role, message, created_at
		FROM contacts
		WHERE id = $1
	`
	var c domain.ContactLead
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&c.ID,
		&c.FirstName,
		&c.LastName,
		&c.Email,
		&c.Company,
		&c.Role,
		&c.Message,
		&c.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to fetch contact by id: %w", err)
	}

	return &c, nil
}
