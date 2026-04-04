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

	cohortApp := &domain.CohortApplication{
		ID:            appID,
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		Email:         req.Email,
		Phone:         req.Phone,
		CurrentRole:   req.CurrentRole,
		Goal:          req.Goal,
		Reference:     reference,
		PaymentStatus: "Pending",
		CreatedAt:     time.Now(),
	}

	if err := s.repo.CreateApplication(ctx, cohortApp); err != nil {
		return nil, fmt.Errorf("failed to save application: %w", err)
	}

	// Make request to Paystack
	callbackURL := fmt.Sprintf("%s/academy/success", s.config.FrontendURL)
	paystackReqBody := map[string]interface{}{
		"email":        req.Email,
		"amount":       1000000, // 10,000 NGN in kobo
		"reference":    reference,
		"callback_url": callbackURL,
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
	// Verify signature
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

	if event.Event == "charge.success" {
		// Update DB
		err := s.repo.UpdatePaymentStatus(ctx, event.Data.Reference, "Paid")
		if err != nil {
			return fmt.Errorf("failed to update payment status: %w", err)
		}

		// Fetch the user's name from DB reference (if needed for the email)
		app, err := s.repo.GetApplicationByReference(ctx, event.Data.Reference)
		if err != nil {
			// Don't fail the webhook processing itself, but log aggressively
			log.Printf("ERROR: Could not fetch application for ref %s: %v\n", event.Data.Reference, err)
			return nil
		}

		// Auto-provision Student account
		tempPassword, _ := generateTempPassword(8)
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(tempPassword), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("ERROR: Failed to hash temp password: %v\n", err)
		} else {
			student := &domain.Student{
				ID:           app.ID, // Link to Application ID
				FirstName:    app.FirstName,
				LastName:     app.LastName,
				Email:        app.Email,
				PasswordHash: string(hashedPassword),
				IsFirstLogin: true,
				CreatedAt:    time.Now(),
			}
			err = s.repo.CreateStudent(ctx, student)
			if err != nil {
				log.Printf("ERROR: Failed to provision student account: %v\n", err)
			}
		}

		// Send email automation with the newly provisioned auth
		err = s.notification.SendStudentWelcomeEmail(app.FirstName, app.Email, tempPassword)
		if err != nil {
			log.Printf("ERROR: Failed to send welcome email to %s: %v\n", app.Email, err)
		}
	}

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
