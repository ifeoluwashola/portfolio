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
	"os"
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
		tempPassword := generateTempPassword(8)
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

func generateTempPassword(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}

func (s *academyService) LoginStudent(ctx context.Context, req *domain.AcademyLoginRequest) (*domain.AcademyAuthResponse, error) {
	student, err := s.repo.GetStudentByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(student.PasswordHash), []byte(req.Password))
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "default_unsafe_secret_for_dev_only"
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":            student.ID,
		"email":          student.Email,
		"is_first_login": student.IsFirstLogin,
		"exp":            time.Now().Add(7 * 24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString([]byte(secret))
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

	// TODO: Send Reset Email
	log.Printf("Password reset token for %s: %s\n", req.Email, token)

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

	asses, err := s.repo.GetStudentAssignments(ctx, studentID)
	if err != nil {
		return nil, err
	}

	return &domain.StudentDashboardResponse{
		Weeks:       weeks,
		Assignments: asses,
	}, nil
}

func (s *academyService) GetAdminSubmissions(ctx context.Context) ([]*domain.Assignment, error) {
	return s.repo.GetAllAssignments(ctx)
}

func (s *academyService) GradeSubmission(ctx context.Context, req *domain.GradeAssignmentRequest) error {
	return s.repo.UpdateAssignmentGrade(ctx, req.AssignmentID, req.Status, req.Feedback)
}
