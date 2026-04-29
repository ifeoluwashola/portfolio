package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// ─── Billing Domain ────────────────────────────────────────────────────────────

// StudentBilling tracks the installment plan state for a single student.
// All monetary values are in kobo (NGN × 100).
type StudentBilling struct {
	StudentID          uuid.UUID  `json:"student_id"`
	TotalDue           int        `json:"total_due"`
	TotalPaid          int        `json:"total_paid"`
	NextPaymentDueDate *time.Time `json:"next_payment_due_date"`
	BillingStatus      string     `json:"billing_status"` // good_standing | payment_locked | paid_in_full
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

// PaymentHistory is an immutable ledger entry for every successful charge.
type PaymentHistory struct {
	ID          int       `json:"id"`
	StudentID   uuid.UUID `json:"student_id"`
	AmountPaid  int       `json:"amount_paid"`
	Gateway     string    `json:"gateway"`
	ReferenceID string    `json:"reference_id"`
	CreatedAt   time.Time `json:"created_at"`
}

type Student struct {
	ID                     uuid.UUID `json:"id"`
	FirstName              string    `json:"first_name"`
	LastName               string    `json:"last_name"`
	Email                  string    `json:"email"`
	PasswordHash           string    `json:"-"`
	Status                 string    `json:"status"` // active, graduated, disqualified, probation
	WarningCount           int       `json:"warning_count"`
	DisqualificationReason *string   `json:"disqualification_reason,omitempty"`
	IsManuallyLocked       bool      `json:"is_manually_locked"`
	IsFirstLogin           bool      `json:"is_first_login"`
	AttendanceRate         float64   `json:"attendance_rate"` // Percentage of occurred sessions attended
	AttendedCount          int       `json:"attended_count"`
	TotalHeldSessions      int       `json:"total_held_sessions"`
	ResetToken             *string   `json:"-"`
	ResetTokenExpiresAt    *time.Time `json:"-"`
	CreatedAt              time.Time `json:"created_at"`
}

type AcademyRepository interface {
	GetGraduationEligibleStudents(ctx context.Context) ([]*Student, error)
	GetAllStudents(ctx context.Context) ([]*Student, error)
	UpdateStudentStatus(ctx context.Context, id uuid.UUID, status string, reason string) error
	WarnStudent(ctx context.Context, id uuid.UUID, reason string) (int, error)
	GetStudentByID(ctx context.Context, id uuid.UUID) (*Student, error)
	GetStudentByEmail(ctx context.Context, email string) (*Student, error)
	CreateStudent(ctx context.Context, student *Student) error
	UpdateStudentPassword(ctx context.Context, id uuid.UUID, hashedPassword string) error
	SetStudentResetToken(ctx context.Context, email, token string, expiresAt time.Time) error
	GetStudentByResetToken(ctx context.Context, token string) (*Student, error)

	// Cohort Applications
	CreateApplication(ctx context.Context, app *CohortApplication) error
	UpdatePaymentStatus(ctx context.Context, reference, status string) error
	GetApplicationByReference(ctx context.Context, reference string) (*CohortApplication, error)
	GetAdminCohortApplications(ctx context.Context) ([]*CohortApplication, error)

	// Billing & Installments
	CreateStudentBilling(ctx context.Context, studentID uuid.UUID) error
	GetStudentBilling(ctx context.Context, studentID uuid.UUID) (*StudentBilling, error)
	InsertPaymentHistory(ctx context.Context, ph *PaymentHistory) error
	IncrementBillingPaid(ctx context.Context, studentID uuid.UUID, amountKobo int) (int, error)
	SetBillingStatus(ctx context.Context, studentID uuid.UUID, status string) error
	SetNextPaymentDue(ctx context.Context, studentID uuid.UUID, dueDate *time.Time) error
	GetOverdueBillings(ctx context.Context) ([]*StudentBilling, error)
	GetPaymentCount(ctx context.Context, studentID uuid.UUID) (int, error)
	GetStudentPaymentHistory(ctx context.Context, studentID uuid.UUID) ([]*PaymentHistory, error)
	GetBillingsDueIn(ctx context.Context, days int) ([]*StudentBilling, error)
	GetStudentsByIDs(ctx context.Context, ids []uuid.UUID) ([]*Student, error)

	// Alumni & Capstone
	CreateAlumniProfile(ctx context.Context, profile *AlumniProfile) (int, error)
	GetAlumniProfiles(ctx context.Context) ([]*AlumniProfile, error)
	GetAlumniBySlug(ctx context.Context, slug string) (*AlumniProfile, error)
	UpdateAlumniProfile(ctx context.Context, profile *AlumniProfile) error
	DeleteCapstoneProjectsByAlumni(ctx context.Context, alumniID int) error
	GetCapstoneProjectsByAlumni(ctx context.Context, alumniID int) ([]*CapstoneProject, error)

	CreateCapstoneProject(ctx context.Context, project *CapstoneProject) (int, error)
	GetCapstoneByID(ctx context.Context, id int) (*CapstoneProject, error)
	GetCapstoneByStudentID(ctx context.Context, studentID uuid.UUID) (*CapstoneProject, error)
	GetPendingCapstones(ctx context.Context) ([]*CapstoneProject, error)
	UpdateCapstoneStatus(ctx context.Context, id int, status string) error

	// Assignments
	GetWeeks(ctx context.Context) ([]*CohortWeek, error)
	GetWeekByID(ctx context.Context, id int) (*CohortWeek, error)
	UpdateWeek(ctx context.Context, week *CohortWeek) error
	CreateAssignment(ctx context.Context, assignment *Assignment) error
	GetStudentAssignments(ctx context.Context, studentID uuid.UUID) ([]*Assignment, error)
	GetAllAssignments(ctx context.Context) ([]*Assignment, error)
	UpdateAssignmentGrade(ctx context.Context, id uuid.UUID, status, feedback string) error

	// Break-It Labs
	GetLabs(ctx context.Context) ([]*BreakItLab, error)
	GetLabByID(ctx context.Context, id int) (*BreakItLab, error)
	CreateLab(ctx context.Context, lab *BreakItLab) error
	UpdateLab(ctx context.Context, lab *BreakItLab) error
	DeleteLab(ctx context.Context, id int) error
	UpsertLabSubmission(ctx context.Context, sub *LabSubmission) error
	GetLabSubmissions(ctx context.Context, labID int) ([]*LabSubmission, error)
	UpdateLabSubmissionWinner(ctx context.Context, submissionID int, isWinner bool) error

	CreateSubmissionComment(ctx context.Context, comment *SubmissionComment) error
	GetSubmissionComments(ctx context.Context, submissionID int) ([]*SubmissionComment, error)

	// Class Sessions
	CreateClassSession(ctx context.Context, session *ClassSession) error
	UpdateClassSession(ctx context.Context, session *ClassSession) error
	DeleteClassSession(ctx context.Context, id int) error
	GetClassSessionsByWeek(ctx context.Context, weekID int) ([]*ClassSession, error)
	GetClassSessionByID(ctx context.Context, id int) (*ClassSession, error)
	AutoStartScheduledSessions(ctx context.Context) (int64, error)

	// Attendance
	RecordAttendance(ctx context.Context, sessionID int, studentID uuid.UUID) error
	GetStudentAttendance(ctx context.Context, studentID uuid.UUID) ([]*SessionAttendance, error)
	GetSessionAttendance(ctx context.Context, sessionID int) ([]*Student, error)

	// Admin Command Center
	GetBillingOverview(ctx context.Context) (*BillingOverview, error)
	GetAllStudentBillings(ctx context.Context) ([]*AdminStudentBilling, error)
	SetManualLock(ctx context.Context, id uuid.UUID, locked bool) error
}

type AcademyService interface {
	InitializeApplication(ctx context.Context, req *AcademyApplyRequest) (*AcademyApplyResponse, error)
	ProcessWebhook(ctx context.Context, signature string, body []byte) error
	GetAdminApplications(ctx context.Context) (*AdminCohortResponse, error)
	LoginStudent(ctx context.Context, req *AcademyLoginRequest) (*AcademyAuthResponse, error)
	ChangePassword(ctx context.Context, studentID uuid.UUID, req *AcademyChangePasswordRequest) error
	ForgotPassword(ctx context.Context, req *AcademyForgotPasswordRequest) error
	ResetPassword(ctx context.Context, req *AcademyResetPasswordRequest) error

	GetCurriculum(ctx context.Context) ([]*CohortWeek, error)
	UpdateCohortWeek(ctx context.Context, req *UpdateWeekRequest) error
	GetStudentDashboardData(ctx context.Context, studentID uuid.UUID) (*StudentDashboardResponse, error)
	SubmitAssignment(ctx context.Context, studentID uuid.UUID, req *SubmitAssignmentRequest) error
	GetAdminSubmissions(ctx context.Context) ([]*Assignment, error)
	GradeSubmission(ctx context.Context, req *GradeAssignmentRequest) error

	// Break-It Labs
	ListLabs(ctx context.Context) ([]*BreakItLab, error)
	GetLab(ctx context.Context, id int) (*BreakItLab, error)
	AdminCreateLab(ctx context.Context, lab *BreakItLab) error
	AdminUpdateLab(ctx context.Context, lab *BreakItLab) error
	AdminDeleteLab(ctx context.Context, id int) error
	SubmitLabFix(ctx context.Context, studentID uuid.UUID, req *SubmitLabFixRequest) error
	ListLabSubmissions(ctx context.Context, labID int) ([]*LabSubmission, error)
	AdminSetLabWinner(ctx context.Context, req *SetLabWinnerRequest) error

	// Comments
	AddSubmissionComment(ctx context.Context, studentID uuid.UUID, subID int, body string) error

	// Phase 6
	ListAllStudents(ctx context.Context) ([]*Student, error)
	AdminWarnStudent(ctx context.Context, id uuid.UUID, reason string) error
	AdminDisqualifyStudent(ctx context.Context, id uuid.UUID, reason string) error
	ListAlumni(ctx context.Context) ([]*AlumniProfile, error)
	GetAlumniPortfolio(ctx context.Context, slug string) (*AlumniPortfolioResponse, error)
	AdminUpdateAlumni(ctx context.Context, id int, req *GraduateStudentRequest) error
	GetEligibleStudents(ctx context.Context) ([]*Student, error)
	SubmitCapstone(ctx context.Context, studentID uuid.UUID, req *CapstoneProjectRequest) error
	GetPendingCapstones(ctx context.Context) ([]*CapstoneProject, error)
	ApproveCapstone(ctx context.Context, id int, req *ApproveCapstoneRequest) error
	GetStudentSession(ctx context.Context, studentID uuid.UUID) (*StudentSessionResponse, error)

	// Admin Command Center
	GetBillingOverview(ctx context.Context) (*BillingOverview, error)
	GetAllStudentBillings(ctx context.Context) ([]*AdminStudentBilling, error)
	ProcessManualPayment(ctx context.Context, req *ManualPaymentRequest) error
	UpdateStudentStatus(ctx context.Context, id uuid.UUID, req *UpdateStudentStatusRequest) error

	// Billing & Installments
	GetBillingStatus(ctx context.Context, studentID uuid.UUID) (*StudentBilling, error)
	GetBillingHub(ctx context.Context, studentID uuid.UUID) (*BillingHubResponse, error)
	InitializeInstallmentPayment(ctx context.Context, studentID uuid.UUID, amountKobo int) (*AcademyApplyResponse, error)
	RunPaymentLockCron(ctx context.Context)
	RunClassSessionAutomator(ctx context.Context)

	// Class Sessions
	AdminCreateClassSession(ctx context.Context, session *ClassSession) error
	AdminUpdateClassSession(ctx context.Context, session *ClassSession) error
	AdminDeleteClassSession(ctx context.Context, id int) error

	// Attendance Gateway
	JoinSession(ctx context.Context, studentID uuid.UUID, sessionID int) (string, error)
	GetStudentAttendanceHistory(ctx context.Context, studentID uuid.UUID) ([]*AttendanceRecord, error)
	GetSessionAttendance(ctx context.Context, sessionID int) ([]*Student, error)
}

// BillingHubResponse is the aggregate returned by the billing hub endpoint.
// It bundles billing state + full payment ledger in one round-trip.
type BillingHubResponse struct {
	Billing        *StudentBilling  `json:"billing"`
	PaymentHistory []*PaymentHistory `json:"payment_history"`
	PaymentCount   int              `json:"payment_count"`
}

type StudentSessionResponse struct {
	StudentID     uuid.UUID `json:"student_id"`
	Status        string    `json:"status"`
	BillingStatus string    `json:"billing_status,omitempty"`
}

type NotificationService interface {
	SendStudentWelcomeEmail(firstName, email, tempPassword string) error
	SendPasswordResetEmail(email, token string) error
	SendStudentWarningEmail(firstName, email, reason string, warningCount int) error
	SendStudentDisqualificationEmail(firstName, email, reason string) error
	SendAdminInviteEmail(firstName, email, tempPassword string) error
	SendBillingReminderEmail(email string, dueDate time.Time, amountKobo int) error
	SendAccountSuspendedEmail(email string, minAmountKobo int, remainingBalanceKobo int) error
	SendPaymentConfirmationEmail(email string, amountKobo int, remainingKobo int) error
	SendAcademicProbationEmail(firstName, email, reason string) error
}

type AcademyApplyRequest struct {
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	CurrentRole string `json:"current_role"`
	Goal        string `json:"goal"`
	// ExperienceLevel: Absolute Beginner | Basic IT | Intermediate
	ExperienceLevel string `json:"experience_level"`
	HasLaptop       bool   `json:"has_laptop"`
	// PaymentPlan: "full" (250,000) or "installment" (100,000 deposit)
	PaymentPlan string `json:"payment_plan"`
}

// BillingPaymentRequest is used by the billing dashboard to initiate a new payment.
type BillingPaymentRequest struct {
	// AmountNaira is the human-facing amount in Naira; the backend converts to kobo.
	AmountNaira int `json:"amount_naira"`
}

type AcademyApplyResponse struct {
	AuthorizationURL string `json:"authorization_url"`
	Reference        string `json:"reference"`
}

type PaystackInitResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    struct {
		AuthorizationURL string `json:"authorization_url"`
		AccessCode       string `json:"access_code"`
		Reference        string `json:"reference"`
	} `json:"data"`
}

type PaystackWebhookEvent struct {
	Event string `json:"event"`
	Data  struct {
		Reference string            `json:"reference"`
		Amount    int               `json:"amount"`
		Customer  struct {
			Email string `json:"email"`
		} `json:"customer"`
		Metadata PaystackMetadata `json:"metadata"`
	} `json:"data"`
}

type PaystackMetadata struct {
	PaymentType string `json:"payment_type"`
	StudentID   string `json:"student_id,omitempty"`
}

type CohortApplication struct {
	ID              uuid.UUID `json:"id"`
	FirstName       string    `json:"first_name"`
	LastName        string    `json:"last_name"`
	Email           string    `json:"email"`
	Phone           string    `json:"phone"`
	CurrentRole     string    `json:"current_role"`
	Goal            string    `json:"goal"`
	ExperienceLevel string    `json:"experience_level"`
	HasLaptop       bool      `json:"has_laptop"`
	PaymentStatus   string    `json:"payment_status"`
	Reference       string    `json:"reference"`
	CreatedAt       time.Time `json:"created_at"`
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

type AdminCohortStats struct {
	TotalApplications int `json:"total_applications"`
	PaidSeats         int `json:"paid_seats"`
	PendingSeats      int `json:"pending_seats"`
	TotalRevenue      int `json:"total_revenue"`
}

type AdminCohortResponse struct {
	Metrics      AdminCohortStats     `json:"metrics"`
	Applications []*CohortApplication `json:"applications"`
}

type CourseMaterial struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

type ClassSession struct {
	ID               int       `json:"id"`
	CohortWeekID     int       `json:"cohort_week_id"`
	Title            string    `json:"title"`
	Status           string    `json:"status"`            // scheduled, live, archived
	VisibilityStatus string    `json:"visibility_status"` // locked, published
	MeetingURL       string    `json:"meeting_url"`
	ScheduledAt      time.Time `json:"scheduled_at"`
	RecordingURL     string    `json:"recording_url"`
	CreatedAt        time.Time `json:"created_at"`
}

type SessionAttendance struct {
	ID        int       `json:"id"`
	SessionID int       `json:"session_id"`
	StudentID uuid.UUID `json:"student_id"`
	JoinedAt  time.Time `json:"joined_at"`
}

type AttendanceRecord struct {
	SessionTitle string     `json:"session_title"`
	Status       string     `json:"status"`
	ScheduledAt  time.Time  `json:"scheduled_at"`
	Attended     bool       `json:"attended"`
	JoinedAt     *time.Time `json:"joined_at,omitempty"`
}

type CohortWeek struct {
	ID                     int               `json:"id"`
	WeekNumber             int               `json:"week_number"`
	Title                  string            `json:"title"`
	RecordingURL           *string           `json:"recording_url"`
	Materials              []CourseMaterial `json:"materials"`
	Transcript             *string           `json:"transcript"`
	AssignmentInstructions *string           `json:"assignment_instructions"`
	Sessions               []*ClassSession  `json:"sessions"`
	CreatedAt              time.Time         `json:"created_at"`
	UpdatedAt              time.Time         `json:"updated_at"`
}

type Assignment struct {
	ID            uuid.UUID `json:"id"`
	StudentID     uuid.UUID `json:"student_id"`
	StudentName   string    `json:"student_name,omitempty"`
	WeekID        int       `json:"week_id"`
	WeekNumber    int       `json:"week_number,omitempty"`
	GitHubURL     string    `json:"github_url"`
	Status        string    `json:"status"` // pending, passed, failed
	AdminFeedback *string   `json:"admin_feedback"`
	CreatedAt     time.Time `json:"created_at"`
}

type UpdateWeekRequest struct {
	ID                     int              `json:"id"`
	Title                  string           `json:"title"`
	RecordingURL           *string          `json:"recording_url"`
	Materials              []CourseMaterial `json:"materials"`
	Transcript             *string          `json:"transcript"`
	AssignmentInstructions *string          `json:"assignment_instructions"`
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
	IsFirstLogin      bool          `json:"is_first_login"`
	Status            string        `json:"status"`
	AttendedCount     int           `json:"attended_count"`
	TotalHeldSessions int           `json:"total_held_sessions"`
	AttendanceRate    float64       `json:"attendance_rate"`
}

type BreakItLab struct {
	ID           int               `json:"id"`
	Title        string            `json:"title"`
	Description  string            `json:"description"`
	Scenario     string            `json:"scenario"`
	BrokenCode   string            `json:"broken_code"`
	SolutionCode string            `json:"solution_code"`
	Status       string            `json:"status"` // locked, live, archived
	Submissions  []*LabSubmission `json:"submissions,omitempty"`
	CreatedAt    time.Time         `json:"created_at"`
}

type LabSubmission struct {
	ID          int                 `json:"id"`
	LabID       int                 `json:"lab_id"`
	StudentID   uuid.UUID           `json:"student_id"`
	StudentName string              `json:"student_name,omitempty"`
	ProposedFix string              `json:"proposed_fix"`
	IsWinner    bool                `json:"is_winner"`
	Comments    []*SubmissionComment `json:"comments,omitempty"`
	CreatedAt   time.Time           `json:"created_at"`
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

type SubmissionComment struct {
	ID           int       `json:"id"`
	SubmissionID int       `json:"submission_id"`
	StudentID    uuid.UUID `json:"student_id"`
	StudentName  string    `json:"student_name,omitempty"`
	Body         string    `json:"body"`
	CreatedAt    time.Time `json:"created_at"`
}

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
	StudentID              uuid.UUID `json:"student_id"`
	StudentName            string    `json:"student_name,omitempty"`
	ProjectTitle           string    `json:"project_title"`
	Description            string    `json:"description"`
	ArchitectureDiagramURL string    `json:"architecture_diagram_url"`
	LiveDemoURL            string    `json:"live_demo_url"`
	RepoURL                string    `json:"repo_url"`
	Status                 string    `json:"status"` // pending, approved
	CreatedAt              time.Time `json:"created_at"`
}

type GraduateStudentRequest struct {
	CohortName  string                   `json:"cohort_name"`
	LinkedInURL string                   `json:"linkedin_url"`
	GitHubURL   string                   `json:"github_url"`
	Projects    []*CapstoneProjectRequest `json:"projects"`
}

type CapstoneProjectRequest struct {
	ProjectTitle           string `json:"project_title"`
	Description            string `json:"description"`
	ArchitectureDiagramURL string `json:"architecture_diagram_url"`
	LiveDemoURL            string `json:"live_demo_url"`
	RepoURL                string `json:"repo_url"`
}

type ApproveCapstoneRequest struct {
	CohortName  string `json:"cohort_name"`
	LinkedInURL string `json:"linkedin_url"`
	GitHubURL   string `json:"github_url"`
}

type MilestoneData struct {
	Assignments []*Assignment    `json:"assignments"`
	Labs        []*LabSubmission `json:"labs"`
}

type AlumniPortfolioResponse struct {
	Profile    *AlumniProfile `json:"profile"`
	Milestones *MilestoneData `json:"milestones"`
}

type WarnStudentRequest struct {
	Reason string `json:"reason"`
}

type DisqualifyRequest struct {
	Reason string `json:"reason"`
}

type DisqualifyStudentRequest struct {
	Reason string `json:"reason"`
}
// ─── Admin Command Center Types ───────────────────────────────────────────────

type BillingOverview struct {
	TotalRevenue       int `json:"total_revenue"`        // Total collected
	PendingReceivables int `json:"pending_receivables"` // Expected from active plans
	OverdueAccounts    int `json:"overdue_accounts"`    // Count of locked students
}

type AdminStudentBilling struct {
	ID                 uuid.UUID  `json:"id"`
	FirstName          string     `json:"first_name"`
	LastName           string     `json:"last_name"`
	Email              string     `json:"email"`
	TotalPaid          int        `json:"total_paid"`
	RemainingBalance   int        `json:"remaining_balance"`
	NextPaymentDueDate *time.Time `json:"next_payment_due_date"`
	BillingStatus      string     `json:"billing_status"`
	AcademicStatus     string     `json:"academic_status"`
	IsManuallyLocked   bool       `json:"is_manually_locked"`
}

type ManualPaymentRequest struct {
	StudentID uuid.UUID `json:"student_id"`
	Amount    int       `json:"amount"` // in kobo
	Note      string    `json:"note"`
}

type UpdateStudentStatusRequest struct {
	AcademicStatus   string `json:"academic_status"`     // active, graduated, disqualified, probation
	IsManuallyLocked bool   `json:"is_manually_locked"`
}
