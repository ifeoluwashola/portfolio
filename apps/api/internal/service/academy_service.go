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
	"regexp"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/cache"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/config"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/notifications"
	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type academyService struct {
	repo         domain.AcademyRepository
	refreshRepo  domain.RefreshTokenRepository
	config       *config.Config
	tokenCache   cache.TokenCache
	notification *notifications.ResendNotifier
	notifSystem  NotificationSystem
}

func NewAcademyService(repo domain.AcademyRepository, refreshRepo domain.RefreshTokenRepository, cfg *config.Config, tokenCache cache.TokenCache, notification *notifications.ResendNotifier) domain.AcademyService {
	return &academyService{
		repo:         repo,
		refreshRepo:  refreshRepo,
		config:       cfg,
		tokenCache:   tokenCache,
		notification: notification,
		notifSystem:  NewNotificationSystem(repo),
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
		// cohort_start_date constraint: Installment clock should not start before the cohort begins.
		// Set cohort start date (June 1, 2026)
		cohortStartDate := time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC)
		
		var nextDue time.Time
		if time.Now().Before(cohortStartDate) {
			// Student paid early, clock starts from cohort start date
			nextDue = cohortStartDate.Add(30 * 24 * time.Hour)
		} else {
			// Cohort has already started, clock starts from current timestamp
			nextDue = time.Now().Add(30 * 24 * time.Hour)
		}

		_ = s.repo.SetNextPaymentDue(ctx, targetStudentID, &nextDue)
		_ = s.repo.SetBillingStatus(ctx, targetStudentID, "good_standing")
		log.Printf("[Webhook] Student %s paid %d kobo. Next due: %s\n", targetStudentID, event.Data.Amount, nextDue.Format(time.RFC3339))
	}

	// 7. Trigger Confirmation Email (Fire and forget)
	remaining := totalDueKobo - newTotal
	_ = s.notification.SendPaymentConfirmationEmail(studentEmail, event.Data.Amount, remaining)

	return nil
}

func (s *academyService) RevokeRefreshTokens(ctx context.Context, refreshToken string) error {
	hash := hashToken(refreshToken)
	rt, err := s.refreshRepo.GetRefreshTokenByHash(ctx, hash)
	if err != nil {
		return nil // already gone or invalid
	}
	return s.refreshRepo.RevokeRefreshTokenFamily(ctx, rt.FamilyID)
}

func (s *academyService) GrantScholarship(ctx context.Context, applicationID uuid.UUID, amountKobo int) error {
	app, err := s.repo.GetApplicationByID(ctx, applicationID)
	if err != nil {
		return fmt.Errorf("failed to fetch application: %w", err)
	}

	var targetStudentID uuid.UUID
	var isProvisioningRequired bool
	var studentEmail = app.Email
	var firstName = app.FirstName

	// Check if student exists
	student, err := s.repo.GetStudentByEmail(ctx, studentEmail)
	if err != nil {
		isProvisioningRequired = true
		targetStudentID = app.ID
	} else {
		targetStudentID = student.ID
	}

	if isProvisioningRequired {
		tempPassword, _ := generateTempPassword(8)
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(tempPassword), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("failed to hash temp password: %w", err)
		}

		newStudent := &domain.Student{
			ID:           targetStudentID,
			FirstName:    firstName,
			LastName:     app.LastName,
			Email:        studentEmail,
			PasswordHash: string(hashedPassword),
			IsFirstLogin: true,
			CreatedAt:    time.Now(),
		}

		if err = s.repo.CreateStudent(ctx, newStudent); err != nil {
			return fmt.Errorf("failed to provision student account: %w", err)
		}

		if err = s.repo.CreateStudentBilling(ctx, targetStudentID); err != nil {
			return fmt.Errorf("failed to create student billing: %w", err)
		}

		_ = s.notification.SendStudentWelcomeEmail(firstName, studentEmail, tempPassword)
	}

	// Record the payment
	ph := &domain.PaymentHistory{
		StudentID:   targetStudentID,
		AmountPaid:  amountKobo,
		Gateway:     "SYSTEM_SCHOLARSHIP",
		ReferenceID: uuid.New().String(),
	}
	_ = s.repo.InsertPaymentHistory(ctx, ph)

	// Update billing totals
	newTotal, err := s.repo.IncrementBillingPaid(ctx, targetStudentID, amountKobo)
	if err != nil {
		return fmt.Errorf("failed to increment billing: %w", err)
	}

	const totalDueKobo = 25_000_000 // ₦250,000
	newPaymentStatus := "Partial"

	if newTotal >= totalDueKobo {
		_ = s.repo.SetBillingStatus(ctx, targetStudentID, "paid_in_full")
		_ = s.repo.SetNextPaymentDue(ctx, targetStudentID, nil)
		newPaymentStatus = "Paid"
	} else {
		cohortStartDate := time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC)
		var nextDue time.Time
		if time.Now().Before(cohortStartDate) {
			nextDue = cohortStartDate.Add(30 * 24 * time.Hour)
		} else {
			nextDue = time.Now().Add(30 * 24 * time.Hour)
		}
		_ = s.repo.SetNextPaymentDue(ctx, targetStudentID, &nextDue)
		_ = s.repo.SetBillingStatus(ctx, targetStudentID, "good_standing")
	}

	// Update application status
	if err = s.repo.UpdateApplicationStatusByID(ctx, applicationID, newPaymentStatus); err != nil {
		return fmt.Errorf("failed to update application status: %w", err)
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
		"exp":            time.Now().Add(15 * time.Minute).Unix(),
		"iat":            time.Now().Unix(),
	})

	tokenString, err := token.SignedString([]byte(s.config.JWTSecret))
	if err != nil {
		return nil, fmt.Errorf("failed to sign token: %w", err)
	}

	// Generate refresh token
	refreshToken := uuid.New().String()
	rtHash := hashToken(refreshToken)
	familyID := uuid.New()

	rt := &domain.RefreshToken{
		TokenHash: rtHash,
		UserType:  "student",
		UserID:    student.ID.String(),
		FamilyID:  familyID,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}

	err = s.refreshRepo.CreateRefreshToken(ctx, rt)
	if err != nil {
		return nil, fmt.Errorf("failed to create refresh token: %w", err)
	}

	return &domain.AcademyAuthResponse{
		Token:        tokenString,
		RefreshToken: refreshToken,
		IsFirstLogin: student.IsFirstLogin,
	}, nil
}

func (s *academyService) RefreshStudentToken(ctx context.Context, refreshToken string) (*domain.AcademyAuthResponse, string, error) {
	hash := hashToken(refreshToken)
	rt, err := s.refreshRepo.GetRefreshTokenByHash(ctx, hash)
	if err != nil {
		return nil, "", errors.New("invalid refresh token")
	}

	if rt.Revoked || rt.ExpiresAt.Before(time.Now()) {
		if rt.Revoked {
			// Detection: if a revoked token is reused, revoke the entire family
			_ = s.refreshRepo.RevokeRefreshTokenFamily(ctx, rt.FamilyID)
		}
		return nil, "", errors.New("refresh token expired or revoked")
	}

	// Single-use rotation
	_ = s.refreshRepo.RevokeRefreshToken(ctx, rt.ID)

	// Get student from DB
	studentID, err := uuid.Parse(rt.UserID)
	if err != nil {
		return nil, "", errors.New("invalid student id in token")
	}
	student, err := s.repo.GetStudentByID(ctx, studentID)
	if err != nil {
		return nil, "", errors.New("student not found")
	}

	// Issue new access token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":            student.ID,
		"email":          student.Email,
		"is_first_login": student.IsFirstLogin,
		"status":         student.Status,
		"type":           "student",
		"exp":            time.Now().Add(15 * time.Minute).Unix(),
		"iat":            time.Now().Unix(),
	})

	tokenString, err := token.SignedString([]byte(s.config.JWTSecret))
	if err != nil {
		return nil, "", fmt.Errorf("failed to sign token: %w", err)
	}

	// Issue new refresh token (rotating)
	newRefreshToken := uuid.New().String()
	newRtHash := hashToken(newRefreshToken)

	newRt := &domain.RefreshToken{
		TokenHash: newRtHash,
		UserType:  "student",
		UserID:    rt.UserID,
		FamilyID:  rt.FamilyID,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}

	err = s.refreshRepo.CreateRefreshToken(ctx, newRt)
	if err != nil {
		return nil, "", fmt.Errorf("failed to create refresh token: %w", err)
	}

	return &domain.AcademyAuthResponse{
		Token:        tokenString,
		IsFirstLogin: student.IsFirstLogin,
	}, newRefreshToken, nil
}

func (s *academyService) ChangePassword(ctx context.Context, studentID uuid.UUID, req *domain.AcademyChangePasswordRequest) error {
	student, err := s.repo.GetStudentByID(ctx, studentID)
	if err != nil {
		return err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(student.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		return errors.New("invalid current password")
	}

	if req.CurrentPassword == req.NewPassword {
		return errors.New("new password cannot be the same as current password")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	err = s.repo.UpdateStudentPassword(ctx, studentID, string(hashedPassword))
	if err != nil {
		return err
	}

	go func() {
		_ = s.notification.SendPasswordChangedEmail(student.FirstName, student.Email)
	}()

	return nil
}

func (s *academyService) RevokeToken(ctx context.Context, rawToken string) error {
	hash := HashToken(rawToken) // using the exported HashToken from auth_service.go

	// Parse the token to get expiry for TTL
	token, _ := jwt.Parse(rawToken, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.config.JWTSecret), nil
	})

	var ttl time.Duration = 7 * 24 * time.Hour // default student TTL
	if token != nil {
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if exp, ok := claims["exp"].(float64); ok {
				remaining := time.Until(time.Unix(int64(exp), 0))
				if remaining > 0 {
					ttl = remaining
				}
			}
		}
	}

	// Write to cache (fast path)
	if s.tokenCache != nil {
		_ = s.tokenCache.Revoke(ctx, hash, ttl)
	}
	return nil // For students, since we don't have DB token table like admin, we rely entirely on cache for now
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

func (s *academyService) BroadcastReschedule(ctx context.Context, reason string) error {
	students, err := s.repo.GetAllStudents(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch students: %w", err)
	}

	oldDate := "May 16th, 2026"
	newDate := "June 1st, 2026"

	var lastErr error
	for _, student := range students {
		// Only notify active students
		if student.Status != "active" {
			continue
		}

		err := s.notification.SendCohortRescheduleEmail(student.FirstName, student.Email, oldDate, newDate, reason)
		if err != nil {
			log.Printf("ERROR: Failed to send reschedule email to %s: %v\n", student.Email, err)
			lastErr = err
		}
	}

	return lastErr
}

func (s *academyService) GetAdminApplications(ctx context.Context) (*domain.AdminCohortResponse, error) {
	apps, err := s.repo.GetAdminCohortApplications(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch applications: %w", err)
	}

	var paidSeats int
	var pendingSeats int

	for _, app := range apps {
		switch app.PaymentStatus {
		case "Paid", "Partial":
			paidSeats++
		default:
			pendingSeats++
		}
	}

	billingOverview, _ := s.repo.GetBillingOverview(ctx)
	totalRevenue := 0
	if billingOverview != nil {
		// Convert from kobo to Naira for the Cohort dashboard which expects Naira
		totalRevenue = billingOverview.TotalRevenue / 100
	}

	return &domain.AdminCohortResponse{
		Metrics: domain.AdminCohortStats{
			TotalApplications: len(apps),
			PaidSeats:         paidSeats,
			PendingSeats:      pendingSeats,
			TotalRevenue:      totalRevenue,
		},
		Applications: apps,
	}, nil
}

func (s *academyService) GetCurriculum(ctx context.Context, cohortID int) ([]*domain.CohortWeek, error) {
	return s.repo.GetWeeks(ctx, cohortID)
}

func (s *academyService) UpdateCohortWeek(ctx context.Context, req *domain.UpdateWeekRequest) error {
	week, err := s.repo.GetWeekByID(ctx, req.ID)
	if err != nil {
		return fmt.Errorf("week not found: %w", err)
	}

	week.Title = req.Title
	week.RecordingURL = req.RecordingURL
	week.Materials = req.Materials
	week.Transcript = req.Transcript
	week.AssignmentInstructions = req.AssignmentInstructions

	return s.repo.UpdateWeek(ctx, week)
}

func (s *academyService) SubmitAssignment(ctx context.Context, studentID uuid.UUID, req *domain.SubmitAssignmentRequest) error {
	// First verify the week exists
	week, err := s.repo.GetWeekByID(ctx, req.WeekID)
	if err != nil {
		return fmt.Errorf("invalid week: %w", err)
	}

	// For state decoupling, we allow submissions if all published sessions are 'archived'
	allArchived := true
	hasPublished := false
	for _, sess := range week.Sessions {
		if sess.VisibilityStatus == "published" {
			hasPublished = true
			if sess.Status != "archived" {
				allArchived = false
				break
			}
		}
	}

	if !hasPublished || !allArchived {
		return errors.New("assignments can only be submitted once all published sessions in this module are archived")
	}

	ass := &domain.Assignment{
		StudentID:         studentID,
		WeekID:            req.WeekID,
		GitHubURL:         req.GitHubURL,
		SubmissionFileKey: req.SubmissionFileKey,
	}

	return s.repo.CreateAssignment(ctx, ass)
}

func (s *academyService) GetStudentDashboardData(ctx context.Context, studentID uuid.UUID) (*domain.StudentDashboardResponse, error) {
	student, err := s.repo.GetStudentByID(ctx, studentID)
	if err != nil {
		return nil, err
	}

	weeks, err := s.repo.GetWeeks(ctx, student.CohortID)
	if err != nil {
		return nil, err
	}

	cohort, err := s.repo.GetCohortByID(ctx, student.CohortID)
	if err != nil {
		return nil, err
	}

	asses, err := s.repo.GetStudentAssignments(ctx, studentID)
	if err != nil {
		return nil, err
	}

	// Filter sessions to only published ones for students
	for _, w := range weeks {
		var publishedSessions []*domain.ClassSession
		for _, sess := range w.Sessions {
			if sess.VisibilityStatus == "published" {
				publishedSessions = append(publishedSessions, sess)
			}
		}
		w.Sessions = publishedSessions
	}

	return &domain.StudentDashboardResponse{
		Weeks:             weeks,
		Assignments:       asses,
		IsFirstLogin:      student.IsFirstLogin,
		Status:            student.Status,
		CohortName:        cohort.Name,
		CohortStatus:      cohort.Status,
		AttendedCount:     student.AttendedCount,
		TotalHeldSessions: student.TotalHeldSessions,
		AttendanceRate:    student.AttendanceRate,
	}, nil
}

func (s *academyService) AdminCloneCohort(ctx context.Context, req *domain.AdminCloneCohortRequest) error {
	newCohortID, err := s.repo.CreateCohort(ctx, req.NewCohortName)
	if err != nil {
		return fmt.Errorf("failed to create cohort: %w", err)
	}
	return s.repo.CloneCohortCurriculum(ctx, req.SourceCohortID, newCohortID)
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
			if sub.AvatarS3Key != nil {
				url, err := s.GeneratePresignedDownloadURL(ctx, *sub.AvatarS3Key)
				if err == nil {
					sub.StudentAvatarUrl = url
				}
			}

			comments, _ := s.repo.GetSubmissionComments(ctx, sub.ID)
			for _, c := range comments {
				if c.AvatarS3Key != nil {
					url, err := s.GeneratePresignedDownloadURL(ctx, *c.AvatarS3Key)
					if err == nil {
						c.StudentAvatarUrl = url
					}
				}
			}
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
	err := s.repo.UpsertLabSubmission(ctx, sub)
	if err != nil {
		return err
	}

	// Trigger: Notify admin about new lab submission
	go func() {
		student, sErr := s.repo.GetStudentByID(context.Background(), studentID)
		if sErr != nil {
			return
		}
		lab, lErr := s.repo.GetLabByID(context.Background(), req.LabID)
		if lErr != nil {
			return
		}
		actorID := studentID.String()
		refURL := fmt.Sprintf("/academy/break-it-labs/%d", req.LabID)
		msg := fmt.Sprintf("%s %s submitted a fix for \"%s\"", student.FirstName, student.LastName, lab.Title)
		_ = s.notifSystem.NotifyUser(context.Background(), &actorID, "admin_system", "submission", msg, &refURL)
	}()

	return nil
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
	err := s.repo.CreateSubmissionComment(ctx, comm)
	if err != nil {
		return err
	}

	// Trigger: Parse @mentions and notify tagged users
	go func() {
		labID, err := s.repo.GetLabIDBySubmissionID(context.Background(), subID)
		if err != nil {
			return
		}

		mentionRe := regexp.MustCompile(`(?:\s|^)@([a-zA-Z0-9_-]+)`)
		matches := mentionRe.FindAllStringSubmatch(body, -1)
		if len(matches) == 0 {
			return
		}

		actor, aErr := s.repo.GetStudentByID(context.Background(), studentID)
		if aErr != nil {
			return
		}
		actorID := studentID.String()
		refURL := fmt.Sprintf("/academy/break-it-labs/%d", labID)

		seen := make(map[string]bool)
		for _, m := range matches {
			username := m[1]
			if seen[username] {
				continue
			}
			seen[username] = true

			target, tErr := s.repo.GetStudentByUsername(context.Background(), username)
			if tErr != nil || target.ID == studentID {
				continue // skip invalid or self-mention
			}

			msg := fmt.Sprintf("%s %s mentioned you in a comment", actor.FirstName, actor.LastName)
			_ = s.notifSystem.NotifyUser(context.Background(), &actorID, target.ID.String(), "mention", msg, &refURL)
		}
	}()

	return nil
}

// Phase 6: Alumni Hall of Fame & Disciplinary

func (s *academyService) ListAllStudents(ctx context.Context) ([]*domain.Student, error) {
	return s.repo.GetAllStudents(ctx)
}

func (s *academyService) SearchStudents(ctx context.Context, query string) ([]*domain.Student, error) {
	return s.repo.SearchStudents(ctx, strings.TrimSpace(query))
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

func (s *academyService) GetStudentCapstone(ctx context.Context, studentID uuid.UUID) (*domain.CapstoneProject, error) {
	return s.repo.GetCapstoneByStudentID(ctx, studentID)
}

func (s *academyService) GetPendingCapstones(ctx context.Context) ([]*domain.CapstoneProject, error) {
	return s.repo.GetPendingCapstones(ctx)
}

func (s *academyService) GetCapstoneByID(ctx context.Context, id int) (*domain.CapstoneProject, error) {
	return s.repo.GetCapstoneByID(ctx, id)
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
	if err == nil && s.notification != nil {
		_ = s.notification.SendCapstoneApprovedEmail(student.FirstName, student.Email, slug)
	}

	// Trigger: In-app notification for capstone approval
	if err == nil {
		go func() {
			refURL := fmt.Sprintf("/academy/alumni/%s", slug)
			msg := fmt.Sprintf("Congratulations! Your capstone project has been approved. Welcome to the Alumni Hall of Fame!")
			_ = s.notifSystem.NotifyUser(context.Background(), nil, student.ID.String(), "feedback", msg, &refURL)
		}()
	}

	return err
}

func (s *academyService) RejectCapstone(ctx context.Context, capstoneID int, feedback string) error {
	err := s.repo.UpdateCapstoneStatusAndFeedback(ctx, capstoneID, "needs_revision", feedback)
	if err != nil {
		return err
	}

	// Fetch capstone to get student ID
	capstone, err := s.repo.GetCapstoneByID(ctx, capstoneID)
	if err == nil && capstone != nil {
		student, err := s.repo.GetStudentByID(ctx, capstone.StudentID)
		if err == nil && student != nil && s.notification != nil {
			_ = s.notification.SendCapstoneFeedbackEmail(student.FirstName, student.Email, feedback)
		}

		// Trigger: In-app notification for capstone rejection
		if student != nil {
			go func() {
				refURL := "/academy/dashboard"
				msg := fmt.Sprintf("Your capstone project needs revision. Feedback: %s", feedback)
				_ = s.notifSystem.NotifyUser(context.Background(), nil, student.ID.String(), "feedback", msg, &refURL)
			}()
		}
	}

	return nil
}

func (s *academyService) RevokeAlumni(ctx context.Context, slug string) error {
	profile, err := s.repo.GetAlumniBySlug(ctx, slug)
	if err != nil {
		return err
	}

	// 1. Delete alumni profile
	if err := s.repo.DeleteAlumniProfile(ctx, slug); err != nil {
		return err
	}

	// 2. Revert student status
	if err := s.repo.UpdateStudentStatus(ctx, profile.StudentID, "active", ""); err != nil {
		return err
	}

	// 3. Revert capstone projects to pending
	projects, err := s.repo.GetCapstoneProjectsByStudent(ctx, profile.StudentID)
	if err == nil {
		for _, p := range projects {
			_ = s.repo.UpdateCapstoneStatus(ctx, p.ID, "pending")
		}
	}

	return nil
}

func (s *academyService) ManualCreateAlumni(ctx context.Context, req *domain.ManualAlumniRequest) error {
	student, err := s.repo.GetStudentByID(ctx, req.StudentID)
	if err != nil {
		return err
	}

	// 1. Update Student Status to 'graduated'
	err = s.repo.UpdateStudentStatus(ctx, student.ID, "graduated", "")
	if err != nil {
		return err
	}

	// 2. Create Alumni Profile
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

// Class Sessions

func (s *academyService) AdminCreateClassSession(ctx context.Context, sess *domain.ClassSession) error {
	err := s.repo.CreateClassSession(ctx, sess)
	if err != nil {
		return err
	}

	// Trigger: Notify cohort when session is published
	if sess.VisibilityStatus == "published" {
		go func() {
			week, wErr := s.repo.GetWeekByID(context.Background(), sess.CohortWeekID)
			if wErr != nil {
				return
			}
			refURL := fmt.Sprintf("/academy/dashboard/week/%d", sess.CohortWeekID)
			msg := fmt.Sprintf("New class session \"%s\" has been published for %s", sess.Title, week.Title)
			_ = s.notifSystem.NotifyCohort(context.Background(), nil, week.CohortID, "system", msg, &refURL)
		}()
	}

	return nil
}

func (s *academyService) AdminUpdateClassSession(ctx context.Context, sess *domain.ClassSession) error {
	err := s.repo.UpdateClassSession(ctx, sess)
	if err != nil {
		return err
	}

	// Trigger: Notify cohort when a recording or session is published/updated
	if sess.VisibilityStatus == "published" {
		go func() {
			week, wErr := s.repo.GetWeekByID(context.Background(), sess.CohortWeekID)
			if wErr != nil {
				return
			}
			refURL := fmt.Sprintf("/academy/dashboard/week/%d", sess.CohortWeekID)
			var msg string
			if sess.RecordingURL != "" {
				msg = fmt.Sprintf("A recording has been added for \"%s\" in %s", sess.Title, week.Title)
			} else {
				msg = fmt.Sprintf("Class session \"%s\" has been updated for %s", sess.Title, week.Title)
			}
			_ = s.notifSystem.NotifyCohort(context.Background(), nil, week.CohortID, "system", msg, &refURL)
		}()
	}

	return nil
}

func (s *academyService) AdminDeleteClassSession(ctx context.Context, id int) error {
	return s.repo.DeleteClassSession(ctx, id)
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

// RunClassSessionAutomator runs as a background goroutine. Every 60 seconds it checks
// for scheduled class sessions whose time has come and flips them to 'live'.
func (s *academyService) RunClassSessionAutomator(ctx context.Context) {
	log.Println("[Automator] Class Session Automator started — running every 60 seconds")
	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()

	// Initial run
	if affected, err := s.repo.AutoStartScheduledSessions(ctx); err == nil && affected > 0 {
		log.Printf("[Automator] Flipped %d sessions to live\n", affected)
	}

	for {
		select {
		case <-ticker.C:
			affected, err := s.repo.AutoStartScheduledSessions(ctx)
			if err != nil {
				log.Printf("[Automator] Error updating scheduled sessions: %v\n", err)
				continue
			}
			if affected > 0 {
				log.Printf("[Automator] Flipped %d sessions to live\n", affected)
			}
		case <-ctx.Done():
			log.Println("[Automator] Class Session Automator shutting down")
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

// ─── Admin Command Center ───────────────────────────────────────────────────

func (s *academyService) GetBillingOverview(ctx context.Context) (*domain.BillingOverview, error) {
	return s.repo.GetBillingOverview(ctx)
}

func (s *academyService) GetAllStudentBillings(ctx context.Context) ([]*domain.AdminStudentBilling, error) {
	return s.repo.GetAllStudentBillings(ctx)
}

func (s *academyService) ProcessManualPayment(ctx context.Context, req *domain.ManualPaymentRequest) error {
	student, err := s.repo.GetStudentByID(ctx, req.StudentID)
	if err != nil {
		return err
	}

	billing, err := s.repo.GetStudentBilling(ctx, req.StudentID)
	if err != nil {
		return err
	}

	// 1. Generate Automatic Reference
	reference := fmt.Sprintf("MANUAL-%d-%s", time.Now().Unix(), uuid.New().String()[:8])

	// 2. Insert into Ledger
	ph := &domain.PaymentHistory{
		StudentID:   req.StudentID,
		AmountPaid:  req.Amount,
		Gateway:     "manual",
		ReferenceID: reference,
	}
	if err := s.repo.InsertPaymentHistory(ctx, ph); err != nil {
		return err
	}

	// 3. Update Totals
	newTotal, err := s.repo.IncrementBillingPaid(ctx, req.StudentID, req.Amount)
	if err != nil {
		return err
	}

	// 4. Update Status Logic
	if newTotal >= billing.TotalDue {
		_ = s.repo.SetBillingStatus(ctx, req.StudentID, "paid_in_full")
		_ = s.repo.SetNextPaymentDue(ctx, req.StudentID, nil)
	} else if billing.BillingStatus == "payment_locked" {
		// Unlock account if they've made a payment (even partial manual for now)
		_ = s.repo.SetBillingStatus(ctx, req.StudentID, "good_standing")
	}

	// 5. Success Email (Fire and forget)
	remaining := billing.TotalDue - newTotal
	_ = s.notification.SendPaymentConfirmationEmail(student.Email, req.Amount, remaining)

	return nil
}

func (s *academyService) UpdateStudentStatus(ctx context.Context, id uuid.UUID, req *domain.UpdateStudentStatusRequest) error {
	student, err := s.repo.GetStudentByID(ctx, id)
	if err != nil {
		return err
	}

	// 1. Handle Academic Status transition
	if req.AcademicStatus != student.Status {
		err := s.repo.UpdateStudentStatus(ctx, id, req.AcademicStatus, "")
		if err != nil {
			return err
		}

		// Notifications
		if req.AcademicStatus == "probation" {
			_ = s.notification.SendAcademicProbationEmail(student.FirstName, student.Email, "Academic underperformance or policy violation")
		} else if req.AcademicStatus == "disqualified" {
			_ = s.notification.SendStudentDisqualificationEmail(student.FirstName, student.Email, "Violation of platform terms")
		}
	}

	// 2. Handle Portal Lock
	return s.repo.SetManualLock(ctx, id, req.IsManuallyLocked)
}

// Attendance Logic

func (s *academyService) JoinSession(ctx context.Context, studentID uuid.UUID, sessionID int) (string, error) {
	// 1. Get Session
	session, err := s.repo.GetClassSessionByID(ctx, sessionID)
	if err != nil {
		return "", err
	}

	// 2. record attendance
	err = s.repo.RecordAttendance(ctx, sessionID, studentID)
	if err != nil {
		// Log error but don't block redirect
		fmt.Printf("Failed to record attendance: %v\n", err)
	}

	// 3. Return meeting URL
	if session.MeetingURL == "" {
		return "", fmt.Errorf("session meeting URL not set")
	}

	return session.MeetingURL, nil
}

func (s *academyService) GetStudentAttendanceHistory(ctx context.Context, studentID uuid.UUID) ([]*domain.AttendanceRecord, error) {
	student, err := s.repo.GetStudentByID(ctx, studentID)
	if err != nil {
		return nil, err
	}

	// 1. Get all weeks and sessions
	weeks, err := s.repo.GetWeeks(ctx, student.CohortID)
	if err != nil {
		return nil, err
	}

	// 2. Get student attendance
	attended, err := s.repo.GetStudentAttendance(ctx, studentID)
	if err != nil {
		return nil, err
	}

	attendanceMap := make(map[int]*time.Time)
	for _, a := range attended {
		attendanceMap[a.SessionID] = &a.JoinedAt
	}

	var history []*domain.AttendanceRecord
	for _, w := range weeks {
		for _, sess := range w.Sessions {
			// We only care about sessions that have status 'live' or 'archived' for "Held" metrics,
			// but we can show all of them in the history.
			joinedAt, wasAttended := attendanceMap[sess.ID]
			history = append(history, &domain.AttendanceRecord{
				SessionTitle: sess.Title,
				Status:       sess.Status,
				ScheduledAt:  sess.ScheduledAt,
				Attended:     wasAttended,
				JoinedAt:     joinedAt,
			})
		}
	}

	return history, nil
}

func (s *academyService) GetSessionAttendance(ctx context.Context, sessionID int) ([]*domain.Student, error) {
	return s.repo.GetSessionAttendance(ctx, sessionID)
}

func (s *academyService) GeneratePresignedUploadURL(ctx context.Context, studentID uuid.UUID, filename string, uploadType string) (string, string, error) {
	if s.config.S3BucketName == "" {
		return "", "", errors.New("S3 bucket not configured")
	}

	cfg, err := awsconfig.LoadDefaultConfig(ctx)
	if err != nil {
		return "", "", fmt.Errorf("failed to load AWS config: %w", err)
	}

	client := s3.NewFromConfig(cfg)
	presignClient := s3.NewPresignClient(client)

	var fileKey string
	if uploadType == "avatar" {
		fileKey = fmt.Sprintf("avatars/%s/%s", studentID.String(), filename)
	} else {
		fileKey = fmt.Sprintf("assignments/%s/%s-%s", studentID.String(), uuid.New().String(), filename)
	}

	req, err := presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(s.config.S3BucketName),
		Key:    aws.String(fileKey),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = 5 * time.Minute
	})

	if err != nil {
		return "", "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return req.URL, fileKey, nil
}

func (s *academyService) GeneratePresignedDownloadURL(ctx context.Context, fileKey string) (string, error) {
	if s.config.S3BucketName == "" {
		return "", errors.New("S3 bucket not configured")
	}

	cfg, err := awsconfig.LoadDefaultConfig(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to load AWS config: %w", err)
	}

	client := s3.NewFromConfig(cfg)
	presignClient := s3.NewPresignClient(client)

	req, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.config.S3BucketName),
		Key:    aws.String(fileKey),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = 15 * time.Minute
	})

	if err != nil {
		return "", fmt.Errorf("failed to generate presigned download URL: %w", err)
	}

	return req.URL, nil
}

func (s *academyService) GetStudentProfile(ctx context.Context, id uuid.UUID) (*domain.Student, error) {
	return s.repo.GetStudentByID(ctx, id)
}

func (s *academyService) UpdateStudentProfile(ctx context.Context, id uuid.UUID, req *domain.StudentProfileRequest) error {
	if req.Username != nil {
		if matched, _ := regexp.MatchString(`^[a-zA-Z0-9_.-]+$`, *req.Username); !matched {
			return errors.New("username can only contain letters, numbers, underscores, dots, and hyphens")
		}
		existing, err := s.repo.GetStudentByUsername(ctx, *req.Username)
		if err == nil && existing.ID != id {
			return errors.New("username is already taken")
		}
	}
	return s.repo.UpdateStudentProfile(ctx, id, req.AvatarS3Key, req.LinkedInURL, req.GitHubURL, req.Bio, req.Username, req.DisplayName)
}

func (s *academyService) UpdateStudentPreferences(ctx context.Context, id uuid.UUID, req *domain.UpdatePreferencesRequest) error {
	prefBytes, err := json.Marshal(req.Preferences)
	if err != nil {
		return err
	}
	return s.repo.UpdateStudentPreferences(ctx, id, string(prefBytes))
}

func (s *academyService) RequestEmailChange(ctx context.Context, studentID uuid.UUID, req *domain.RequestEmailChangeRequest) error {
	existing, err := s.repo.GetStudentByEmail(ctx, req.NewEmail)
	if err == nil && existing != nil {
		return errors.New("email is already in use")
	}

	token := uuid.New().String()
	err = s.repo.SetPendingEmailToken(ctx, studentID, req.NewEmail, token)
	if err != nil {
		return err
	}

	// Simulate sending email
	fmt.Printf("[Email Simulation] Send to %s: Click here to confirm email change: /academy/dashboard/settings/confirm-email?token=%s\n", req.NewEmail, token)

	return nil
}

func (s *academyService) ConfirmEmailChange(ctx context.Context, req *domain.ConfirmEmailChangeRequest) error {
	student, err := s.repo.GetStudentByEmailVerifyToken(ctx, req.Token)
	if err != nil {
		return errors.New("invalid or expired token")
	}
	if student.PendingEmail == nil {
		return errors.New("no pending email change")
	}

	return s.repo.ConfirmPendingEmail(ctx, student.ID, *student.PendingEmail)
}

// ─── Notifications ─────────────────────────────────────────────────────────────

func (s *academyService) GetUnreadNotifications(ctx context.Context, userID string) ([]*domain.Notification, error) {
	return s.repo.GetUnreadNotifications(ctx, userID)
}

func (s *academyService) MarkNotificationRead(ctx context.Context, id uuid.UUID, userID string) error {
	return s.repo.MarkNotificationRead(ctx, id, userID)
}

func (s *academyService) MarkAllNotificationsRead(ctx context.Context, userID string) error {
	return s.repo.MarkAllNotificationsRead(ctx, userID)
}
