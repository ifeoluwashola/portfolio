package postgres

import (
	"context"
	"fmt"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ProfileRepository struct {
	pool *pgxpool.Pool
}

func NewProfileRepository(pool *pgxpool.Pool) domain.ProfileRepository {
	return &ProfileRepository{
		pool: pool,
	}
}

func (r *ProfileRepository) GetProfile(ctx context.Context) (*domain.Profile, error) {
	query := `
		SELECT id, COALESCE(bio, ''), COALESCE(avatar_url, ''), COALESCE(email, ''), COALESCE(phone, ''), COALESCE(whatsapp_number, ''), COALESCE(location, ''), COALESCE(github_url, ''), COALESCE(linkedin_url, ''), COALESCE(twitter_url, ''), 
               COALESCE(experiences, '[]'::jsonb), COALESCE(education, '[]'::jsonb), COALESCE(certifications, '[]'::jsonb), COALESCE(technical_skills, '[]'::jsonb), updated_at
		FROM profile
		ORDER BY id ASC LIMIT 1
	`
	var p domain.Profile
	err := r.pool.QueryRow(ctx, query).Scan(
		&p.ID,
		&p.Bio,
		&p.AvatarURL,
		&p.Email,
		&p.Phone,
		&p.WhatsappNumber,
		&p.Location,
		&p.GithubURL,
		&p.LinkedinURL,
		&p.TwitterURL,
		&p.Experiences,
		&p.Education,
		&p.Certifications,
		&p.TechnicalSkills,
		&p.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			// Return a blank profile if none exists yet
			return &domain.Profile{}, nil
		}
		return nil, fmt.Errorf("failed to fetch profile: %w", err)
	}

	return &p, nil
}

func (r *ProfileRepository) UpsertProfile(ctx context.Context, profile *domain.Profile) error {
	// Attempt an update first. If row count is 0, we insert.
	// We only expect 1 row in this table.
	queryUpdate := `
		UPDATE profile
		SET bio = $1, avatar_url = $2, email = $3, phone = $4, whatsapp_number = $5, location = $6, github_url = $7, linkedin_url = $8, twitter_url = $9, 
		    experiences = $10, education = $11, certifications = $12, technical_skills = $13, updated_at = CURRENT_TIMESTAMP
        WHERE id = $14
	`

	var id int
	if profile.ID != 0 {
		id = profile.ID
	} else {
		// Try to find the first profile to update if ID isn't provided
		current, err := r.GetProfile(ctx)
		if err == nil && current.ID != 0 {
			id = current.ID
		}
	}

    var cmdTag pgconn.CommandTag
    var err error

    if id != 0 {
	    cmdTag, err = r.pool.Exec(
		    ctx, queryUpdate,
		    profile.Bio, profile.AvatarURL, profile.Email, profile.Phone, profile.WhatsappNumber, profile.Location,
		    profile.GithubURL, profile.LinkedinURL, profile.TwitterURL,
		    profile.Experiences, profile.Education, profile.Certifications, profile.TechnicalSkills,
            id,
	    )
	    if err != nil {
		    return fmt.Errorf("failed to update profile: %w", err)
	    }
    }

	// If no rows were updated, or no ID existed, insert a new record
	if id == 0 || cmdTag.RowsAffected() == 0 {
		queryInsert := `
			INSERT INTO profile (bio, avatar_url, email, phone, whatsapp_number, location, github_url, linkedin_url, twitter_url, experiences, education, certifications, technical_skills)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		`
		_, err = r.pool.Exec(
			ctx, queryInsert,
			profile.Bio, profile.AvatarURL, profile.Email, profile.Phone, profile.WhatsappNumber, profile.Location,
			profile.GithubURL, profile.LinkedinURL, profile.TwitterURL,
			profile.Experiences, profile.Education, profile.Certifications, profile.TechnicalSkills,
		)
		if err != nil {
			return fmt.Errorf("failed to insert profile: %w", err)
		}
	}

	return nil
}
