package service

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/config"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/notifications"
	"github.com/google/uuid"
)

type academyService struct {
	repo         domain.AcademyRepository
	config       *config.Config
	notification *notifications.ResendNotifier
}

func NewAcademyService(repo domain.AcademyRepository, cfg *config.Config, notification *notifications.ResendNotifier) domain.AcademyService {
	return &academyService{
		repo:         repo,
		config:       cfg,
		notification: notification,
	}
}

func (s *academyService) InitializeApplication(ctx context.Context, req *domain.AcademyApplyRequest) (*domain.AcademyApplyResponse, error) {
	if s.config.PaystackSecretKey == "" {
		return nil, errors.New("payment integration not configured")
	}

	appID := uuid.New()
	reference := uuid.New().String()

	// Determine charge amount based on payment plan.
	// Defaults to full payment (₦250,000) if not specified.
	var amountKobo int
	switch req.PaymentPlan {
	case "installment":
		amountKobo = 10_000_000 // ₦100,000 deposit
	default:
		amountKobo = 25_000_000 // ₦250,000 full payment
	}

	cohortApp := &domain.CohortApplication{
		ID:              appID,
		FirstName:       req.FirstName,
		LastName:        req.LastName,
		Email:           req.Email,
		Phone:           req.Phone,
		CurrentRole:     req.CurrentRole,
		Goal:            req.Goal,
		ExperienceLevel: req.ExperienceLevel,
		HasLaptop:       req.HasLaptop,
		Reference:       reference,
		PaymentStatus:   "Pending",
		CreatedAt:       time.Now(),
	}

	if err := s.repo.CreateApplication(ctx, cohortApp); err != nil {
		return nil, fmt.Errorf("failed to save application: %w", err)
	}

	// Make request to Paystack
	callbackURL := fmt.Sprintf("%s/academy/success", s.config.FrontendURL)
	paystackReqBody := map[string]interface{}{
		"email":        req.Email,
		"amount":       amountKobo,
		"reference":    reference,
		"callback_url": callbackURL,
		"metadata": map[string]string{
			"payment_type": "initial_registration",
		},
	}

	bodyBytes, err := json.Marshal(paystackReqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal paystack payload: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", "https://api.paystack.co/transaction/initialize", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Authorization", "Bearer "+s.config.PaystackSecretKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to communicate with Paystack: %w", err)
	}
	defer resp.Body.Close()

	var paystackResp domain.PaystackInitResponse
	if err := json.NewDecoder(resp.Body).Decode(&paystackResp); err != nil {
		return nil, fmt.Errorf("failed to decode response from paystack: %w", err)
	}

	if !paystackResp.Status {
		return nil, fmt.Errorf("paystack initialization failed: %s", paystackResp.Message)
	}

	return &domain.AcademyApplyResponse{
		AuthorizationURL: paystackResp.Data.AuthorizationURL,
		Reference:        paystackResp.Data.Reference,
	}, nil
}

func (s *academyService) ProcessWebhook(ctx context.Context, signature string, body []byte) error {
	// 1. Verify HMAC-SHA512 signature
	hasher := hmac.New(sha512.New, []byte(s.config.PaystackSecretKey))
	hasher.Write(body)
	expectedSignature := hex.EncodeToString(hasher.Sum(nil))

	if signature != expectedSignature {
		log.Println("Paystack webhook signature mismatch")
		return errors.New("invalid webhook signature")
	}

	var event domain.PaystackWebhookEvent
	if err := json.Unmarshal(body, &event); err != nil {
		return fmt.Errorf("failed to parse webhook body: %w", err)
	}

	log.Printf("Received Paystack webhook event: %s for reference: %s\n", event.Event, event.Data.Reference)

	if event.Event != "charge.success" {
		return nil
	}

	// 2. Determine payment context from Metadata (Primary Path)
	var targetStudentID uuid.UUID
	var isProvisioningRequired bool
	var studentEmail string
	var firstName string

	metadata := event.Data.Metadata
	if metadata.PaymentType == "installment" && metadata.StudentID != "" {
		parsedID, err := uuid.Parse(metadata.StudentID)
		if err == nil {
			targetStudentID = parsedID
			// Fetch student to get email for history/logs
			student, _ := s.repo.GetStudentByID(ctx, targetStudentID)
			if student != nil {
				studentEmail = student.Email
				firstName = student.FirstName
			}
		}
	}

	// 3. Fallback to Cohort Application check (Legacy/Initial Path)
	if targetStudentID == uuid.Nil {
		app, err := s.repo.GetApplicationByReference(ctx, event.Data.Reference)
		if err == nil {
			// Found an application — this is a registration
			targetStudentID = app.ID
			studentEmail = app.Email
			firstName = app.FirstName
			
			// Update the application record itself
			_ = s.repo.UpdatePaymentStatus(ctx, event.Data.Reference, "Paid")
			
			// Check if we need to provision a new account
			_, studentErr := s.repo.GetStudentByEmail(ctx, studentEmail)
			if studentErr != nil {
				isProvisioningRequired = true
			}
		} else {
			log.Printf("ERROR: Unidentified transaction ref %s (No application found and no student_id in metadata)\n", event.Data.Reference)
			return nil
		}
	}

	// 4. Provision Student Account if required (Registration Phase)
	if isProvisioningRequired {
		tempPassword, _ := generateTempPassword(8)
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(tempPassword), bcrypt.DefaultCost)
		if err == nil {
			student := &domain.Student{
				ID:           targetStudentID,
				FirstName:    firstName,
				LastName:     "Student", // Default if not from app
				Email:        studentEmail,
				PasswordHash: string(hashedPassword),
				IsFirstLogin: true,
				CreatedAt:    time.Now(),
			}
			if err = s.repo.CreateStudent(ctx, student); err == nil {
				_ = s.repo.CreateStudentBilling(ctx, student.ID)
				_ = s.notification.SendStudentWelcomeEmail(firstName, studentEmail, tempPassword)
			}
		}
	}

	// 5. Record the payment in the immutable ledger
	ph := &domain.PaymentHistory{
		StudentID:   targetStudentID,
		AmountPaid:  event.Data.Amount,
		Gateway:     "paystack",
		ReferenceID: event.Data.Reference,
	}
	_ = s.repo.InsertPaymentHistory(ctx, ph)

	// 6. Update billing totals
	newTotal, err := s.repo.IncrementBillingPaid(ctx, targetStudentID, event.Data.Amount)
	if err != nil {
		log.Printf("ERROR: Failed to increment billing for student %s: %v\n", targetStudentID, err)
		return nil
	}

	const totalDueKobo = 25_000_000 // ₦250,000
	if newTotal >= totalDueKobo {
		_ = s.repo.SetBillingStatus(ctx, targetStudentID, "paid_in_full")
		_ = s.repo.SetNextPaymentDue(ctx, targetStudentID, nil)
		log.Printf("[Webhook] Student %s fully paid (ref: %s)\n", targetStudentID, event.Data.Reference)
	} else {
		nextDue := time.Now().Add(30 * 24 * time.Hour)
		_ = s.repo.SetNextPaymentDue(ctx, targetStudentID, &nextDue)
		_ = s.repo.SetBillingStatus(ctx, targetStudentID, "good_standing")
		log.Printf("[Webhook] Student %s paid %d kobo. Next due: %s\n", targetStudentID, event.Data.Amount, nextDue.Format(time.RFC3339))
	}

	// 7. Trigger Confirmation Email (Fire and forget)
	remaining := totalDueKobo - newTotal
	_ = s.notification.SendPaymentConfirmationEmail(studentEmail, event.Data.Amount, remaining)

	return nil
}

// generateTempPassword is defined in auth_service.go (shared across the service package)

func (s *academyService) LoginStudent(ctx context.Context, req *domain.AcademyLoginRequest) (*domain.AcademyAuthResponse, error) {
	student, err := s.repo.GetStudentByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(student.PasswordHash), []byte(req.Password))
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":            student.ID,
		"email":          student.Email,
		"is_first_login": student.IsFirstLogin,
		"status":         student.Status,
		"type":           "student",
		"exp":            time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat":            time.Now().Unix(),
	})

	tokenString, err := token.SignedString([]byte(s.config.JWTSecret))
	if err != nil {
		return nil, fmt.Errorf("failed to sign token: %w", err)
	}

	return &domain.AcademyAuthResponse{
		Token:        tokenString,
		IsFirstLogin: student.IsFirstLogin,
	}, nil
}

func (s *academyService) ChangePassword(ctx context.Context, studentID uuid.UUID, req *domain.AcademyChangePasswordRequest) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	return s.repo.UpdateStudentPassword(ctx, studentID, string(hashedPassword))
}

func (s *academyService) ForgotPassword(ctx context.Context, req *domain.AcademyForgotPasswordRequest) error {
	student, err := s.repo.GetStudentByEmail(ctx, req.Email)
	if err != nil {
		// Log but don't error to prevent email enumeration
		log.Printf("Forgot password requested for unknown email: %s\n", req.Email)
		return nil
	}

	token := uuid.New().String()
	expiresAt := time.Now().Add(1 * time.Hour)

	err = s.repo.SetStudentResetToken(ctx, student.Email, token, expiresAt)
	if err != nil {
		return fmt.Errorf("failed to save reset token: %w", err)
	}

	// Send Reset Email
	err = s.notification.SendPasswordResetEmail(student.Email, token)
	if err != nil {
		log.Printf("ERROR: Failed to send password reset email to %s: %v\n", student.Email, err)
		return fmt.Errorf("failed to send recovery email")
	}

	log.Printf("Password reset token for %s: %s\n", student.Email, token)

	return nil
}

func (s *academyService) ResetPassword(ctx context.Context, req *domain.AcademyResetPasswordRequest) error {
	student, err := s.repo.GetStudentByResetToken(ctx, req.Token)
	if err != nil {
		return errors.New("invalid or expired reset token")
	}

	if student.ResetTokenExpiresAt == nil || time.Now().After(*student.ResetTokenExpiresAt) {
		return errors.New("reset token has expired")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	return s.repo.UpdateStudentPassword(ctx, student.ID, string(hashedPassword))
}

func (s *academyService) GetAdminApplications(ctx context.Context) (*domain.AdminCohortResponse, error) {
	apps, err := s.repo.GetAdminCohortApplications(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch applications: %w", err)
	}

	var paidSeats int
	var pendingSeats int

	for _, app := range apps {
		if app.PaymentStatus == "Paid" {
			paidSeats++
		} else {
			pendingSeats++
		}
	}

	return &domain.AdminCohortResponse{
		Metrics: domain.AdminCohortStats{
			TotalApplications: len(apps),
			PaidSeats:         paidSeats,
			PendingSeats:      pendingSeats,
			TotalRevenue:      paidSeats * 10000,
		},
		Applications: apps,
	}, nil
}

func (s *academyService) GetCurriculum(ctx context.Context) ([]*domain.CohortWeek, error) {
	return s.repo.GetWeeks(ctx)
}

func (s *academyService) UpdateCohortWeek(ctx context.Context, req *domain.UpdateWeekRequest) error {
	week, err := s.repo.GetWeekByID(ctx, req.ID)
	if err != nil {
		return fmt.Errorf("week not found: %w", err)
	}

	week.Title = req.Title
	week.Status = req.Status
	week.MeetLink = req.MeetLink
	week.RecordingURL = req.RecordingURL
	week.Materials = req.Materials
	week.Transcript = req.Transcript
	week.AssignmentInstructions = req.AssignmentInstructions

	return s.repo.UpdateWeek(ctx, week)
}

func (s *academyService) SubmitAssignment(ctx context.Context, studentID uuid.UUID, req *domain.SubmitAssignmentRequest) error {
	// First verify the week status is 'archived' (only then we accept submissions)
	week, err := s.repo.GetWeekByID(ctx, req.WeekID)
	if err != nil {
		return fmt.Errorf("invalid week: %w", err)
	}

	if week.Status != "archived" {
		return errors.New("assignments can only be submitted for archived/completed modules")
	}

	ass := &domain.Assignment{
		StudentID: studentID,
		WeekID:    req.WeekID,
		GitHubURL: req.GitHubURL,
	}

	return s.repo.CreateAssignment(ctx, ass)
}

func (s *academyService) GetStudentDashboardData(ctx context.Context, studentID uuid.UUID) (*domain.StudentDashboardResponse, error) {
	weeks, err := s.repo.GetWeeks(ctx)
	if err != nil {
		return nil, err
	}

	student, err := s.repo.GetStudentByID(ctx, studentID)
	if err != nil {
		return nil, err
	}

	asses, err := s.repo.GetStudentAssignments(ctx, studentID)
	if err != nil {
		return nil, err
	}

	return &domain.StudentDashboardResponse{
		Weeks:        weeks,
		Assignments:  asses,
		IsFirstLogin: student.IsFirstLogin,
		Status:       student.Status,
	}, nil
}

func (s *academyService) GetAdminSubmissions(ctx context.Context) ([]*domain.Assignment, error) {
	return s.repo.GetAllAssignments(ctx)
}

func (s *academyService) GradeSubmission(ctx context.Context, req *domain.GradeAssignmentRequest) error {
	return s.repo.UpdateAssignmentGrade(ctx, req.AssignmentID, req.Status, req.Feedback)
}

// Phase 5: Break-It Labs

func (s *academyService) ListLabs(ctx context.Context) ([]*domain.BreakItLab, error) {
	return s.repo.GetLabs(ctx)
}

func (s *academyService) GetLab(ctx context.Context, id int) (*domain.BreakItLab, error) {
	lab, err := s.repo.GetLabByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Fetch submissions and comments for the public/thread view
	subs, err := s.repo.GetLabSubmissions(ctx, id)
	if err == nil {
		for _, sub := range subs {
			comments, _ := s.repo.GetSubmissionComments(ctx, sub.ID)
			sub.Comments = comments
		}
		lab.Submissions = subs
	}

	return lab, nil
}

func (s *academyService) AdminCreateLab(ctx context.Context, lab *domain.BreakItLab) error {
	return s.repo.CreateLab(ctx, lab)
}

func (s *academyService) AdminUpdateLab(ctx context.Context, lab *domain.BreakItLab) error {
	return s.repo.UpdateLab(ctx, lab)
}

func (s *academyService) AdminDeleteLab(ctx context.Context, id int) error {
	return s.repo.DeleteLab(ctx, id)
}

func (s *academyService) SubmitLabFix(ctx context.Context, studentID uuid.UUID, req *domain.SubmitLabFixRequest) error {
	sub := &domain.LabSubmission{
		LabID:       req.LabID,
		StudentID:   studentID,
		ProposedFix: req.ProposedFix,
	}
	return s.repo.UpsertLabSubmission(ctx, sub)
}

func (s *academyService) ListLabSubmissions(ctx context.Context, labID int) ([]*domain.LabSubmission, error) {
	return s.repo.GetLabSubmissions(ctx, labID)
}

func (s *academyService) AdminSetLabWinner(ctx context.Context, req *domain.SetLabWinnerRequest) error {
	return s.repo.UpdateLabSubmissionWinner(ctx, req.SubmissionID, req.IsWinner)
}

func (s *academyService) AddSubmissionComment(ctx context.Context, studentID uuid.UUID, subID int, body string) error {
	comm := &domain.SubmissionComment{
		SubmissionID: subID,
		StudentID:    studentID,
		Body:         body,
	}
	return s.repo.CreateSubmissionComment(ctx, comm)
}

// Phase 6: Alumni Hall of Fame & Disciplinary

func (s *academyService) ListAllStudents(ctx context.Context) ([]*domain.Student, error) {
	return s.repo.GetAllStudents(ctx)
}

func (s *academyService) AdminWarnStudent(ctx context.Context, id uuid.UUID, reason string) error {
	student, err := s.repo.GetStudentByID(ctx, id)
	if err != nil {
		return err
	}

	newCount, err := s.repo.WarnStudent(ctx, id, reason)
	if err != nil {
		return err
	}

	// Trigger Email (Craft template)
	_ = s.notification.SendStudentWarningEmail(student.FirstName, student.Email, reason, newCount)

	return nil
}

func (s *academyService) AdminDisqualifyStudent(ctx context.Context, id uuid.UUID, reason string) error {
	student, err := s.repo.GetStudentByID(ctx, id)
	if err != nil {
		return err
	}

	err = s.repo.UpdateStudentStatus(ctx, id, "disqualified", reason)
	if err != nil {
		return err
	}

	// Trigger Email
	_ = s.notification.SendStudentDisqualificationEmail(student.FirstName, student.Email, reason)

	return nil
}

func (s *academyService) SubmitCapstone(ctx context.Context, studentID uuid.UUID, req *domain.CapstoneProjectRequest) error {
	project := &domain.CapstoneProject{
		StudentID:              studentID,
		ProjectTitle:           req.ProjectTitle,
		Description:            req.Description,
		ArchitectureDiagramURL: req.ArchitectureDiagramURL,
		LiveDemoURL:            req.LiveDemoURL,
		RepoURL:                req.RepoURL,
		Status:                 "pending",
	}
	_, err := s.repo.CreateCapstoneProject(ctx, project)
	return err
}

func (s *academyService) GetPendingCapstones(ctx context.Context) ([]*domain.CapstoneProject, error) {
	return s.repo.GetPendingCapstones(ctx)
}

func (s *academyService) ApproveCapstone(ctx context.Context, capstoneID int, req *domain.ApproveCapstoneRequest) error {
	// 1. Get Capstone
	capstone, err := s.repo.GetCapstoneByID(ctx, capstoneID)
	if err != nil {
		return err
	}

	// 2. Get Student
	student, err := s.repo.GetStudentByID(ctx, capstone.StudentID)
	if err != nil {
		return err
	}

	// 3. Update Capstone Status
	err = s.repo.UpdateCapstoneStatus(ctx, capstoneID, "approved")
	if err != nil {
		return err
	}

	// 4. Update Student Status to 'graduated'
	err = s.repo.UpdateStudentStatus(ctx, student.ID, "graduated", "")
	if err != nil {
		return err
	}

	// 5. Create Alumni Profile
	slug := generateSlug(fmt.Sprintf("%s %s", student.FirstName, student.LastName))
	profile := &domain.AlumniProfile{
		StudentID:   student.ID,
		Slug:        slug,
		CohortName:  req.CohortName,
		LinkedInURL: req.LinkedInURL,
		GitHubURL:   req.GitHubURL,
	}

	_, err = s.repo.CreateAlumniProfile(ctx, profile)
	return err
}

func (s *academyService) AdminUpdateAlumni(ctx context.Context, id int, req *domain.GraduateStudentRequest) error {
	// 1. Update Profile
	profile := &domain.AlumniProfile{
		ID:          id,
		CohortName:  req.CohortName,
		LinkedInURL: req.LinkedInURL,
		GitHubURL:   req.GitHubURL,
	}

	if err := s.repo.UpdateAlumniProfile(ctx, profile); err != nil {
		return fmt.Errorf("failed to update alumni profile: %w", err)
	}

	// 2. Refresh Projects (Delete and Re-insert)
	if err := s.repo.DeleteCapstoneProjectsByAlumni(ctx, id); err != nil {
		return fmt.Errorf("failed to clear old projects: %w", err)
	}

	// We need the student_id to re-insert
	alumni, _ := s.repo.GetAlumniProfiles(ctx)
	var studentID uuid.UUID
	for _, a := range alumni {
		if a.ID == id {
			studentID = a.StudentID
			break
		}
	}

	for _, pReq := range req.Projects {
		project := &domain.CapstoneProject{
			StudentID:              studentID,
			ProjectTitle:           pReq.ProjectTitle,
			Description:            pReq.Description,
			ArchitectureDiagramURL: pReq.ArchitectureDiagramURL,
			LiveDemoURL:            pReq.LiveDemoURL,
			RepoURL:                pReq.RepoURL,
			Status:                 "approved",
		}
		if _, err := s.repo.CreateCapstoneProject(ctx, project); err != nil {
			log.Printf("Warning: failed to create capstone project %s during update: %v\n", project.ProjectTitle, err)
		}
	}

	return nil
}

func (s *academyService) ListAlumni(ctx context.Context) ([]*domain.AlumniProfile, error) {
	profiles, err := s.repo.GetAlumniProfiles(ctx)
	if err != nil {
		return nil, err
	}

	for i := range profiles {
		projects, err := s.repo.GetCapstoneProjectsByAlumni(ctx, profiles[i].ID)
		if err != nil {
			log.Printf("Warning: failed to fetch projects for alumni %d: %v", profiles[i].ID, err)
			continue
		}
		profiles[i].Projects = projects
	}

	return profiles, nil
}

func (s *academyService) GetAlumniPortfolio(ctx context.Context, slug string) (*domain.AlumniPortfolioResponse, error) {
	profile, err := s.repo.GetAlumniBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	projects, err := s.repo.GetCapstoneProjectsByAlumni(ctx, profile.ID)
	if err == nil {
		profile.Projects = projects
	}

	// Fetch Milestones
	assignments, _ := s.repo.GetStudentAssignments(ctx, profile.StudentID)
	
	// Fetch solved labs (Break-It)
	allLabs, _ := s.repo.GetLabs(ctx)
	var solvedLabs []*domain.LabSubmission
	for _, lab := range allLabs {
		subs, _ := s.repo.GetLabSubmissions(ctx, lab.ID)
		for _, sub := range subs {
			if sub.StudentID == profile.StudentID && sub.IsWinner {
				sub.StudentName = lab.Title // Reuse field for lab title context
				solvedLabs = append(solvedLabs, sub)
			}
		}
	}

	return &domain.AlumniPortfolioResponse{
		Profile: profile,
		Milestones: &domain.MilestoneData{
			Assignments: assignments,
			Labs:        solvedLabs,
		},
	}, nil
}

func (s *academyService) GetEligibleStudents(ctx context.Context) ([]*domain.Student, error) {
	return s.repo.GetGraduationEligibleStudents(ctx)
}

func (s *academyService) GetStudentSession(ctx context.Context, studentID uuid.UUID) (*domain.StudentSessionResponse, error) {
	student, err := s.repo.GetStudentByID(ctx, studentID)
	if err != nil {
		return nil, err
	}

	session := &domain.StudentSessionResponse{
		StudentID: student.ID,
		Status:    student.Status,
	}

	// Best-effort: attach billing_status (non-fatal if billing record absent)
	if billing, berr := s.repo.GetStudentBilling(ctx, studentID); berr == nil {
		session.BillingStatus = billing.BillingStatus
	}

	return session, nil
}

func generateSlug(name string) string {
	// Simple slug generator: lowercase and hyphens
	res := bytes.NewBufferString("")
	for _, r := range name {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			res.WriteRune(r)
		} else if r >= 'A' && r <= 'Z' {
			res.WriteRune(r + ('a' - 'A'))
		} else if r == ' ' || r == '-' {
			res.WriteRune('-')
		}
	}
	// Add unique suffix to be safe
	return fmt.Sprintf("%s-%d", res.String(), time.Now().Unix()%10000)
}

// ─── Billing & Installments ──────────────────────────────────────────────────

// GetBillingStatus returns the current billing record for a student.
func (s *academyService) GetBillingStatus(ctx context.Context, studentID uuid.UUID) (*domain.StudentBilling, error) {
	billing, err := s.repo.GetStudentBilling(ctx, studentID)
	if err != nil {
		return nil, fmt.Errorf("billing record not found: %w", err)
	}
	return billing, nil
}

// GetBillingHub returns a single aggregate response with billing state,
// full payment history, and payment count — used by the Billing Hub page.
func (s *academyService) GetBillingHub(ctx context.Context, studentID uuid.UUID) (*domain.BillingHubResponse, error) {
	billing, err := s.repo.GetStudentBilling(ctx, studentID)
	if err != nil {
		return nil, fmt.Errorf("billing record not found: %w", err)
	}

	history, err := s.repo.GetStudentPaymentHistory(ctx, studentID)
	if err != nil {
		log.Printf("WARN: Failed to fetch payment history for student %s: %v\n", studentID, err)
		history = []*domain.PaymentHistory{}
	}

	count, _ := s.repo.GetPaymentCount(ctx, studentID)

	return &domain.BillingHubResponse{
		Billing:        billing,
		PaymentHistory: history,
		PaymentCount:   count,
	}, nil
}


// InitializeInstallmentPayment creates a new Paystack transaction for a logged-in
// student making an installment payment from the billing dashboard.
func (s *academyService) InitializeInstallmentPayment(ctx context.Context, studentID uuid.UUID, amountKobo int) (*domain.AcademyApplyResponse, error) {
	if s.config.PaystackSecretKey == "" {
		return nil, errors.New("payment integration not configured")
	}

	student, err := s.repo.GetStudentByID(ctx, studentID)
	if err != nil {
		return nil, fmt.Errorf("student not found: %w", err)
	}

	reference := uuid.New().String()
	callbackURL := fmt.Sprintf("%s/academy/dashboard/billing", s.config.FrontendURL)

	paystackReqBody := map[string]interface{}{
		"email":        student.Email,
		"amount":       amountKobo,
		"reference":    reference,
		"callback_url": callbackURL,
		"metadata": map[string]string{
			"payment_type": "installment",
			"student_id":   studentID.String(),
		},
	}

	bodyBytes, err := json.Marshal(paystackReqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal paystack payload: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", "https://api.paystack.co/transaction/initialize", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Authorization", "Bearer "+s.config.PaystackSecretKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to communicate with Paystack: %w", err)
	}
	defer resp.Body.Close()

	var paystackResp domain.PaystackInitResponse
	if err := json.NewDecoder(resp.Body).Decode(&paystackResp); err != nil {
		return nil, fmt.Errorf("failed to decode paystack response: %w", err)
	}

	if !paystackResp.Status {
		return nil, fmt.Errorf("paystack initialization failed: %s", paystackResp.Message)
	}

	return &domain.AcademyApplyResponse{
		AuthorizationURL: paystackResp.Data.AuthorizationURL,
		Reference:        paystackResp.Data.Reference,
	}, nil
}

// RunPaymentLockCron runs as a background goroutine. Every 24 hours it checks
// for overdue installment payments and locks the student's portal access.
func (s *academyService) RunPaymentLockCron(ctx context.Context) {
	log.Println("[Cron] Payment lock worker started — running every 24 hours")
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	// Run immediately on start as well
	s.runLockPass(ctx)
	s.runBillingReminderPass(ctx)

	for {
		select {
		case <-ticker.C:
			s.runLockPass(ctx)
			s.runBillingReminderPass(ctx)
		case <-ctx.Done():
			log.Println("[Cron] Payment lock worker shutting down")
			return
		}
	}
}

func (s *academyService) runLockPass(ctx context.Context) {
	overdue, err := s.repo.GetOverdueBillings(ctx)
	if err != nil {
		log.Printf("[Cron] Failed to query overdue billings: %v\n", err)
		return
	}
	if len(overdue) == 0 {
		return
	}

	for _, b := range overdue {
		if lockErr := s.repo.SetBillingStatus(ctx, b.StudentID, "payment_locked"); lockErr != nil {
			log.Printf("[Cron] Failed to lock student %s: %v\n", b.StudentID, lockErr)
			continue
		}

		log.Printf("[Cron] Locked student %s (overdue since %v)\n", b.StudentID, b.NextPaymentDueDate)

		// Send Critical suspension email
		student, err := s.repo.GetStudentByID(ctx, b.StudentID)
		if err != nil {
			log.Printf("[Cron] Failed to fetch student %s for suspension email: %v\n", b.StudentID, err)
			continue
		}

		remaining := b.TotalDue - b.TotalPaid
		minToUnlock := 7500000 // ₦75,000 standard
		if remaining < minToUnlock {
			minToUnlock = remaining
		}

		if err := s.notification.SendAccountSuspendedEmail(student.Email, minToUnlock, remaining); err != nil {
			log.Printf("[Cron] Failed to send suspension email to %s: %v\n", student.Email, err)
		}
	}
}

func (s *academyService) runBillingReminderPass(ctx context.Context) {
	// Find students due in exactly 3 days
	dueIn3, err := s.repo.GetBillingsDueIn(ctx, 3)
	if err != nil {
		log.Printf("[Cron] Failed to query billings due in 3 days: %v\n", err)
		return
	}

	for _, b := range dueIn3 {
		student, err := s.repo.GetStudentByID(ctx, b.StudentID)
		if err != nil {
			log.Printf("[Cron] Failed to fetch student %s for reminder email: %v\n", b.StudentID, err)
			continue
		}

		amountDue := 7500000 // ₦75,000 standard
		remaining := b.TotalDue - b.TotalPaid
		if remaining < amountDue {
			amountDue = remaining
		}

		if err := s.notification.SendBillingReminderEmail(student.Email, *b.NextPaymentDueDate, amountDue); err != nil {
			log.Printf("[Cron] Failed to send billing reminder to %s: %v\n", student.Email, err)
		} else {
			log.Printf("[Cron] Sent billing reminder to %s (due %v)\n", student.Email, *b.NextPaymentDueDate)
		}
	}
}
