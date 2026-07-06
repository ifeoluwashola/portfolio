package postgres

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
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
		INSERT INTO cohort_applications (id, first_name, last_name, email, phone, role, goal, experience_level, has_laptop, reference, payment_status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`
	_, err := r.db.Exec(ctx, query, app.ID, app.FirstName, app.LastName, app.Email, app.Phone, app.CurrentRole, app.Goal, app.ExperienceLevel, app.HasLaptop, app.Reference, app.PaymentStatus, app.CreatedAt)
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
		SELECT id, first_name, last_name, email, phone, role, goal, experience_level, has_laptop, reference, payment_status, created_at
		FROM cohort_applications
		WHERE reference = $1
	`
	app := &domain.CohortApplication{}
	err := r.db.QueryRow(ctx, query, reference).Scan(
		&app.ID, &app.FirstName, &app.LastName, &app.Email, &app.Phone, &app.CurrentRole,
		&app.Goal, &app.ExperienceLevel, &app.HasLaptop, &app.Reference, &app.PaymentStatus, &app.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return app, nil
}

func (r *AcademyRepository) GetApplicationByID(ctx context.Context, id uuid.UUID) (*domain.CohortApplication, error) {
	query := `
		SELECT id, first_name, last_name, email, phone, role, goal, experience_level, has_laptop, reference, payment_status, created_at
		FROM cohort_applications
		WHERE id = $1
	`
	app := &domain.CohortApplication{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&app.ID, &app.FirstName, &app.LastName, &app.Email, &app.Phone, &app.CurrentRole,
		&app.Goal, &app.ExperienceLevel, &app.HasLaptop, &app.Reference, &app.PaymentStatus, &app.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return app, nil
}

func (r *AcademyRepository) UpdateApplicationStatusByID(ctx context.Context, id uuid.UUID, status string) error {
	query := `
		UPDATE cohort_applications
		SET payment_status = $1
		WHERE id = $2
	`
	_, err := r.db.Exec(ctx, query, status, id)
	return err
}

func (r *AcademyRepository) GetAdminCohortApplications(ctx context.Context) ([]*domain.CohortApplication, error) {
	query := `
		SELECT 
			ca.id, ca.first_name, ca.last_name, ca.email, ca.phone, 
			COALESCE(ca.role, ''), COALESCE(ca.goal, ''), 
			COALESCE(ca.experience_level, 'Not Specified'), 
			COALESCE(ca.has_laptop, FALSE), 
			ca.reference, ca.payment_status, ca.created_at,
			COALESCE(sb.billing_status, '') AS billing_status
		FROM cohort_applications ca
		LEFT JOIN students s ON s.email = ca.email
		LEFT JOIN student_billing sb ON sb.student_id = s.id
		ORDER BY ca.created_at DESC
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
			&app.Goal, &app.ExperienceLevel, &app.HasLaptop, &app.Reference, &app.PaymentStatus, &app.CreatedAt,
			&app.BillingStatus,
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
		SELECT id, first_name, last_name, email, password_hash, is_first_login, status, warning_count, disqualification_reason, is_manually_locked, reset_token, reset_token_expires_at, cohort_id, avatar_s3_key, linkedin_url, github_url, bio, username, display_name, preferences, pending_email, email_verify_token, created_at, role
		FROM students WHERE email = $1
	`
	student := &domain.Student{}
	err := r.db.QueryRow(ctx, query, email).Scan(
		&student.ID, &student.FirstName, &student.LastName, &student.Email,
		&student.PasswordHash, &student.IsFirstLogin, &student.Status, &student.WarningCount,
		&student.DisqualificationReason, &student.IsManuallyLocked, &student.ResetToken, &student.ResetTokenExpiresAt, &student.CohortID,
		&student.AvatarS3Key, &student.LinkedInURL, &student.GitHubURL, &student.Bio, 
		&student.Username, &student.DisplayName, &student.Preferences, &student.PendingEmail, &student.EmailVerifyToken,
		&student.CreatedAt, &student.Role,
	)
	if err != nil {
		return nil, err
	}

	// Fetch metrics
	metricsQuery := `
		SELECT 
			COUNT(sa.id) as attended_count,
			(SELECT COUNT(*) FROM class_sessions WHERE status IN ('live', 'archived') AND visibility_status = 'published') as total_held
		FROM students s
		LEFT JOIN session_attendance sa ON s.id = sa.student_id
		WHERE s.id = $1
		GROUP BY s.id
	`
	var attended, total int
	err = r.db.QueryRow(ctx, metricsQuery, student.ID).Scan(&attended, &total)
	if err == nil {
		student.AttendedCount = attended
		student.TotalHeldSessions = total
		if total > 0 {
			student.AttendanceRate = (float64(attended) / float64(total)) * 100
		}
	}

	return student, nil
}

func (r *AcademyRepository) GetStudentByID(ctx context.Context, id uuid.UUID) (*domain.Student, error) {
	query := `
		SELECT id, first_name, last_name, email, password_hash, is_first_login, status, warning_count, disqualification_reason, is_manually_locked, reset_token, reset_token_expires_at, cohort_id, avatar_s3_key, linkedin_url, github_url, bio, username, display_name, preferences, pending_email, email_verify_token, created_at, role
		FROM students WHERE id = $1
	`
	student := &domain.Student{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&student.ID, &student.FirstName, &student.LastName, &student.Email,
		&student.PasswordHash, &student.IsFirstLogin, &student.Status, &student.WarningCount,
		&student.DisqualificationReason, &student.IsManuallyLocked, &student.ResetToken, &student.ResetTokenExpiresAt, &student.CohortID,
		&student.AvatarS3Key, &student.LinkedInURL, &student.GitHubURL, &student.Bio,
		&student.Username, &student.DisplayName, &student.Preferences, &student.PendingEmail, &student.EmailVerifyToken,
		&student.CreatedAt, &student.Role,
	)
	if err != nil {
		return nil, err
	}

	// Fetch metrics
	metricsQuery := `
		SELECT 
			COUNT(sa.id) as attended_count,
			(SELECT COUNT(*) FROM class_sessions WHERE status IN ('live', 'archived') AND visibility_status = 'published') as total_held
		FROM students s
		LEFT JOIN session_attendance sa ON s.id = sa.student_id
		WHERE s.id = $1
		GROUP BY s.id
	`
	var attended, total int
	err = r.db.QueryRow(ctx, metricsQuery, student.ID).Scan(&attended, &total)
	if err == nil {
		student.AttendedCount = attended
		student.TotalHeldSessions = total
		if total > 0 {
			student.AttendanceRate = (float64(attended) / float64(total)) * 100
		}
	}
	return student, nil
}

func (r *AcademyRepository) CreateStudent(ctx context.Context, student *domain.Student) error {
	query := `
		INSERT INTO students (id, first_name, last_name, email, password_hash, is_first_login, username, cohort_id, created_at, role)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	role := student.Role
	if role == "" {
		role = "student"
	}
	_, err := r.db.Exec(ctx, query, student.ID, student.FirstName, student.LastName, student.Email, student.PasswordHash, student.IsFirstLogin, student.Username, student.CohortID, student.CreatedAt, role)
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
		SELECT id, first_name, last_name, email, password_hash, is_first_login, status, warning_count, disqualification_reason, reset_token, reset_token_expires_at, created_at, role
		FROM students WHERE reset_token = $1
	`
	student := &domain.Student{}
	err := r.db.QueryRow(ctx, query, token).Scan(
		&student.ID, &student.FirstName, &student.LastName, &student.Email,
		&student.PasswordHash, &student.IsFirstLogin, &student.Status, &student.WarningCount,
		&student.DisqualificationReason, &student.ResetToken, &student.ResetTokenExpiresAt, &student.CreatedAt, &student.Role,
	)
	if err != nil {
		return nil, err
	}
	return student, nil
}

func (r *AcademyRepository) GetAllStudents(ctx context.Context) ([]*domain.Student, error) {
	query := `
		SELECT 
			s.id, s.first_name, s.last_name, s.email, s.status, s.warning_count, 
			s.disqualification_reason, s.is_manually_locked, s.created_at, s.cohort_id,
			COUNT(sa.id) as attended_count,
			(SELECT COUNT(*) FROM class_sessions WHERE status IN ('live', 'archived')) as total_held
		FROM students s
		LEFT JOIN session_attendance sa ON s.id = sa.student_id
		GROUP BY s.id
		ORDER BY s.created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []*domain.Student
	for rows.Next() {
		s := &domain.Student{}
		var attended, total int
		err := rows.Scan(
			&s.ID, &s.FirstName, &s.LastName, &s.Email, &s.Status, &s.WarningCount, 
			&s.DisqualificationReason, &s.IsManuallyLocked, &s.CreatedAt, &s.CohortID,
			&attended, &total,
		)
		if err != nil {
			return nil, err
		}
		s.AttendedCount = attended
		s.TotalHeldSessions = total
		if total > 0 {
			s.AttendanceRate = (float64(attended) / float64(total)) * 100
		}
		students = append(students, s)
	}
	if students == nil {
		students = []*domain.Student{}
	}
	return students, nil
}

func (r *AcademyRepository) UpdateStudentStatus(ctx context.Context, id uuid.UUID, status string, reason string) error {
	query := `UPDATE students SET status = $1, disqualification_reason = $2 WHERE id = $3`
	_, err := r.db.Exec(ctx, query, status, reason, id)
	return err
}

func (r *AcademyRepository) WarnStudent(ctx context.Context, id uuid.UUID, reason string) (int, error) {
	query := `UPDATE students SET warning_count = warning_count + 1 WHERE id = $1 RETURNING warning_count`
	var count int
	err := r.db.QueryRow(ctx, query, id).Scan(&count)
	return count, err
}

func (r *AcademyRepository) GetWeeks(ctx context.Context, cohortID int) ([]*domain.CohortWeek, error) {
	query := `
		SELECT id, cohort_id, week_number, title, recording_url, materials, transcript, assignment_instructions, assignment_due_date, created_at, updated_at
		FROM cohort_weeks WHERE cohort_id = $1 ORDER BY week_number ASC
	`
	rows, err := r.db.Query(ctx, query, cohortID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var weeks []*domain.CohortWeek
	for rows.Next() {
		w := &domain.CohortWeek{}
		err := rows.Scan(&w.ID, &w.CohortID, &w.WeekNumber, &w.Title, &w.RecordingURL, &w.Materials, &w.Transcript, &w.AssignmentInstructions, &w.AssignmentDueDate, &w.CreatedAt, &w.UpdatedAt)
		if err != nil {
			return nil, err
		}

		// Fetch sessions for this week
		sessions, err := r.GetClassSessionsByWeek(ctx, w.ID)
		if err != nil {
			return nil, err
		}
		w.Sessions = sessions

		weeks = append(weeks, w)
	}
	return weeks, nil
}

func (r *AcademyRepository) GetWeekByID(ctx context.Context, id int) (*domain.CohortWeek, error) {
	query := `
		SELECT id, cohort_id, week_number, title, recording_url, materials, transcript, assignment_instructions, assignment_due_date, created_at, updated_at
		FROM cohort_weeks WHERE id = $1
	`
	w := &domain.CohortWeek{}
	err := r.db.QueryRow(ctx, query, id).Scan(&w.ID, &w.CohortID, &w.WeekNumber, &w.Title, &w.RecordingURL, &w.Materials, &w.Transcript, &w.AssignmentInstructions, &w.AssignmentDueDate, &w.CreatedAt, &w.UpdatedAt)
	if err != nil {
		return nil, err
	}

	sessions, err := r.GetClassSessionsByWeek(ctx, w.ID)
	if err != nil {
		return nil, err
	}
	w.Sessions = sessions

	return w, nil
}

func (r *AcademyRepository) UpdateWeek(ctx context.Context, week *domain.CohortWeek) error {
	query := `
		UPDATE cohort_weeks
		SET title = $1, recording_url = $2, materials = $3, transcript = $4, assignment_instructions = $5, assignment_due_date = $6, updated_at = CURRENT_TIMESTAMP
		WHERE id = $7
	`
	_, err := r.db.Exec(ctx, query, week.Title, week.RecordingURL, week.Materials, week.Transcript, week.AssignmentInstructions, week.AssignmentDueDate, week.ID)
	return err
}

func (r *AcademyRepository) CreateAssignment(ctx context.Context, ass *domain.Assignment) error {
	query := `
		INSERT INTO assignments (student_id, week_id, github_url, submission_file_keys, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (student_id, week_id) DO UPDATE 
		SET github_url = EXCLUDED.github_url, submission_file_keys = EXCLUDED.submission_file_keys, status = 'pending', created_at = CURRENT_TIMESTAMP
	`
	_, err := r.db.Exec(ctx, query, ass.StudentID, ass.WeekID, ass.GitHubURL, ass.SubmissionFileKeys, "pending", time.Now())
	return err
}

func (r *AcademyRepository) GetStudentAssignments(ctx context.Context, studentID uuid.UUID) ([]*domain.Assignment, error) {
	query := `
		SELECT a.id, a.student_id, a.week_id, w.week_number, a.github_url, a.submission_file_keys, a.status, a.score, a.admin_feedback, a.created_at
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
		err := rows.Scan(&a.ID, &a.StudentID, &a.WeekID, &a.WeekNumber, &a.GitHubURL, &a.SubmissionFileKeys, &a.Status, &a.Score, &a.AdminFeedback, &a.CreatedAt)
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
		SELECT a.id, a.student_id, COALESCE(s.display_name, s.first_name || ' ' || s.last_name) as student_name, a.week_id, w.week_number, a.github_url, a.submission_file_keys, a.status, a.score, a.admin_feedback, a.created_at
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
		err := rows.Scan(&a.ID, &a.StudentID, &a.StudentName, &a.WeekID, &a.WeekNumber, &a.GitHubURL, &a.SubmissionFileKeys, &a.Status, &a.Score, &a.AdminFeedback, &a.CreatedAt)
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

func (r *AcademyRepository) UpdateAssignmentGrade(ctx context.Context, id uuid.UUID, status, feedback string, score *int) error {
	query := `
		UPDATE assignments
		SET status = $1, admin_feedback = $2, score = $3
		WHERE id = $4
	`
	_, err := r.db.Exec(ctx, query, status, feedback, score, id)
	return err
}

func (r *AcademyRepository) GetAssignmentByWeek(ctx context.Context, studentID uuid.UUID, weekID int) (*domain.Assignment, error) {
	query := `
		SELECT id, student_id, week_id, github_url, submission_file_keys, status, admin_feedback, created_at
		FROM assignments
		WHERE student_id = $1 AND week_id = $2
	`
	a := &domain.Assignment{}
	err := r.db.QueryRow(ctx, query, studentID, weekID).Scan(&a.ID, &a.StudentID, &a.WeekID, &a.GitHubURL, &a.SubmissionFileKeys, &a.Status, &a.AdminFeedback, &a.CreatedAt)
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
	query := `INSERT INTO break_it_labs (title, scenario, broken_code, solution_code, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`
	return r.db.QueryRow(ctx, query, lab.Title, lab.Scenario, lab.BrokenCode, lab.SolutionCode, lab.Status).Scan(&lab.ID)
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
		SELECT ls.id, ls.lab_id, ls.student_id, COALESCE(s.display_name, s.first_name || ' ' || s.last_name) as student_name, s.avatar_s3_key, ls.proposed_fix, ls.is_winner, ls.created_at
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
		err := rows.Scan(&s.ID, &s.LabID, &s.StudentID, &s.StudentName, &s.AvatarS3Key, &s.ProposedFix, &s.IsWinner, &s.CreatedAt)
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
		SELECT sc.id, sc.submission_id, sc.student_id, COALESCE(s.display_name, s.first_name || ' ' || s.last_name) as student_name, s.avatar_s3_key, sc.body, sc.created_at
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
		err := rows.Scan(&c.ID, &c.SubmissionID, &c.StudentID, &c.StudentName, &c.AvatarS3Key, &c.Body, &c.CreatedAt)
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

// Class Sessions

func (r *AcademyRepository) CreateClassSession(ctx context.Context, s *domain.ClassSession) error {
	query := `
		INSERT INTO class_sessions (cohort_week_id, title, status, visibility_status, meeting_url, scheduled_at, recording_url, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
	`
	_, err := r.db.Exec(ctx, query, s.CohortWeekID, s.Title, s.Status, s.VisibilityStatus, s.MeetingURL, s.ScheduledAt, s.RecordingURL)
	return err
}

func (r *AcademyRepository) UpdateClassSession(ctx context.Context, s *domain.ClassSession) error {
	query := `
		UPDATE class_sessions
		SET title = $1, status = $2, visibility_status = $3, meeting_url = $4, scheduled_at = $5, recording_url = $6
		WHERE id = $7
	`
	_, err := r.db.Exec(ctx, query, s.Title, s.Status, s.VisibilityStatus, s.MeetingURL, s.ScheduledAt, s.RecordingURL, s.ID)
	return err
}

func (r *AcademyRepository) DeleteClassSession(ctx context.Context, id int) error {
	query := `DELETE FROM class_sessions WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *AcademyRepository) GetClassSessionsByWeek(ctx context.Context, weekID int) ([]*domain.ClassSession, error) {
	query := `
		SELECT id, cohort_week_id, title, status, visibility_status, meeting_url, scheduled_at, recording_url, reminder_sent, created_at
		FROM class_sessions WHERE cohort_week_id = $1
		ORDER BY scheduled_at ASC
	`
	rows, err := r.db.Query(ctx, query, weekID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []*domain.ClassSession
	for rows.Next() {
		s := &domain.ClassSession{}
		err := rows.Scan(
			&s.ID, &s.CohortWeekID, &s.Title, &s.Status, &s.VisibilityStatus,
			&s.MeetingURL, &s.ScheduledAt, &s.RecordingURL, &s.ReminderSent, &s.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	if sessions == nil {
		sessions = []*domain.ClassSession{}
	}
	return sessions, nil
}

func (r *AcademyRepository) GetClassSessionByID(ctx context.Context, id int) (*domain.ClassSession, error) {
	query := `
		SELECT id, cohort_week_id, title, status, visibility_status, meeting_url, scheduled_at, recording_url, reminder_sent, created_at
		FROM class_sessions WHERE id = $1
	`
	s := &domain.ClassSession{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&s.ID, &s.CohortWeekID, &s.Title, &s.Status, &s.VisibilityStatus,
		&s.MeetingURL, &s.ScheduledAt, &s.RecordingURL, &s.ReminderSent, &s.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (r *AcademyRepository) GetUpcomingSessions(ctx context.Context, from, to time.Time) ([]*domain.ClassSession, error) {
	query := `
		SELECT id, cohort_week_id, title, status, visibility_status, meeting_url, scheduled_at, recording_url, reminder_sent, created_at
		FROM class_sessions
		WHERE scheduled_at >= $1 AND scheduled_at <= $2 AND reminder_sent = false
	`
	rows, err := r.db.Query(ctx, query, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []*domain.ClassSession
	for rows.Next() {
		s := &domain.ClassSession{}
		if err := rows.Scan(
			&s.ID, &s.CohortWeekID, &s.Title, &s.Status, &s.VisibilityStatus,
			&s.MeetingURL, &s.ScheduledAt, &s.RecordingURL, &s.ReminderSent, &s.CreatedAt,
		); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}

func (r *AcademyRepository) MarkSessionReminderSent(ctx context.Context, id int) error {
	query := `UPDATE class_sessions SET reminder_sent = true WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *AcademyRepository) AutoStartScheduledSessions(ctx context.Context) (int64, error) {
	query := `
		UPDATE class_sessions 
		SET status = 'live' 
		WHERE status = 'scheduled' AND scheduled_at <= CURRENT_TIMESTAMP
	`
	tag, err := r.db.Exec(ctx, query)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

func (r *AcademyRepository) RecordAttendance(ctx context.Context, sessionID int, studentID uuid.UUID) error {
	query := `
		INSERT INTO session_attendance (session_id, student_id)
		VALUES ($1, $2)
		ON CONFLICT (session_id, student_id) DO UPDATE SET joined_at = CURRENT_TIMESTAMP
	`
	_, err := r.db.Exec(ctx, query, sessionID, studentID)
	return err
}

func (r *AcademyRepository) GetStudentAttendance(ctx context.Context, studentID uuid.UUID) ([]*domain.SessionAttendance, error) {
	query := `SELECT id, session_id, student_id, joined_at FROM session_attendance WHERE student_id = $1`
	rows, err := r.db.Query(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*domain.SessionAttendance
	for rows.Next() {
		sa := &domain.SessionAttendance{}
		err := rows.Scan(&sa.ID, &sa.SessionID, &sa.StudentID, &sa.JoinedAt)
		if err != nil {
			return nil, err
		}
		results = append(results, sa)
	}
	return results, nil
}

func (r *AcademyRepository) GetSessionAttendance(ctx context.Context, sessionID int) ([]*domain.Student, error) {
	query := `
		SELECT s.id, s.first_name, s.last_name, s.email, sa.joined_at as created_at
		FROM students s
		JOIN session_attendance sa ON s.id = sa.student_id
		WHERE sa.session_id = $1
		ORDER BY sa.joined_at DESC
	`
	rows, err := r.db.Query(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []*domain.Student
	for rows.Next() {
		s := &domain.Student{}
		err := rows.Scan(&s.ID, &s.FirstName, &s.LastName, &s.Email, &s.CreatedAt)
		if err != nil {
			return nil, err
		}
		students = append(students, s)
	}
	return students, nil
}

// Phase 6: Alumni Hall of Fame

func (r *AcademyRepository) CreateAlumniProfile(ctx context.Context, profile *domain.AlumniProfile) (int, error) {
	query := `
		INSERT INTO alumni_profiles (student_id, slug, cohort_name, linkedin_url, github_url, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`
	var id int
	err := r.db.QueryRow(ctx, query, profile.StudentID, profile.Slug, profile.CohortName, profile.LinkedInURL, profile.GitHubURL, time.Now()).Scan(&id)
	return id, err
}

func (r *AcademyRepository) GetAlumniProfiles(ctx context.Context) ([]*domain.AlumniProfile, error) {
	query := `
		SELECT ap.id, ap.student_id, (s.first_name || ' ' || s.last_name) as student_name, ap.slug, ap.cohort_name, ap.linkedin_url, ap.github_url, s.avatar_s3_key, s.bio, ap.created_at
		FROM alumni_profiles ap
		JOIN students s ON ap.student_id = s.id
		ORDER BY ap.created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var profiles []*domain.AlumniProfile
	for rows.Next() {
		p := &domain.AlumniProfile{}
		err := rows.Scan(&p.ID, &p.StudentID, &p.StudentName, &p.Slug, &p.CohortName, &p.LinkedInURL, &p.GitHubURL, &p.AvatarS3Key, &p.Bio, &p.CreatedAt)
		if err != nil {
			return nil, err
		}
		profiles = append(profiles, p)
	}

	if profiles == nil {
		profiles = []*domain.AlumniProfile{}
	}
	return profiles, nil
}

func (r *AcademyRepository) GetAlumniBySlug(ctx context.Context, slug string) (*domain.AlumniProfile, error) {
	query := `
		SELECT ap.id, ap.student_id, (s.first_name || ' ' || s.last_name) as student_name, ap.slug, ap.cohort_name, ap.linkedin_url, ap.github_url, s.avatar_s3_key, s.bio, ap.created_at
		FROM alumni_profiles ap
		JOIN students s ON ap.student_id = s.id
		WHERE ap.slug = $1
	`
	p := &domain.AlumniProfile{}
	err := r.db.QueryRow(ctx, query, slug).Scan(&p.ID, &p.StudentID, &p.StudentName, &p.Slug, &p.CohortName, &p.LinkedInURL, &p.GitHubURL, &p.AvatarS3Key, &p.Bio, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *AcademyRepository) UpdateAlumniProfile(ctx context.Context, profile *domain.AlumniProfile) error {
	query := `
		UPDATE alumni_profiles
		SET cohort_name = $1, linkedin_url = $2, github_url = $3
		WHERE id = $4
	`
	_, err := r.db.Exec(ctx, query, profile.CohortName, profile.LinkedInURL, profile.GitHubURL, profile.ID)
	return err
}

func (r *AcademyRepository) CreateCapstoneProject(ctx context.Context, project *domain.CapstoneProject) (int, error) {
	// Check if exists
	var existingID int
	err := r.db.QueryRow(ctx, "SELECT id FROM capstone_projects WHERE student_id = $1", project.StudentID).Scan(&existingID)
	
	if err != nil {
		// Assume not found, insert
		query := `
			INSERT INTO capstone_projects (student_id, project_title, description, architecture_diagram_url, live_demo_url, repo_url, status)
			VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
		`
		var newID int
		err = r.db.QueryRow(ctx, query, 
			project.StudentID, 
			project.ProjectTitle, 
			project.Description, 
			project.ArchitectureDiagramURL, 
			project.LiveDemoURL, 
			project.RepoURL, 
			project.Status,
		).Scan(&newID)
		return newID, err
	}

	// Update existing
	query := `
		UPDATE capstone_projects 
		SET project_title = $1, description = $2, architecture_diagram_url = $3, 
		    live_demo_url = $4, repo_url = $5, status = $6, feedback = NULL
		WHERE id = $7
	`
	_, err = r.db.Exec(ctx, query,
		project.ProjectTitle,
		project.Description,
		project.ArchitectureDiagramURL,
		project.LiveDemoURL,
		project.RepoURL,
		project.Status,
		existingID,
	)
	return existingID, err
}

func (r *AcademyRepository) GetCapstoneProjectsByAlumni(ctx context.Context, alumniID int) ([]*domain.CapstoneProject, error) {
	// For backward compatibility / helper, but now Capstone is student-linked
	query := `
		SELECT cp.id, cp.student_id, cp.project_title, cp.description, cp.architecture_diagram_url, cp.live_demo_url, cp.repo_url, cp.status, cp.feedback, cp.created_at
		FROM capstone_projects cp
		JOIN alumni_profiles ap ON cp.student_id = ap.student_id
		WHERE ap.id = $1 AND cp.status = 'approved'
		ORDER BY cp.created_at ASC
	`
	rows, err := r.db.Query(ctx, query, alumniID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []*domain.CapstoneProject
	for rows.Next() {
		p := &domain.CapstoneProject{}
		err := rows.Scan(&p.ID, &p.StudentID, &p.ProjectTitle, &p.Description, &p.ArchitectureDiagramURL, &p.LiveDemoURL, &p.RepoURL, &p.Status, &p.Feedback, &p.CreatedAt)
		if err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	if projects == nil {
		projects = []*domain.CapstoneProject{}
	}
	return projects, nil
}

func (r *AcademyRepository) GetCapstoneProjectsByStudent(ctx context.Context, studentID uuid.UUID) ([]*domain.CapstoneProject, error) {
	query := `
		SELECT id, student_id, project_title, description, architecture_diagram_url, live_demo_url, repo_url, status, feedback, created_at
		FROM capstone_projects
		WHERE student_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []*domain.CapstoneProject
	for rows.Next() {
		p := &domain.CapstoneProject{}
		err := rows.Scan(&p.ID, &p.StudentID, &p.ProjectTitle, &p.Description, &p.ArchitectureDiagramURL, &p.LiveDemoURL, &p.RepoURL, &p.Status, &p.Feedback, &p.CreatedAt)
		if err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	return projects, nil
}

func (r *AcademyRepository) GetPendingCapstones(ctx context.Context) ([]*domain.CapstoneProject, error) {
	query := `
		SELECT cp.id, cp.student_id, COALESCE(s.display_name, s.first_name || ' ' || s.last_name) as student_name, s.linkedin_url, s.github_url, cp.project_title, cp.description, cp.architecture_diagram_url, cp.live_demo_url, cp.repo_url, cp.status, cp.feedback, cp.created_at
		FROM capstone_projects cp
		JOIN students s ON cp.student_id = s.id
		WHERE cp.status = 'pending'
		ORDER BY cp.created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []*domain.CapstoneProject
	for rows.Next() {
		p := &domain.CapstoneProject{}
		err := rows.Scan(&p.ID, &p.StudentID, &p.StudentName, &p.StudentLinkedIn, &p.StudentGitHub, &p.ProjectTitle, &p.Description, &p.ArchitectureDiagramURL, &p.LiveDemoURL, &p.RepoURL, &p.Status, &p.Feedback, &p.CreatedAt)
		if err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	return projects, nil
}

func (r *AcademyRepository) GetCapstoneByID(ctx context.Context, id int) (*domain.CapstoneProject, error) {
	query := `
		SELECT cp.id, cp.student_id, COALESCE(s.display_name, s.first_name || ' ' || s.last_name) as student_name, s.linkedin_url, s.github_url, cp.project_title, cp.description, cp.architecture_diagram_url, cp.live_demo_url, cp.repo_url, cp.status, cp.feedback, cp.created_at 
		FROM capstone_projects cp
		JOIN students s ON cp.student_id = s.id
		WHERE cp.id = $1
	`
	p := &domain.CapstoneProject{}
	err := r.db.QueryRow(ctx, query, id).Scan(&p.ID, &p.StudentID, &p.StudentName, &p.StudentLinkedIn, &p.StudentGitHub, &p.ProjectTitle, &p.Description, &p.ArchitectureDiagramURL, &p.LiveDemoURL, &p.RepoURL, &p.Status, &p.Feedback, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *AcademyRepository) GetCapstoneByStudentID(ctx context.Context, studentID uuid.UUID) (*domain.CapstoneProject, error) {
	query := `SELECT id, student_id, project_title, description, architecture_diagram_url, live_demo_url, repo_url, status, feedback, created_at FROM capstone_projects WHERE student_id = $1`
	p := &domain.CapstoneProject{}
	err := r.db.QueryRow(ctx, query, studentID).Scan(&p.ID, &p.StudentID, &p.ProjectTitle, &p.Description, &p.ArchitectureDiagramURL, &p.LiveDemoURL, &p.RepoURL, &p.Status, &p.Feedback, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}
func (r *AcademyRepository) UpdateCapstoneStatus(ctx context.Context, id int, status string) error {
	query := `UPDATE capstone_projects SET status = $1 WHERE id = $2`
	_, err := r.db.Exec(ctx, query, status, id)
	return err
}

func (r *AcademyRepository) UpdateCapstoneStatusAndFeedback(ctx context.Context, id int, status, feedback string) error {
	query := `UPDATE capstone_projects SET status = $1, feedback = $2 WHERE id = $3`
	_, err := r.db.Exec(ctx, query, status, feedback, id)
	return err
}

func (r *AcademyRepository) DeleteCapstoneProjectsByAlumni(ctx context.Context, alumniID int) error {
	query := `DELETE FROM capstone_projects WHERE student_id = (SELECT student_id FROM alumni_profiles WHERE id = $1)`
	_, err := r.db.Exec(ctx, query, alumniID)
	return err
}

func (r *AcademyRepository) DeleteAlumniProfile(ctx context.Context, slug string) error {
	query := `DELETE FROM alumni_profiles WHERE slug = $1`
	_, err := r.db.Exec(ctx, query, slug)
	return err
}

func (r *AcademyRepository) GetGraduationEligibleStudents(ctx context.Context) ([]*domain.Student, error) {
	query := `
		SELECT s.id, s.first_name, s.last_name, s.email, s.status, s.created_at
		FROM students s
		WHERE s.status = 'active'
		ORDER BY s.first_name ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []*domain.Student
	for rows.Next() {
		s := &domain.Student{}
		err := rows.Scan(&s.ID, &s.FirstName, &s.LastName, &s.Email, &s.Status, &s.CreatedAt)
		if err != nil {
			return nil, err
		}
		students = append(students, s)
	}
	return students, nil
}

// ─── Billing & Installments ────────────────────────────────────────────────────

// CreateStudentBilling initialises a billing record for a new student.
func (r *AcademyRepository) CreateStudentBilling(ctx context.Context, studentID uuid.UUID) error {
	query := `
		INSERT INTO student_billing (student_id, total_due, total_paid, billing_status, created_at, updated_at)
		VALUES ($1, 25000000, 0, 'good_standing', NOW(), NOW())
		ON CONFLICT (student_id) DO NOTHING
	`
	_, err := r.db.Exec(ctx, query, studentID)
	return err
}

// GetStudentBilling retrieves the billing record for a student.
func (r *AcademyRepository) GetStudentBilling(ctx context.Context, studentID uuid.UUID) (*domain.StudentBilling, error) {
	query := `
		SELECT student_id, total_due, total_paid, next_payment_due_date, billing_status, created_at, updated_at
		FROM student_billing
		WHERE student_id = $1
	`
	b := &domain.StudentBilling{}
	err := r.db.QueryRow(ctx, query, studentID).Scan(
		&b.StudentID, &b.TotalDue, &b.TotalPaid, &b.NextPaymentDueDate, &b.BillingStatus, &b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return b, nil
}

// InsertPaymentHistory records a successful charge. The UNIQUE constraint on
// reference_id makes this naturally idempotent (duplicate webhooks are ignored).
func (r *AcademyRepository) InsertPaymentHistory(ctx context.Context, ph *domain.PaymentHistory) error {
	query := `
		INSERT INTO payment_history (student_id, amount_paid, gateway, reference_id, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (reference_id) DO NOTHING
	`
	_, err := r.db.Exec(ctx, query, ph.StudentID, ph.AmountPaid, ph.Gateway, ph.ReferenceID)
	return err
}

// IncrementBillingPaid adds amountKobo to total_paid and returns the new total.
func (r *AcademyRepository) IncrementBillingPaid(ctx context.Context, studentID uuid.UUID, amountKobo int) (int, error) {
	query := `
		UPDATE student_billing
		SET total_paid = total_paid + $2, updated_at = NOW()
		WHERE student_id = $1
		RETURNING total_paid
	`
	var newTotal int
	err := r.db.QueryRow(ctx, query, studentID, amountKobo).Scan(&newTotal)
	return newTotal, err
}

// SetBillingStatus updates the billing_status for a student.
func (r *AcademyRepository) SetBillingStatus(ctx context.Context, studentID uuid.UUID, status string) error {
	query := `UPDATE student_billing SET billing_status = $2, updated_at = NOW() WHERE student_id = $1`
	_, err := r.db.Exec(ctx, query, studentID, status)
	return err
}

// SetNextPaymentDue sets (or clears) the next payment due date.
func (r *AcademyRepository) SetNextPaymentDue(ctx context.Context, studentID uuid.UUID, dueDate *time.Time) error {
	query := `UPDATE student_billing SET next_payment_due_date = $2, updated_at = NOW() WHERE student_id = $1`
	_, err := r.db.Exec(ctx, query, studentID, dueDate)
	return err
}

// GetOverdueBillings returns all billing records whose next_payment_due_date
// has passed and are not yet paid in full.
func (r *AcademyRepository) GetOverdueBillings(ctx context.Context) ([]*domain.StudentBilling, error) {
	query := `
		SELECT student_id, total_due, total_paid, next_payment_due_date, billing_status, created_at, updated_at
		FROM student_billing
		WHERE next_payment_due_date < NOW()
		  AND billing_status = 'good_standing'
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*domain.StudentBilling
	for rows.Next() {
		b := &domain.StudentBilling{}
		if err := rows.Scan(&b.StudentID, &b.TotalDue, &b.TotalPaid, &b.NextPaymentDueDate, &b.BillingStatus, &b.CreatedAt, &b.UpdatedAt); err != nil {
			return nil, err
		}
		results = append(results, b)
	}
	if results == nil {
		results = []*domain.StudentBilling{}
	}
	return results, nil
}

// GetPaymentCount returns the number of payments a student has made.
func (r *AcademyRepository) GetPaymentCount(ctx context.Context, studentID uuid.UUID) (int, error) {
	query := `SELECT COUNT(*) FROM payment_history WHERE student_id = $1`
	var count int
	err := r.db.QueryRow(ctx, query, studentID).Scan(&count)
	return count, err
}

// GetStudentPaymentHistory returns all payment ledger entries for a student,
// ordered by most recent first, for the billing hub transaction table.
func (r *AcademyRepository) GetStudentPaymentHistory(ctx context.Context, studentID uuid.UUID) ([]*domain.PaymentHistory, error) {
	query := `
		SELECT id, student_id, amount_paid, gateway, reference_id, created_at
		FROM payment_history
		WHERE student_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*domain.PaymentHistory
	for rows.Next() {
		ph := &domain.PaymentHistory{}
		if err := rows.Scan(&ph.ID, &ph.StudentID, &ph.AmountPaid, &ph.Gateway, &ph.ReferenceID, &ph.CreatedAt); err != nil {
			return nil, err
		}
		results = append(results, ph)
	}
	if results == nil {
		results = []*domain.PaymentHistory{}
	}
	return results, nil
}

// GetBillingsDueIn returns all billings with a due date arriving in exactly 'days' days.
func (r *AcademyRepository) GetBillingsDueIn(ctx context.Context, days int) ([]*domain.StudentBilling, error) {
	query := `
		SELECT student_id, total_due, total_paid, next_payment_due_date, billing_status, created_at, updated_at
		FROM student_billing
		WHERE DATE(next_payment_due_date) = CURRENT_DATE + $1 * INTERVAL '1 day'
		  AND billing_status = 'good_standing'
	`
	rows, err := r.db.Query(ctx, query, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*domain.StudentBilling
	for rows.Next() {
		b := &domain.StudentBilling{}
		if err := rows.Scan(&b.StudentID, &b.TotalDue, &b.TotalPaid, &b.NextPaymentDueDate, &b.BillingStatus, &b.CreatedAt, &b.UpdatedAt); err != nil {
			return nil, err
		}
		results = append(results, b)
	}
	return results, nil
}

// GetStudentsByIDs fetches a list of students by their UUIDs.
func (r *AcademyRepository) GetStudentsByIDs(ctx context.Context, ids []uuid.UUID) ([]*domain.Student, error) {
	if len(ids) == 0 {
		return []*domain.Student{}, nil
	}
	query := `
		SELECT id, first_name, last_name, email, password_hash, is_first_login, status, warning_count, disqualification_reason, is_manually_locked, reset_token, reset_token_expires_at, created_at, role
		FROM students WHERE id = ANY($1)
	`
	rows, err := r.db.Query(ctx, query, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []*domain.Student
	for rows.Next() {
		s := &domain.Student{}
		err := rows.Scan(
			&s.ID, &s.FirstName, &s.LastName, &s.Email, &s.PasswordHash, &s.IsFirstLogin,
			&s.Status, &s.WarningCount, &s.DisqualificationReason, &s.IsManuallyLocked, &s.ResetToken, &s.ResetTokenExpiresAt, &s.CreatedAt, &s.Role,
		)
		if err != nil {
			return nil, err
		}
		students = append(students, s)
	}
	return students, nil
}

// ─── Admin Command Center ───────────────────────────────────────────────────

func (r *AcademyRepository) GetBillingOverview(ctx context.Context) (*domain.BillingOverview, error) {
	query := `
		SELECT 
			COALESCE(SUM(total_paid), 0) as total_revenue,
			COALESCE(SUM(total_due - total_paid), 0) as pending_receivables,
			COUNT(*) FILTER (WHERE billing_status = 'payment_locked') as overdue_accounts
		FROM student_billing
	`
	stats := &domain.BillingOverview{}
	err := r.db.QueryRow(ctx, query).Scan(&stats.TotalRevenue, &stats.PendingReceivables, &stats.OverdueAccounts)
	return stats, err
}

func (r *AcademyRepository) GetAllStudentBillings(ctx context.Context) ([]*domain.AdminStudentBilling, error) {
	query := `
		SELECT 
			s.id, s.first_name, s.last_name, s.email, 
			sb.total_paid, (sb.total_due - sb.total_paid) as remaining_balance,
			sb.next_payment_due_date, sb.billing_status, s.status as academic_status,
			s.is_manually_locked
		FROM students s
		JOIN student_billing sb ON s.id = sb.student_id
		ORDER BY s.first_name ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*domain.AdminStudentBilling
	for rows.Next() {
		b := &domain.AdminStudentBilling{}
		err := rows.Scan(
			&b.ID, &b.FirstName, &b.LastName, &b.Email,
			&b.TotalPaid, &b.RemainingBalance, &b.NextPaymentDueDate,
			&b.BillingStatus, &b.AcademicStatus, &b.IsManuallyLocked,
		)
		if err != nil {
			return nil, err
		}
		results = append(results, b)
	}
	if results == nil {
		results = []*domain.AdminStudentBilling{}
	}
	return results, nil
}

func (r *AcademyRepository) SetManualLock(ctx context.Context, id uuid.UUID, locked bool) error {
	query := `UPDATE students SET is_manually_locked = $2 WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id, locked)
	return err
}

// ─── Cohorts & Curriculum ───────────────────────────────────────────────────

func (r *AcademyRepository) CreateCohort(ctx context.Context, name string) (int, error) {
	query := `INSERT INTO cohorts (name) VALUES ($1) RETURNING id`
	var id int
	err := r.db.QueryRow(ctx, query, name).Scan(&id)
	return id, err
}

func (r *AcademyRepository) GetCohortByID(ctx context.Context, id int) (*domain.Cohort, error) {
	query := `SELECT id, name, status, telegram_chat_id, created_at FROM cohorts WHERE id = $1`
	c := &domain.Cohort{}
	err := r.db.QueryRow(ctx, query, id).Scan(&c.ID, &c.Name, &c.Status, &c.TelegramChatID, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return c, nil
}

func (r *AcademyRepository) CloneCohortCurriculum(ctx context.Context, sourceCohortID int, newCohortID int) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Fetch master weeks
	weeksQuery := `SELECT id, week_number, title, recording_url, materials, transcript, assignment_instructions, assignment_due_date FROM cohort_weeks WHERE cohort_id = $1`
	rows, err := tx.Query(ctx, weeksQuery, sourceCohortID)
	if err != nil {
		return err
	}
	defer rows.Close()

	type weekData struct {
		ID                     int
		WeekNumber             int
		Title                  string
		RecordingURL           *string
		Materials              []domain.CourseMaterial
		Transcript             *string
		AssignmentInstructions *string
		AssignmentDueDate      *time.Time
	}
	var weeksToClone []weekData
	for rows.Next() {
		var w weekData
		if err := rows.Scan(&w.ID, &w.WeekNumber, &w.Title, &w.RecordingURL, &w.Materials, &w.Transcript, &w.AssignmentInstructions, &w.AssignmentDueDate); err != nil {
			return err
		}
		weeksToClone = append(weeksToClone, w)
	}
	rows.Close() // Explicitly close before next queries

	for _, w := range weeksToClone {
		var newWeekID int
		insertWeekQuery := `
			INSERT INTO cohort_weeks (cohort_id, week_number, title, recording_url, materials, transcript, assignment_instructions, assignment_due_date, status)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'locked') RETURNING id
		`
		if err := tx.QueryRow(ctx, insertWeekQuery, newCohortID, w.WeekNumber, w.Title, w.RecordingURL, w.Materials, w.Transcript, w.AssignmentInstructions, w.AssignmentDueDate).Scan(&newWeekID); err != nil {
			return err
		}

		// Clone sessions for this week
		sessionsQuery := `SELECT title, visibility_status, meeting_url, recording_url FROM class_sessions WHERE cohort_week_id = $1`
		sessRows, err := tx.Query(ctx, sessionsQuery, w.ID)
		if err != nil {
			return err
		}

		type sessData struct {
			Title            string
			VisibilityStatus string
			MeetingURL       string
			RecordingURL     string
		}
		var sessionsToClone []sessData
		for sessRows.Next() {
			var s sessData
			if err := sessRows.Scan(&s.Title, &s.VisibilityStatus, &s.MeetingURL, &s.RecordingURL); err != nil {
				sessRows.Close()
				return err
			}
			sessionsToClone = append(sessionsToClone, s)
		}
		sessRows.Close()

		for _, s := range sessionsToClone {
			insertSessQuery := `
				INSERT INTO class_sessions (cohort_week_id, title, status, visibility_status, meeting_url, scheduled_at, recording_url)
				VALUES ($1, $2, 'scheduled', $3, $4, NOW(), $5)
			`
			if _, err := tx.Exec(ctx, insertSessQuery, newWeekID, s.Title, s.VisibilityStatus, s.MeetingURL, s.RecordingURL); err != nil {
				return err
			}
		}
	}

	return tx.Commit(ctx)
}

func (r *AcademyRepository) UpdateStudentProfile(ctx context.Context, id uuid.UUID, avatarKey, linkedin, github, bio, username, displayName *string) error {
	query := `
		UPDATE students 
		SET avatar_s3_key = $1, linkedin_url = $2, github_url = $3, bio = $4, username = $5, display_name = $6
		WHERE id = $7
	`
	_, err := r.db.Exec(ctx, query, avatarKey, linkedin, github, bio, username, displayName, id)
	return err
}

func (r *AcademyRepository) UpdateStudentPreferences(ctx context.Context, id uuid.UUID, preferences string) error {
	query := `UPDATE students SET preferences = $1 WHERE id = $2`
	_, err := r.db.Exec(ctx, query, preferences, id)
	return err
}

func (r *AcademyRepository) SetPendingEmailToken(ctx context.Context, id uuid.UUID, email, token string) error {
	query := `UPDATE students SET pending_email = $1, email_verify_token = $2 WHERE id = $3`
	_, err := r.db.Exec(ctx, query, email, token, id)
	return err
}

func (r *AcademyRepository) ConfirmPendingEmail(ctx context.Context, id uuid.UUID, newEmail string) error {
	query := `UPDATE students SET email = $1, pending_email = NULL, email_verify_token = NULL WHERE id = $2`
	_, err := r.db.Exec(ctx, query, newEmail, id)
	return err
}

func (r *AcademyRepository) GetStudentByUsername(ctx context.Context, username string) (*domain.Student, error) {
	query := `
		SELECT id, first_name, last_name, email, password_hash, is_first_login, status, warning_count, disqualification_reason, is_manually_locked, reset_token, reset_token_expires_at, cohort_id, avatar_s3_key, linkedin_url, github_url, bio, username, display_name, preferences, pending_email, email_verify_token, created_at, role
		FROM students WHERE username = $1
	`
	student := &domain.Student{}
	err := r.db.QueryRow(ctx, query, username).Scan(
		&student.ID, &student.FirstName, &student.LastName, &student.Email,
		&student.PasswordHash, &student.IsFirstLogin, &student.Status, &student.WarningCount,
		&student.DisqualificationReason, &student.IsManuallyLocked, &student.ResetToken, &student.ResetTokenExpiresAt, &student.CohortID,
		&student.AvatarS3Key, &student.LinkedInURL, &student.GitHubURL, &student.Bio, 
		&student.Username, &student.DisplayName, &student.Preferences, &student.PendingEmail, &student.EmailVerifyToken, 
		&student.CreatedAt, &student.Role,
	)
	return student, err
}

func (r *AcademyRepository) GetStudentByEmailVerifyToken(ctx context.Context, token string) (*domain.Student, error) {
	query := `
		SELECT id, first_name, last_name, email, password_hash, is_first_login, status, warning_count, disqualification_reason, is_manually_locked, reset_token, reset_token_expires_at, cohort_id, avatar_s3_key, linkedin_url, github_url, bio, username, display_name, preferences, pending_email, email_verify_token, created_at, role
		FROM students WHERE email_verify_token = $1
	`
	student := &domain.Student{}
	err := r.db.QueryRow(ctx, query, token).Scan(
		&student.ID, &student.FirstName, &student.LastName, &student.Email,
		&student.PasswordHash, &student.IsFirstLogin, &student.Status, &student.WarningCount,
		&student.DisqualificationReason, &student.IsManuallyLocked, &student.ResetToken, &student.ResetTokenExpiresAt, &student.CohortID,
		&student.AvatarS3Key, &student.LinkedInURL, &student.GitHubURL, &student.Bio, 
		&student.Username, &student.DisplayName, &student.Preferences, &student.PendingEmail, &student.EmailVerifyToken, 
		&student.CreatedAt, &student.Role,
	)
	return student, err
}

// ─── Notifications ─────────────────────────────────────────────────────────────

func (r *AcademyRepository) CreateNotification(ctx context.Context, notif *domain.Notification) error {
	query := `
		INSERT INTO notifications (id, user_id, actor_id, type, message, reference_url, is_read, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := r.db.Exec(ctx, query, notif.ID, notif.UserID, notif.ActorID, notif.Type, notif.Message, notif.ReferenceURL, notif.IsRead, notif.CreatedAt)
	return err
}

func (r *AcademyRepository) BulkCreateNotifications(ctx context.Context, notifications []*domain.Notification) error {
	if len(notifications) == 0 {
		return nil
	}

	// Build bulk insert query
	query := `INSERT INTO notifications (id, user_id, actor_id, type, message, reference_url, is_read, created_at) VALUES `
	values := []interface{}{}
	placeholders := []string{}

	for i, notif := range notifications {
		base := i * 8
		placeholders = append(placeholders, fmt.Sprintf("($%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d)", base+1, base+2, base+3, base+4, base+5, base+6, base+7, base+8))
		values = append(values, notif.ID, notif.UserID, notif.ActorID, notif.Type, notif.Message, notif.ReferenceURL, notif.IsRead, notif.CreatedAt)
	}

	query += strings.Join(placeholders, ", ")
	
	_, err := r.db.Exec(ctx, query, values...)
	return err
}

func (r *AcademyRepository) GetUnreadNotifications(ctx context.Context, userID string) ([]*domain.Notification, error) {
	query := `
		SELECT n.id, n.user_id, n.actor_id, n.type, n.message, n.reference_url, n.is_read, n.created_at,
		       COALESCE(s.first_name || ' ' || s.last_name, s.display_name) as actor_name,
		       s.avatar_s3_key as actor_avatar
		FROM notifications n
		LEFT JOIN students s ON n.actor_id = s.id::text OR n.actor_id = 'student_' || s.id::text
		WHERE n.user_id = $1 AND n.is_read = FALSE
		ORDER BY n.created_at DESC
		LIMIT 50
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifs []*domain.Notification
	for rows.Next() {
		n := &domain.Notification{}
		err := rows.Scan(&n.ID, &n.UserID, &n.ActorID, &n.Type, &n.Message, &n.ReferenceURL, &n.IsRead, &n.CreatedAt, &n.ActorName, &n.ActorAvatar)
		if err != nil {
			return nil, err
		}
		notifs = append(notifs, n)
	}

	if notifs == nil {
		notifs = []*domain.Notification{}
	}
	return notifs, nil
}

func (r *AcademyRepository) MarkNotificationRead(ctx context.Context, id uuid.UUID, userID string) error {
	query := `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(ctx, query, id, userID)
	return err
}

func (r *AcademyRepository) MarkAllNotificationsRead(ctx context.Context, userID string) error {
	query := `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`
	_, err := r.db.Exec(ctx, query, userID)
	return err
}

func (r *AcademyRepository) SearchStudents(ctx context.Context, q string) ([]*domain.Student, error) {
	query := `
		SELECT id, first_name, last_name, email, status, cohort_id, avatar_s3_key, username, display_name, created_at
		FROM students
		WHERE username ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1 OR display_name ILIKE $1
		ORDER BY username ASC
		LIMIT 15
	`
	searchTerm := "%" + q + "%"
	rows, err := r.db.Query(ctx, query, searchTerm)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []*domain.Student
	for rows.Next() {
		s := &domain.Student{}
		err := rows.Scan(
			&s.ID, &s.FirstName, &s.LastName, &s.Email, &s.Status, &s.CohortID,
			&s.AvatarS3Key, &s.Username, &s.DisplayName, &s.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		students = append(students, s)
	}
	if students == nil {
		students = []*domain.Student{}
	}
	return students, nil
}

func (r *AcademyRepository) GetLabIDBySubmissionID(ctx context.Context, subID int) (int, error) {
	var labID int
	query := `SELECT lab_id FROM lab_submissions WHERE id = $1`
	err := r.db.QueryRow(ctx, query, subID).Scan(&labID)
	return labID, err
}

func (r *AcademyRepository) GetStudentsByCohort(ctx context.Context, cohortID int) ([]*domain.Student, error) {
	query := `
		SELECT 
			id, first_name, last_name, email, status, cohort_id, created_at
		FROM students
		WHERE cohort_id = $1
	`
	rows, err := r.db.Query(ctx, query, cohortID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []*domain.Student
	for rows.Next() {
		s := &domain.Student{}
		err := rows.Scan(
			&s.ID, &s.FirstName, &s.LastName, &s.Email, &s.Status, &s.CohortID, &s.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		students = append(students, s)
	}
	if students == nil {
		students = []*domain.Student{}
	}
	return students, nil
}

// ─── War Room Discussion Forum Repository Methods ────────────────────────────

func (r *AcademyRepository) CreateThread(ctx context.Context, thread *domain.Thread) error {
	query := `
		INSERT INTO threads (id, author_id, title, content, category, is_resolved, created_at, media_urls)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	mediaUrlsJSON, _ := json.Marshal(thread.MediaUrls)
	if thread.MediaUrls == nil {
		mediaUrlsJSON = []byte("[]")
	}
	_, err := r.db.Exec(ctx, query, thread.ID, thread.AuthorID, thread.Title, thread.Content, thread.Category, thread.IsResolved, thread.CreatedAt, mediaUrlsJSON)
	return err
}

func (r *AcademyRepository) GetThreads(ctx context.Context, currentStudentID uuid.UUID, category, search string, limit, offset int) ([]*domain.Thread, error) {
	var query string
	var args []interface{}
	args = append(args, currentStudentID)
	argIndex := 2

	query = `
		SELECT t.id, t.author_id, t.title, t.content, t.category, t.is_resolved, t.created_at, t.media_urls,
		       COALESCE(s.display_name, s.first_name || ' ' || s.last_name) as author_name,
		       s.avatar_s3_key, s.role as author_role, c.name as cohort_name,
		       (SELECT COUNT(*) FROM replies WHERE thread_id = t.id) as reply_count,
		       (SELECT COALESCE(json_object_agg(reaction_type, count), '{}'::json) FROM (SELECT reaction_type, COUNT(*) as count FROM reactions WHERE entity_type = 'thread' AND entity_id = t.id GROUP BY reaction_type) sub) as reaction_counts,
		       (SELECT COALESCE(json_agg(reaction_type), '[]'::json) FROM reactions WHERE entity_type = 'thread' AND entity_id = t.id AND user_id = $1) as user_reactions
		FROM threads t
		JOIN students s ON t.author_id = s.id
		JOIN cohorts c ON s.cohort_id = c.id
		WHERE 1=1
	`

	if category != "" {
		query += fmt.Sprintf(" AND t.category = $%d", argIndex)
		args = append(args, category)
		argIndex++
	}

	if search != "" {
		query += fmt.Sprintf(" AND (to_tsvector('english', t.title) @@ plainto_tsquery('english', $%d) OR t.content ILIKE $%d)", argIndex, argIndex+1)
		args = append(args, search, "%"+search+"%")
		argIndex += 2
	}

	query += fmt.Sprintf(" ORDER BY t.created_at DESC LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var threads []*domain.Thread
	for rows.Next() {
		t := &domain.Thread{}
		var mediaUrlsJSON []byte
		var reactionCountsJSON []byte
		var userReactionsJSON []byte

		err := rows.Scan(
			&t.ID, &t.AuthorID, &t.Title, &t.Content, &t.Category, &t.IsResolved, &t.CreatedAt, &mediaUrlsJSON,
			&t.AuthorName, &t.AuthorAvatarKey, &t.AuthorRole, &t.CohortName, &t.ReplyCount,
			&reactionCountsJSON, &userReactionsJSON,
		)
		if err != nil {
			return nil, err
		}

		_ = json.Unmarshal(mediaUrlsJSON, &t.MediaUrls)
		_ = json.Unmarshal(reactionCountsJSON, &t.ReactionCounts)
		_ = json.Unmarshal(userReactionsJSON, &t.UserReactions)

		threads = append(threads, t)
	}
	if threads == nil {
		threads = []*domain.Thread{}
	}
	return threads, nil
}

func (r *AcademyRepository) GetThreadByID(ctx context.Context, currentStudentID uuid.UUID, id uuid.UUID) (*domain.Thread, error) {
	query := `
		SELECT t.id, t.author_id, t.title, t.content, t.category, t.is_resolved, t.created_at, t.media_urls,
		       COALESCE(s.display_name, s.first_name || ' ' || s.last_name) as author_name,
		       s.avatar_s3_key, s.role as author_role, c.name as cohort_name,
		       (SELECT COUNT(*) FROM replies WHERE thread_id = t.id) as reply_count,
		       (SELECT COALESCE(json_object_agg(reaction_type, count), '{}'::json) FROM (SELECT reaction_type, COUNT(*) as count FROM reactions WHERE entity_type = 'thread' AND entity_id = t.id GROUP BY reaction_type) sub) as reaction_counts,
		       (SELECT COALESCE(json_agg(reaction_type), '[]'::json) FROM reactions WHERE entity_type = 'thread' AND entity_id = t.id AND user_id = $1) as user_reactions
		FROM threads t
		JOIN students s ON t.author_id = s.id
		JOIN cohorts c ON s.cohort_id = c.id
		WHERE t.id = $2
	`
	t := &domain.Thread{}
	var mediaUrlsJSON []byte
	var reactionCountsJSON []byte
	var userReactionsJSON []byte

	err := r.db.QueryRow(ctx, query, currentStudentID, id).Scan(
		&t.ID, &t.AuthorID, &t.Title, &t.Content, &t.Category, &t.IsResolved, &t.CreatedAt, &mediaUrlsJSON,
		&t.AuthorName, &t.AuthorAvatarKey, &t.AuthorRole, &t.CohortName, &t.ReplyCount,
		&reactionCountsJSON, &userReactionsJSON,
	)
	if err != nil {
		return nil, err
	}

	_ = json.Unmarshal(mediaUrlsJSON, &t.MediaUrls)
	_ = json.Unmarshal(reactionCountsJSON, &t.ReactionCounts)
	_ = json.Unmarshal(userReactionsJSON, &t.UserReactions)

	return t, nil
}

func (r *AcademyRepository) UpdateThread(ctx context.Context, thread *domain.Thread) error {
	query := `
		UPDATE threads
		SET title = $1, content = $2, category = $3
		WHERE id = $4
	`
	_, err := r.db.Exec(ctx, query, thread.Title, thread.Content, thread.Category, thread.ID)
	return err
}

func (r *AcademyRepository) DeleteThread(ctx context.Context, threadID uuid.UUID) error {
	query := `DELETE FROM threads WHERE id = $1`
	_, err := r.db.Exec(ctx, query, threadID)
	return err
}


func (r *AcademyRepository) CreateReply(ctx context.Context, reply *domain.Reply) error {
	query := `
		INSERT INTO replies (id, thread_id, author_id, content, is_instructor_endorsed, created_at, media_urls)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	mediaUrlsJSON, _ := json.Marshal(reply.MediaUrls)
	if reply.MediaUrls == nil {
		mediaUrlsJSON = []byte("[]")
	}
	_, err := r.db.Exec(ctx, query, reply.ID, reply.ThreadID, reply.AuthorID, reply.Content, reply.IsInstructorEndorsed, reply.CreatedAt, mediaUrlsJSON)
	return err
}

func (r *AcademyRepository) GetRepliesByThreadID(ctx context.Context, currentStudentID uuid.UUID, threadID uuid.UUID) ([]*domain.Reply, error) {
	query := `
		SELECT rp.id, rp.thread_id, rp.author_id, rp.content, rp.is_instructor_endorsed, rp.created_at, rp.media_urls,
		       COALESCE(s.display_name, s.first_name || ' ' || s.last_name) as author_name,
		       s.avatar_s3_key, s.role as author_role, c.name as cohort_name,
		       (SELECT COALESCE(json_object_agg(reaction_type, count), '{}'::json) FROM (SELECT reaction_type, COUNT(*) as count FROM reactions WHERE entity_type = 'reply' AND entity_id = rp.id GROUP BY reaction_type) sub) as reaction_counts,
		       (SELECT COALESCE(json_agg(reaction_type), '[]'::json) FROM reactions WHERE entity_type = 'reply' AND entity_id = rp.id AND user_id = $1) as user_reactions
		FROM replies rp
		JOIN students s ON rp.author_id = s.id
		JOIN cohorts c ON s.cohort_id = c.id
		WHERE rp.thread_id = $2
		ORDER BY rp.created_at ASC
	`
	rows, err := r.db.Query(ctx, query, currentStudentID, threadID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var replies []*domain.Reply
	for rows.Next() {
		rp := &domain.Reply{}
		var mediaUrlsJSON []byte
		var reactionCountsJSON []byte
		var userReactionsJSON []byte

		err := rows.Scan(
			&rp.ID, &rp.ThreadID, &rp.AuthorID, &rp.Content, &rp.IsInstructorEndorsed, &rp.CreatedAt, &mediaUrlsJSON,
			&rp.AuthorName, &rp.AuthorAvatarKey, &rp.AuthorRole, &rp.CohortName,
			&reactionCountsJSON, &userReactionsJSON,
		)
		if err != nil {
			return nil, err
		}

		_ = json.Unmarshal(mediaUrlsJSON, &rp.MediaUrls)
		_ = json.Unmarshal(reactionCountsJSON, &rp.ReactionCounts)
		_ = json.Unmarshal(userReactionsJSON, &rp.UserReactions)

		replies = append(replies, rp)
	}
	if replies == nil {
		replies = []*domain.Reply{}
	}
	return replies, nil
}

func (r *AcademyRepository) EndorseReply(ctx context.Context, replyID uuid.UUID) error {
	query := `UPDATE replies SET is_instructor_endorsed = true WHERE id = $1`
	_, err := r.db.Exec(ctx, query, replyID)
	return err
}

func (r *AcademyRepository) GetReplyByID(ctx context.Context, replyID uuid.UUID) (*domain.Reply, error) {
	query := `
		SELECT id, thread_id, author_id, content, is_instructor_endorsed, created_at
		FROM replies WHERE id = $1
	`
	rp := &domain.Reply{}
	err := r.db.QueryRow(ctx, query, replyID).Scan(&rp.ID, &rp.ThreadID, &rp.AuthorID, &rp.Content, &rp.IsInstructorEndorsed, &rp.CreatedAt)
	if err != nil {
		return nil, err
	}
	return rp, nil
}

func (r *AcademyRepository) UpdateReply(ctx context.Context, reply *domain.Reply) error {
	query := `
		UPDATE replies
		SET content = $1
		WHERE id = $2
	`
	_, err := r.db.Exec(ctx, query, reply.Content, reply.ID)
	return err
}

func (r *AcademyRepository) DeleteReply(ctx context.Context, replyID uuid.UUID) error {
	query := `DELETE FROM replies WHERE id = $1`
	_, err := r.db.Exec(ctx, query, replyID)
	return err
}

func (r *AcademyRepository) ToggleReaction(ctx context.Context, entityType string, entityID uuid.UUID, studentID uuid.UUID, reactionType string) (bool, map[string]int, error) {
	// Check if reaction exists
	var exists bool
	err := r.db.QueryRow(ctx, 
		`SELECT EXISTS(SELECT 1 FROM reactions WHERE entity_type = $1 AND entity_id = $2 AND user_id = $3 AND reaction_type = $4)`, 
		entityType, entityID, studentID, reactionType).Scan(&exists)
	if err != nil {
		return false, nil, err
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return false, nil, err
	}
	defer tx.Rollback(ctx)

	if exists {
		// Unlike: delete row
		_, err = tx.Exec(ctx, 
			`DELETE FROM reactions WHERE entity_type = $1 AND entity_id = $2 AND user_id = $3 AND reaction_type = $4`, 
			entityType, entityID, studentID, reactionType)
		if err != nil {
			return false, nil, err
		}
	} else {
		// Like: insert row
		_, err = tx.Exec(ctx, 
			`INSERT INTO reactions (id, entity_type, entity_id, user_id, reaction_type) VALUES ($1, $2, $3, $4, $5)`, 
			uuid.New(), entityType, entityID, studentID, reactionType)
		if err != nil {
			return false, nil, err
		}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return false, nil, err
	}

	// Get updated reaction counts
	var reactionCountsJSON []byte
	err = r.db.QueryRow(ctx, 
		`SELECT COALESCE(json_object_agg(reaction_type, count), '{}'::json) FROM (SELECT reaction_type, COUNT(*) as count FROM reactions WHERE entity_type = $1 AND entity_id = $2 GROUP BY reaction_type) sub`, 
		entityType, entityID).Scan(&reactionCountsJSON)
	if err != nil {
		return false, nil, err
	}

	var reactionCounts map[string]int
	if err := json.Unmarshal(reactionCountsJSON, &reactionCounts); err != nil {
		return false, nil, err
	}

	return !exists, reactionCounts, nil
}

func (r *AcademyRepository) RecordWaitlistDeposit(ctx context.Context, email string, amountKobo int, reference string) (int, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	// 1. Get waitlist ID by email
	var waitlistID uuid.UUID
	err = tx.QueryRow(ctx, "SELECT id FROM waitlist WHERE email = $1", email).Scan(&waitlistID)
	if err != nil {
		return 0, fmt.Errorf("waitlist lead not found: %w", err)
	}

	// 2. Check if transaction has already been processed
	var exists bool
	err = tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM waitlist_transactions WHERE reference = $1)", reference).Scan(&exists)
	if err != nil {
		return 0, fmt.Errorf("failed to check transaction existence: %w", err)
	}
	if exists {
		var currentTotal int
		err = tx.QueryRow(ctx, "SELECT total_amount_paid FROM waitlist WHERE id = $1", waitlistID).Scan(&currentTotal)
		if err != nil {
			return 0, fmt.Errorf("failed to fetch current waitlist total: %w", err)
		}
		return currentTotal, nil
	}

	// 3. Log into waitlist_transactions ledger
	_, err = tx.Exec(ctx, `
		INSERT INTO waitlist_transactions (waitlist_id, amount, reference)
		VALUES ($1, $2, $3)
	`, waitlistID, amountKobo, reference)
	if err != nil {
		return 0, fmt.Errorf("failed to log waitlist transaction: %w", err)
	}

	// 4. Update total amount paid and set deposit_paid to true
	var newTotal int
	err = tx.QueryRow(ctx, `
		UPDATE waitlist
		SET deposit_paid = true,
		    total_amount_paid = total_amount_paid + $1
		WHERE id = $2
		RETURNING total_amount_paid
	`, amountKobo, waitlistID).Scan(&newTotal)
	if err != nil {
		return 0, fmt.Errorf("failed to update waitlist lead totals: %w", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return 0, err
	}

	return newTotal, nil
}

