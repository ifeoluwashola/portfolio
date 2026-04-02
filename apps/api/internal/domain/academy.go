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
	Phone         string    `json:"phone"`
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
	Phone       string `json:"phone"`
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
	GetAdminCohortApplications(ctx context.Context) ([]*CohortApplication, error)
	GetStudentByEmail(ctx context.Context, email string) (*Student, error)
	GetStudentByID(ctx context.Context, id uuid.UUID) (*Student, error)
	CreateStudent(ctx context.Context, student *Student) error
	UpdateStudentPassword(ctx context.Context, id uuid.UUID, newPasswordHash string) error
	SetStudentResetToken(ctx context.Context, email, token string, expiresAt time.Time) error
	GetStudentByResetToken(ctx context.Context, token string) (*Student, error)

	// Phase 4: Curriculum & Assignments
	GetWeeks(ctx context.Context) ([]*CohortWeek, error)
	GetWeekByID(ctx context.Context, id int) (*CohortWeek, error)
	UpdateWeek(ctx context.Context, week *CohortWeek) error
	CreateAssignment(ctx context.Context, ass *Assignment) error
	GetStudentAssignments(ctx context.Context, studentID uuid.UUID) ([]*Assignment, error)
	GetAllAssignments(ctx context.Context) ([]*Assignment, error)
	UpdateAssignmentGrade(ctx context.Context, id uuid.UUID, status, feedback string) error
	GetAssignmentByWeek(ctx context.Context, studentID uuid.UUID, weekID int) (*Assignment, error)
}

type AcademyService interface {
	InitializeApplication(ctx context.Context, req *AcademyApplyRequest) (*AcademyApplyResponse, error)
	ProcessWebhook(ctx context.Context, signature string, body []byte) error
	GetAdminApplications(ctx context.Context) (*AdminCohortResponse, error)
	LoginStudent(ctx context.Context, req *AcademyLoginRequest) (*AcademyAuthResponse, error)
	ChangePassword(ctx context.Context, studentID uuid.UUID, req *AcademyChangePasswordRequest) error
	ForgotPassword(ctx context.Context, req *AcademyForgotPasswordRequest) error
	ResetPassword(ctx context.Context, req *AcademyResetPasswordRequest) error

	// Phase 4: Curriculum & Assignments
	GetCurriculum(ctx context.Context) ([]*CohortWeek, error)
	UpdateCohortWeek(ctx context.Context, req *UpdateWeekRequest) error
	SubmitAssignment(ctx context.Context, studentID uuid.UUID, req *SubmitAssignmentRequest) error
	GetStudentDashboardData(ctx context.Context, studentID uuid.UUID) (*StudentDashboardResponse, error)
	GetAdminSubmissions(ctx context.Context) ([]*Assignment, error)
	GradeSubmission(ctx context.Context, req *GradeAssignmentRequest) error
}

type CohortWeek struct {
	ID           int        `json:"id"`
	WeekNumber   int        `json:"week_number"`
	Title        string     `json:"title"`
	Status       string     `json:"status"` // locked, pre-flight, live, archived
	MeetLink     *string    `json:"meet_link"`
	RecordingURL *string    `json:"recording_url"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type Assignment struct {
	ID            uuid.UUID `json:"id"`
	StudentID     uuid.UUID `json:"student_id"`
	StudentName   string    `json:"student_name,omitempty"` // populated for admin views
	WeekID        int       `json:"week_id"`
	WeekNumber    int       `json:"week_number,omitempty"`
	GitHubURL     string    `json:"github_url"`
	Status        string    `json:"status"` // pending, passed, failed
	AdminFeedback *string   `json:"admin_feedback"`
	CreatedAt     time.Time `json:"created_at"`
}

type UpdateWeekRequest struct {
	ID           int     `json:"id"`
	Status       string  `json:"status"`
	MeetLink     *string `json:"meet_link"`
	RecordingURL *string `json:"recording_url"`
}

type SubmitAssignmentRequest struct {
	WeekID    int    `json:"week_id"`
	GitHubURL string `json:"github_url"`
}

type GradeAssignmentRequest struct {
	AssignmentID uuid.UUID `json:"assignment_id"`
	Status       string    `json:"status"`
	Feedback     string    `json:"feedback"`
}

type StudentDashboardResponse struct {
	Weeks       []*CohortWeek `json:"weeks"`
	Assignments []*Assignment `json:"assignments"`
}

type Student struct {
	ID                  uuid.UUID  `json:"id"`
	FirstName           string     `json:"first_name"`
	LastName            string     `json:"last_name"`
	Email               string     `json:"email"`
	PasswordHash        string     `json:"-"` // never leak password hash
	IsFirstLogin        bool       `json:"is_first_login"`
	ResetToken          *string    `json:"-"`
	ResetTokenExpiresAt *time.Time `json:"-"`
	CreatedAt           time.Time  `json:"created_at"`
}

type AcademyLoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AcademyAuthResponse struct {
	Token        string `json:"token"`
	IsFirstLogin bool   `json:"is_first_login"`
}

type AcademyChangePasswordRequest struct {
	NewPassword string `json:"new_password"`
}

type AcademyForgotPasswordRequest struct {
	Email string `json:"email"`
}

type AcademyResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}

// Admin-specific response structures
type AdminCohortStats struct {
	TotalApplications int `json:"total_applications"`
	PaidSeats         int `json:"paid_seats"`
	PendingSeats      int `json:"pending_seats"`
	TotalRevenue      int `json:"total_revenue"`
}

type AdminCohortResponse struct {
	Metrics      AdminCohortStats    `json:"metrics"`
	Applications []*CohortApplication `json:"applications"`
}
