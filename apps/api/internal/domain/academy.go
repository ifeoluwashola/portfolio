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

	// Phase 5: Break-It Labs
	GetLabs(ctx context.Context) ([]*BreakItLab, error)
	GetLabByID(ctx context.Context, id int) (*BreakItLab, error)
	CreateLab(ctx context.Context, lab *BreakItLab) error
	UpdateLab(ctx context.Context, lab *BreakItLab) error
	DeleteLab(ctx context.Context, id int) error
	UpsertLabSubmission(ctx context.Context, sub *LabSubmission) error
	GetLabSubmissions(ctx context.Context, labID int) ([]*LabSubmission, error)
	UpdateLabSubmissionWinner(ctx context.Context, subID int, isWinner bool) error
	CreateSubmissionComment(ctx context.Context, comm *SubmissionComment) error
	GetSubmissionComments(ctx context.Context, subID int) ([]*SubmissionComment, error)

	// Phase 6: Alumni Hall of Fame
	CreateAlumniProfile(ctx context.Context, profile *AlumniProfile) (int, error)
	GetAlumniProfiles(ctx context.Context) ([]*AlumniProfile, error)
	GetAlumniBySlug(ctx context.Context, slug string) (*AlumniProfile, error)
	UpdateAlumniProfile(ctx context.Context, profile *AlumniProfile) error
	CreateCapstoneProject(ctx context.Context, project *CapstoneProject) error
	GetCapstoneProjectsByAlumni(ctx context.Context, alumniID int) ([]*CapstoneProject, error)
	DeleteCapstoneProjectsByAlumni(ctx context.Context, alumniID int) error
	GetGraduationEligibleStudents(ctx context.Context) ([]*Student, error)
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

	// Phase 5: Break-It Labs
	ListLabs(ctx context.Context) ([]*BreakItLab, error)
	GetLab(ctx context.Context, id int) (*BreakItLab, error)
	AdminCreateLab(ctx context.Context, lab *BreakItLab) error
	AdminUpdateLab(ctx context.Context, lab *BreakItLab) error
	AdminDeleteLab(ctx context.Context, id int) error
	SubmitLabFix(ctx context.Context, studentID uuid.UUID, req *SubmitLabFixRequest) error
	ListLabSubmissions(ctx context.Context, labID int) ([]*LabSubmission, error)
	AdminSetLabWinner(ctx context.Context, req *SetLabWinnerRequest) error
	AddSubmissionComment(ctx context.Context, studentID uuid.UUID, subID int, body string) error

	// Phase 6: Alumni Hall of Fame
	GraduateStudent(ctx context.Context, req *GraduateStudentRequest) error
	AdminUpdateAlumni(ctx context.Context, id int, req *GraduateStudentRequest) error
	ListAlumni(ctx context.Context) ([]*AlumniProfile, error)
	GetAlumniPortfolio(ctx context.Context, slug string) (*AlumniProfile, error)
	GetEligibleStudents(ctx context.Context) ([]*Student, error)
}

type CourseMaterial struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

type CohortWeek struct {
	ID           int               `json:"id"`
	WeekNumber   int               `json:"week_number"`
	Title        string            `json:"title"`
	Status       string            `json:"status"` // locked, pre-flight, live, archived
	MeetLink     *string           `json:"meet_link"`
	RecordingURL *string           `json:"recording_url"`
	Materials    []CourseMaterial `json:"materials"`
	Transcript   *string           `json:"transcript"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
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
	ID           int              `json:"id"`
	Title        string           `json:"title"`
	Status       string           `json:"status"`
	MeetLink     *string          `json:"meet_link"`
	RecordingURL *string          `json:"recording_url"`
	Materials    []CourseMaterial `json:"materials"`
	Transcript   *string          `json:"transcript"`
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
	Weeks        []*CohortWeek `json:"weeks"`
	Assignments  []*Assignment `json:"assignments"`
	IsFirstLogin bool          `json:"is_first_login"`
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

type BreakItLab struct {
	ID           int              `json:"id"`
	Title        string           `json:"title"`
	Scenario     string           `json:"scenario"`
	BrokenCode   string           `json:"broken_code"`
	SolutionCode string           `json:"solution_code"`
	Status       string           `json:"status"` // active, solved, archived
	Submissions  []*LabSubmission `json:"submissions,omitempty"`
	CreatedAt    time.Time        `json:"created_at"`
}

type LabSubmission struct {
	ID          int                  `json:"id"`
	LabID       int                  `json:"lab_id"`
	StudentID   uuid.UUID            `json:"student_id"`
	StudentName string               `json:"student_name,omitempty"`
	ProposedFix string               `json:"proposed_fix"`
	IsWinner    bool                 `json:"is_winner"`
	Comments    []*SubmissionComment `json:"comments,omitempty"`
	CreatedAt   time.Time            `json:"created_at"`
}

type SubmissionComment struct {
	ID           int       `json:"id"`
	SubmissionID int       `json:"submission_id"`
	StudentID    uuid.UUID `json:"student_id"`
	StudentName  string    `json:"student_name,omitempty"`
	Body         string    `json:"body"`
	CreatedAt    time.Time `json:"created_at"`
}

type SubmitLabFixRequest struct {
	LabID       int    `json:"lab_id"`
	ProposedFix string `json:"proposed_fix"`
}

type SetLabWinnerRequest struct {
	SubmissionID int  `json:"submission_id"`
	IsWinner     bool `json:"is_winner"`
}

type SubmissionCommentRequest struct {
	Body string `json:"body"`
}

// Phase 6: Alumni Hall of Fame
type AlumniProfile struct {
	ID          int                `json:"id"`
	StudentID   uuid.UUID          `json:"student_id"`
	StudentName string             `json:"student_name,omitempty"`
	Slug        string             `json:"slug"`
	CohortName  string             `json:"cohort_name"`
	LinkedInURL string             `json:"linkedin_url"`
	GitHubURL   string             `json:"github_url"`
	Projects    []*CapstoneProject `json:"projects,omitempty"`
	CreatedAt   time.Time          `json:"created_at"`
}

type CapstoneProject struct {
	ID                     int       `json:"id"`
	AlumniID               int       `json:"alumni_id"`
	ProjectTitle           string    `json:"project_title"`
	Description            string    `json:"description"`
	ArchitectureDiagramURL string    `json:"architecture_diagram_url"`
	LiveDemoURL            string    `json:"live_demo_url"`
	RepoURL                string    `json:"repo_url"`
	CreatedAt              time.Time `json:"created_at"`
}

type GraduateStudentRequest struct {
	StudentID   uuid.UUID                 `json:"student_id"`
	CohortName  string                    `json:"cohort_name"`
	LinkedInURL string                    `json:"linkedin_url"`
	GitHubURL   string                    `json:"github_url"`
	Projects    []*CapstoneProjectRequest `json:"projects"`
}

type CapstoneProjectRequest struct {
	ProjectTitle           string `json:"project_title"`
	Description            string `json:"description"`
	ArchitectureDiagramURL string `json:"architecture_diagram_url"`
	LiveDemoURL            string `json:"live_demo_url"`
	RepoURL                string `json:"repo_url"`
}
