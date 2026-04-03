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
		SELECT id, week_number, title, status, meet_link, recording_url, materials, transcript, created_at, updated_at
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
		err := rows.Scan(&w.ID, &w.WeekNumber, &w.Title, &w.Status, &w.MeetLink, &w.RecordingURL, &w.Materials, &w.Transcript, &w.CreatedAt, &w.UpdatedAt)
		if err != nil {
			return nil, err
		}
		weeks = append(weeks, w)
	}
	return weeks, nil
}

func (r *AcademyRepository) GetWeekByID(ctx context.Context, id int) (*domain.CohortWeek, error) {
	query := `
		SELECT id, week_number, title, status, meet_link, recording_url, materials, transcript, created_at, updated_at
		FROM cohort_weeks WHERE id = $1
	`
	w := &domain.CohortWeek{}
	err := r.db.QueryRow(ctx, query, id).Scan(&w.ID, &w.WeekNumber, &w.Title, &w.Status, &w.MeetLink, &w.RecordingURL, &w.Materials, &w.Transcript, &w.CreatedAt, &w.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return w, nil
}

func (r *AcademyRepository) UpdateWeek(ctx context.Context, week *domain.CohortWeek) error {
	query := `
		UPDATE cohort_weeks
		SET title = $1, status = $2, meet_link = $3, recording_url = $4, materials = $5, transcript = $6, updated_at = CURRENT_TIMESTAMP
		WHERE id = $7
	`
	_, err := r.db.Exec(ctx, query, week.Title, week.Status, week.MeetLink, week.RecordingURL, week.Materials, week.Transcript, week.ID)
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

// Phase 5: Break-It Labs

func (r *AcademyRepository) GetLabs(ctx context.Context) ([]*domain.BreakItLab, error) {
	query := `SELECT id, title, scenario, broken_code, solution_code, status, created_at FROM break_it_labs ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var labs []*domain.BreakItLab
	for rows.Next() {
		l := &domain.BreakItLab{}
		err := rows.Scan(&l.ID, &l.Title, &l.Scenario, &l.BrokenCode, &l.SolutionCode, &l.Status, &l.CreatedAt)
		if err != nil {
			return nil, err
		}
		labs = append(labs, l)
	}
	if labs == nil {
		labs = []*domain.BreakItLab{}
	}
	return labs, nil
}

func (r *AcademyRepository) GetLabByID(ctx context.Context, id int) (*domain.BreakItLab, error) {
	query := `SELECT id, title, scenario, broken_code, solution_code, status, created_at FROM break_it_labs WHERE id = $1`
	l := &domain.BreakItLab{}
	err := r.db.QueryRow(ctx, query, id).Scan(&l.ID, &l.Title, &l.Scenario, &l.BrokenCode, &l.SolutionCode, &l.Status, &l.CreatedAt)
	if err != nil {
		return nil, err
	}
	return l, nil
}

func (r *AcademyRepository) CreateLab(ctx context.Context, lab *domain.BreakItLab) error {
	query := `INSERT INTO break_it_labs (title, scenario, broken_code, solution_code, status) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(ctx, query, lab.Title, lab.Scenario, lab.BrokenCode, lab.SolutionCode, lab.Status)
	return err
}

func (r *AcademyRepository) UpdateLab(ctx context.Context, lab *domain.BreakItLab) error {
	query := `UPDATE break_it_labs SET title = $1, scenario = $2, broken_code = $3, solution_code = $4, status = $5 WHERE id = $6`
	_, err := r.db.Exec(ctx, query, lab.Title, lab.Scenario, lab.BrokenCode, lab.SolutionCode, lab.Status, lab.ID)
	return err
}

func (r *AcademyRepository) DeleteLab(ctx context.Context, id int) error {
	query := `DELETE FROM break_it_labs WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *AcademyRepository) UpsertLabSubmission(ctx context.Context, sub *domain.LabSubmission) error {
	query := `
		INSERT INTO lab_submissions (lab_id, student_id, proposed_fix, created_at)
		VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
		ON CONFLICT (lab_id, student_id) 
		DO UPDATE SET proposed_fix = EXCLUDED.proposed_fix, created_at = CURRENT_TIMESTAMP
	`
	_, err := r.db.Exec(ctx, query, sub.LabID, sub.StudentID, sub.ProposedFix)
	return err
}

func (r *AcademyRepository) GetLabSubmissions(ctx context.Context, labID int) ([]*domain.LabSubmission, error) {
	query := `
		SELECT ls.id, ls.lab_id, ls.student_id, s.first_name || ' ' || s.last_name as student_name, ls.proposed_fix, ls.is_winner, ls.created_at
		FROM lab_submissions ls
		JOIN students s ON ls.student_id = s.id
		WHERE ls.lab_id = $1
		ORDER BY ls.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, labID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subs = []*domain.LabSubmission{}
	for rows.Next() {
		s := &domain.LabSubmission{}
		err := rows.Scan(&s.ID, &s.LabID, &s.StudentID, &s.StudentName, &s.ProposedFix, &s.IsWinner, &s.CreatedAt)
		if err != nil {
			return nil, err
		}
		subs = append(subs, s)
	}
	if subs == nil {
		subs = []*domain.LabSubmission{}
	}
	return subs, nil
}

func (r *AcademyRepository) UpdateLabSubmissionWinner(ctx context.Context, subID int, isWinner bool) error {
	query := `UPDATE lab_submissions SET is_winner = $1 WHERE id = $2`
	_, err := r.db.Exec(ctx, query, isWinner, subID)
	return err
}

func (r *AcademyRepository) CreateSubmissionComment(ctx context.Context, comm *domain.SubmissionComment) error {
	query := `INSERT INTO submission_comments (submission_id, student_id, body) VALUES ($1, $2, $3)`
	_, err := r.db.Exec(ctx, query, comm.SubmissionID, comm.StudentID, comm.Body)
	return err
}

func (r *AcademyRepository) GetSubmissionComments(ctx context.Context, subID int) ([]*domain.SubmissionComment, error) {
	query := `
		SELECT sc.id, sc.submission_id, sc.student_id, s.first_name || ' ' || s.last_name as student_name, sc.body, sc.created_at
		FROM submission_comments sc
		JOIN students s ON sc.student_id = s.id
		WHERE sc.submission_id = $1
		ORDER BY sc.created_at ASC
	`
	rows, err := r.db.Query(ctx, query, subID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comms = []*domain.SubmissionComment{}
	for rows.Next() {
		c := &domain.SubmissionComment{}
		err := rows.Scan(&c.ID, &c.SubmissionID, &c.StudentID, &c.StudentName, &c.Body, &c.CreatedAt)
		if err != nil {
			return nil, err
		}
		comms = append(comms, c)
	}
	if comms == nil {
		comms = []*domain.SubmissionComment{}
	}
	return comms, nil
}

