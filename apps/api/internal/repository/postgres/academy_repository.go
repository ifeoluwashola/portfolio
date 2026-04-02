package postgres

import (
	"context"
	"time"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AcademyRepository struct {
	db *pgxpool.Pool
}

func NewAcademyRepository(db *pgxpool.Pool) domain.AcademyRepository {
	return &AcademyRepository{db: db}
}

func (r *AcademyRepository) CreateApplication(ctx context.Context, app *domain.CohortApplication) error {
	query := `
		INSERT INTO cohort_applications (id, first_name, last_name, email, phone, role, goal, reference, payment_status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err := r.db.Exec(ctx, query, app.ID, app.FirstName, app.LastName, app.Email, app.Phone, app.CurrentRole, app.Goal, app.Reference, app.PaymentStatus, app.CreatedAt)
	return err
}

func (r *AcademyRepository) UpdatePaymentStatus(ctx context.Context, reference, status string) error {
	query := `
		UPDATE cohort_applications
		SET payment_status = $1
		WHERE reference = $2
	`
	_, err := r.db.Exec(ctx, query, status, reference)
	return err
}

func (r *AcademyRepository) GetApplicationByReference(ctx context.Context, reference string) (*domain.CohortApplication, error) {
	query := `
		SELECT id, first_name, last_name, email, phone, role, goal, reference, payment_status, created_at
		FROM cohort_applications
		WHERE reference = $1
	`
	app := &domain.CohortApplication{}
	err := r.db.QueryRow(ctx, query, reference).Scan(
		&app.ID, &app.FirstName, &app.LastName, &app.Email, &app.Phone, &app.CurrentRole,
		&app.Goal, &app.Reference, &app.PaymentStatus, &app.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return app, nil
}

func (r *AcademyRepository) GetAdminCohortApplications(ctx context.Context) ([]*domain.CohortApplication, error) {
	query := `
		SELECT id, first_name, last_name, email, phone, role, goal, reference, payment_status, created_at
		FROM cohort_applications
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var apps []*domain.CohortApplication
	for rows.Next() {
		app := &domain.CohortApplication{}
		err := rows.Scan(
			&app.ID, &app.FirstName, &app.LastName, &app.Email, &app.Phone, &app.CurrentRole,
			&app.Goal, &app.Reference, &app.PaymentStatus, &app.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		apps = append(apps, app)
	}
	
	if err = rows.Err(); err != nil {
		return nil, err
	}

	// Ensure we return an empty array instead of null for JSON
	if apps == nil {
		apps = []*domain.CohortApplication{}
	}

	return apps, nil
}

func (r *AcademyRepository) GetStudentByEmail(ctx context.Context, email string) (*domain.Student, error) {
	query := `
		SELECT id, first_name, last_name, email, password_hash, is_first_login, reset_token, reset_token_expires_at, created_at
		FROM students WHERE email = $1
	`
	student := &domain.Student{}
	err := r.db.QueryRow(ctx, query, email).Scan(
		&student.ID, &student.FirstName, &student.LastName, &student.Email,
		&student.PasswordHash, &student.IsFirstLogin, &student.ResetToken, 
		&student.ResetTokenExpiresAt, &student.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return student, nil
}

func (r *AcademyRepository) GetStudentByID(ctx context.Context, id uuid.UUID) (*domain.Student, error) {
	query := `
		SELECT id, first_name, last_name, email, password_hash, is_first_login, reset_token, reset_token_expires_at, created_at
		FROM students WHERE id = $1
	`
	student := &domain.Student{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&student.ID, &student.FirstName, &student.LastName, &student.Email,
		&student.PasswordHash, &student.IsFirstLogin, &student.ResetToken, 
		&student.ResetTokenExpiresAt, &student.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return student, nil
}

func (r *AcademyRepository) CreateStudent(ctx context.Context, student *domain.Student) error {
	query := `
		INSERT INTO students (id, first_name, last_name, email, password_hash, is_first_login, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.db.Exec(ctx, query, student.ID, student.FirstName, student.LastName, student.Email, student.PasswordHash, student.IsFirstLogin, student.CreatedAt)
	return err
}

func (r *AcademyRepository) UpdateStudentPassword(ctx context.Context, id uuid.UUID, newPasswordHash string) error {
	query := `
		UPDATE students
		SET password_hash = $1, is_first_login = false, reset_token = NULL, reset_token_expires_at = NULL
		WHERE id = $2
	`
	_, err := r.db.Exec(ctx, query, newPasswordHash, id)
	return err
}

func (r *AcademyRepository) SetStudentResetToken(ctx context.Context, email, token string, expiresAt time.Time) error {
	query := `
		UPDATE students
		SET reset_token = $1, reset_token_expires_at = $2
		WHERE email = $3
	`
	_, err := r.db.Exec(ctx, query, token, expiresAt, email)
	return err
}

func (r *AcademyRepository) GetStudentByResetToken(ctx context.Context, token string) (*domain.Student, error) {
	query := `
		SELECT id, first_name, last_name, email, password_hash, is_first_login, reset_token, reset_token_expires_at, created_at
		FROM students WHERE reset_token = $1
	`
	student := &domain.Student{}
	err := r.db.QueryRow(ctx, query, token).Scan(
		&student.ID, &student.FirstName, &student.LastName, &student.Email,
		&student.PasswordHash, &student.IsFirstLogin, &student.ResetToken, 
		&student.ResetTokenExpiresAt, &student.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return student, nil
}
