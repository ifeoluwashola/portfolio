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

func (r *AcademyRepository) GetWeeks(ctx context.Context) ([]*domain.CohortWeek, error) {
	query := `
		SELECT id, week_number, title, status, meet_link, recording_url, created_at, updated_at
		FROM cohort_weeks ORDER BY week_number ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var weeks []*domain.CohortWeek
	for rows.Next() {
		w := &domain.CohortWeek{}
		err := rows.Scan(&w.ID, &w.WeekNumber, &w.Title, &w.Status, &w.MeetLink, &w.RecordingURL, &w.CreatedAt, &w.UpdatedAt)
		if err != nil {
			return nil, err
		}
		weeks = append(weeks, w)
	}
	return weeks, nil
}

func (r *AcademyRepository) GetWeekByID(ctx context.Context, id int) (*domain.CohortWeek, error) {
	query := `
		SELECT id, week_number, title, status, meet_link, recording_url, created_at, updated_at
		FROM cohort_weeks WHERE id = $1
	`
	w := &domain.CohortWeek{}
	err := r.db.QueryRow(ctx, query, id).Scan(&w.ID, &w.WeekNumber, &w.Title, &w.Status, &w.MeetLink, &w.RecordingURL, &w.CreatedAt, &w.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return w, nil
}

func (r *AcademyRepository) UpdateWeek(ctx context.Context, week *domain.CohortWeek) error {
	query := `
		UPDATE cohort_weeks
		SET status = $1, meet_link = $2, recording_url = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4
	`
	_, err := r.db.Exec(ctx, query, week.Status, week.MeetLink, week.RecordingURL, week.ID)
	return err
}

func (r *AcademyRepository) CreateAssignment(ctx context.Context, ass *domain.Assignment) error {
	query := `
		INSERT INTO assignments (student_id, week_id, github_url, status, created_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (student_id, week_id) DO UPDATE 
		SET github_url = EXCLUDED.github_url, status = 'pending', created_at = CURRENT_TIMESTAMP
	`
	_, err := r.db.Exec(ctx, query, ass.StudentID, ass.WeekID, ass.GitHubURL, "pending", time.Now())
	return err
}

func (r *AcademyRepository) GetStudentAssignments(ctx context.Context, studentID uuid.UUID) ([]*domain.Assignment, error) {
	query := `
		SELECT a.id, a.student_id, a.week_id, w.week_number, a.github_url, a.status, a.admin_feedback, a.created_at
		FROM assignments a
		JOIN cohort_weeks w ON a.week_id = w.id
		WHERE a.student_id = $1
	`
	rows, err := r.db.Query(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var asses []*domain.Assignment
	for rows.Next() {
		a := &domain.Assignment{}
		err := rows.Scan(&a.ID, &a.StudentID, &a.WeekID, &a.WeekNumber, &a.GitHubURL, &a.Status, &a.AdminFeedback, &a.CreatedAt)
		if err != nil {
			return nil, err
		}
		asses = append(asses, a)
	}
	// Return empty slice instead of nil for JSON consistency
	if asses == nil {
		asses = []*domain.Assignment{}
	}
	return asses, nil
}

func (r *AcademyRepository) GetAllAssignments(ctx context.Context) ([]*domain.Assignment, error) {
	query := `
		SELECT a.id, a.student_id, s.first_name || ' ' || s.last_name as student_name, a.week_id, w.week_number, a.github_url, a.status, a.admin_feedback, a.created_at
		FROM assignments a
		JOIN students s ON a.student_id = s.id
		JOIN cohort_weeks w ON a.week_id = w.id
		ORDER BY a.created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var asses []*domain.Assignment
	for rows.Next() {
		a := &domain.Assignment{}
		err := rows.Scan(&a.ID, &a.StudentID, &a.StudentName, &a.WeekID, &a.WeekNumber, &a.GitHubURL, &a.Status, &a.AdminFeedback, &a.CreatedAt)
		if err != nil {
			return nil, err
		}
		asses = append(asses, a)
	}
	if asses == nil {
		asses = []*domain.Assignment{}
	}
	return asses, nil
}

func (r *AcademyRepository) UpdateAssignmentGrade(ctx context.Context, id uuid.UUID, status, feedback string) error {
	query := `
		UPDATE assignments
		SET status = $1, admin_feedback = $2
		WHERE id = $3
	`
	_, err := r.db.Exec(ctx, query, status, feedback, id)
	return err
}

func (r *AcademyRepository) GetAssignmentByWeek(ctx context.Context, studentID uuid.UUID, weekID int) (*domain.Assignment, error) {
	query := `
		SELECT id, student_id, week_id, github_url, status, admin_feedback, created_at
		FROM assignments
		WHERE student_id = $1 AND week_id = $2
	`
	a := &domain.Assignment{}
	err := r.db.QueryRow(ctx, query, studentID, weekID).Scan(&a.ID, &a.StudentID, &a.WeekID, &a.GitHubURL, &a.Status, &a.AdminFeedback, &a.CreatedAt)
	if err != nil {
		return nil, err
	}
	return a, nil
}

