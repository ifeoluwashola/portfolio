package handler

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/middleware"
	"github.com/google/uuid"
	"strconv"
	"strings"
)

type AcademyHandler struct {
	svc domain.AcademyService
}

func NewAcademyHandler(svc domain.AcademyService) *AcademyHandler {
	return &AcademyHandler{svc: svc}
}

func (h *AcademyHandler) HandleApply(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req domain.AcademyApplyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.FirstName == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	resp, err := h.svc.InitializeApplication(r.Context(), &req)
	if err != nil {
		// Differentiate configuration errors and business failures if necessary,
		// but standard 500 covers general Paystack issues safely in this demo.
		http.Error(w, "Payment initialization failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

func (h *AcademyHandler) HandlePaystackWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Paystack requires raw body to verify HMAC signature
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Cannot read body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	signature := r.Header.Get("x-paystack-signature")
	if signature == "" {
		http.Error(w, "Missing signature", http.StatusUnauthorized)
		return
	}

	err = h.svc.ProcessWebhook(r.Context(), signature, bodyBytes)
	if err != nil {
		http.Error(w, "Webhook processing failed: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Send generic 200 OK so Paystack knows we've received it successfully.
	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleGetAdminApplications(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	apps, err := h.svc.GetAdminApplications(r.Context())
	if err != nil {
		http.Error(w, "Failed to retrieve applications: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(apps); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

func (h *AcademyHandler) HandleGrantScholarship(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.PathValue("id")
	appID, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid application ID", http.StatusBadRequest)
		return
	}

	var req domain.GrantScholarshipRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if req.AmountNaira <= 0 {
		http.Error(w, "Scholarship amount must be greater than zero", http.StatusBadRequest)
		return
	}

	amountKobo := req.AmountNaira * 100

	err = h.svc.GrantScholarship(r.Context(), appID, amountKobo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Scholarship granted successfully"})
}

func (h *AcademyHandler) HandleGetSession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		writeJSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	stID, _ := uuid.Parse(studentIDStr)
	session, err := h.svc.GetStudentSession(r.Context(), stID)
	if err != nil {
		writeJSONError(w, "Student not found", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(session)
}

func (h *AcademyHandler) HandleAcademyLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req domain.AcademyLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	resp, err := h.svc.LoginStudent(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Set HttpOnly cookie for the student token
	http.SetCookie(w, &http.Cookie{
		Name:     "academy_token",
		Value:    resp.Token,
		Path:     "/",
		HttpOnly: true,
		Secure:   true, // Should be true in production
		SameSite: http.SameSiteLaxMode,
		MaxAge:   7 * 24 * 60 * 60, // 7 days
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	// Return success and is_first_login, but NOT the token
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":        true,
		"is_first_login": resp.IsFirstLogin,
	})
}

func (h *AcademyHandler) HandleAcademyLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract and revoke the token if present
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 {
			_ = h.svc.RevokeToken(r.Context(), parts[1])
		}
	}

	// Clear the academy_token cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "academy_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully"})
}

func (h *AcademyHandler) HandleAcademyChangePassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req domain.AcademyChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		http.Error(w, "Unauthorized session", http.StatusUnauthorized)
		return
	}

	stID, err := uuid.Parse(studentIDStr)
	if err != nil {
		http.Error(w, "Invalid student ID formatted", http.StatusBadRequest)
		return
	}

	err = h.svc.ChangePassword(r.Context(), stID, &req)
	if err != nil {
		http.Error(w, "Failed to change password: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Revoke current token so all active sessions are terminated
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 {
			_ = h.svc.RevokeToken(r.Context(), parts[1])
		}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Password changed successfully. Please log in again."})
}

func (h *AcademyHandler) HandleAcademyForgotPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req domain.AcademyForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err := h.svc.ForgotPassword(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "If the email exists, a reset instruction has been sent."})
}

func (h *AcademyHandler) HandleAcademyResetPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req domain.AcademyResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err := h.svc.ResetPassword(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Password reset successfully"})
}

// Phase 4 handlers

func (h *AcademyHandler) HandleGetCurriculum(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	weeks, err := h.svc.GetCurriculum(r.Context())
	if err != nil {
		http.Error(w, "Failed to get curriculum: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(weeks)
}

func (h *AcademyHandler) HandleUpdateWeek(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req domain.UpdateWeekRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err := h.svc.UpdateCohortWeek(r.Context(), &req)
	if err != nil {
		http.Error(w, "Failed to update week: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleGetSubmissions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	subs, err := h.svc.GetAdminSubmissions(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch submissions: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(subs)
}

func (h *AcademyHandler) HandleGradeSubmission(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req domain.GradeAssignmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err := h.svc.GradeSubmission(r.Context(), &req)
	if err != nil {
		http.Error(w, "Failed to grade submission: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleGetStudentDashboard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		http.Error(w, "Unauthorized session", http.StatusUnauthorized)
		return
	}

	stID, err := uuid.Parse(studentIDStr)
	if err != nil {
		http.Error(w, "Invalid student ID formatted", http.StatusBadRequest)
		return
	}

	data, err := h.svc.GetStudentDashboardData(r.Context(), stID)
	if err != nil {
		http.Error(w, "Failed to fetch dashboard data: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func (h *AcademyHandler) HandleSubmitAssignment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		http.Error(w, "Unauthorized session", http.StatusUnauthorized)
		return
	}

	stID, err := uuid.Parse(studentIDStr)
	if err != nil {
		http.Error(w, "Invalid student ID formatted", http.StatusBadRequest)
		return
	}

	var req domain.SubmitAssignmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err = h.svc.SubmitAssignment(r.Context(), stID, &req)
	if err != nil {
		http.Error(w, "Submission failed: "+err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleGetUploadURL(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		http.Error(w, "Unauthorized session", http.StatusUnauthorized)
		return
	}

	stID, err := uuid.Parse(studentIDStr)
	if err != nil {
		http.Error(w, "Invalid student ID formatted", http.StatusBadRequest)
		return
	}

	filename := r.URL.Query().Get("filename")
	if filename == "" {
		http.Error(w, "Missing filename parameter", http.StatusBadRequest)
		return
	}

	url, key, err := h.svc.GeneratePresignedUploadURL(r.Context(), stID, filename)
	if err != nil {
		http.Error(w, "Failed to generate upload URL: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"upload_url": url,
		"file_key":   key,
	})
}

func (h *AcademyHandler) HandleGetDownloadURL(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	fileKey := r.URL.Query().Get("key")
	if fileKey == "" {
		http.Error(w, "Missing key parameter", http.StatusBadRequest)
		return
	}

	url, err := h.svc.GeneratePresignedDownloadURL(r.Context(), fileKey)
	if err != nil {
		http.Error(w, "Failed to generate download URL: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"download_url": url,
	})
}

// Phase 5: Break-It Labs Handlers

func (h *AcademyHandler) HandleListLabs(w http.ResponseWriter, r *http.Request) {
	labs, err := h.svc.ListLabs(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch labs: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(labs)
}

func (h *AcademyHandler) HandleGetLab(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid lab ID", http.StatusBadRequest)
		return
	}

	lab, err := h.svc.GetLab(r.Context(), id)
	if err != nil {
		http.Error(w, "Lab not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lab)
}

func (h *AcademyHandler) HandleSubmitLabFix(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid lab ID", http.StatusBadRequest)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	stID, _ := uuid.Parse(studentIDStr)

	var req domain.SubmitLabFixRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	req.LabID = id

	err = h.svc.SubmitLabFix(r.Context(), stID, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleAddSubmissionComment(w http.ResponseWriter, r *http.Request) {
	subIDStr := r.PathValue("id")
	subID, err := strconv.Atoi(subIDStr)
	if err != nil {
		http.Error(w, "Invalid submission ID", http.StatusBadRequest)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	stID, _ := uuid.Parse(studentIDStr)

	var req domain.SubmissionCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	err = h.svc.AddSubmissionComment(r.Context(), stID, subID, req.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (h *AcademyHandler) HandleAdminCreateLab(w http.ResponseWriter, r *http.Request) {
	var lab domain.BreakItLab
	if err := json.NewDecoder(r.Body).Decode(&lab); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	err := h.svc.AdminCreateLab(r.Context(), &lab)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (h *AcademyHandler) HandleAdminUpdateLab(w http.ResponseWriter, r *http.Request) {
	var lab domain.BreakItLab
	if err := json.NewDecoder(r.Body).Decode(&lab); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	err := h.svc.AdminUpdateLab(r.Context(), &lab)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleAdminDeleteLab(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, _ := strconv.Atoi(idStr)
	err := h.svc.AdminDeleteLab(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleAdminSetLabWinner(w http.ResponseWriter, r *http.Request) {
	var req domain.SetLabWinnerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	err := h.svc.AdminSetLabWinner(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// Phase 6: Alumni Hall of Fame

func (h *AcademyHandler) HandleListAllStudents(w http.ResponseWriter, r *http.Request) {
	students, err := h.svc.ListAllStudents(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(students)
}

func (h *AcademyHandler) HandleWarnStudent(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid student id", http.StatusBadRequest)
		return
	}

	var req domain.WarnStudentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.svc.AdminWarnStudent(r.Context(), id, req.Reason); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *AcademyHandler) HandleDisqualifyStudent(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid student id", http.StatusBadRequest)
		return
	}

	var req domain.DisqualifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.svc.AdminDisqualifyStudent(r.Context(), id, req.Reason); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *AcademyHandler) HandleSubmitCapstone(w http.ResponseWriter, r *http.Request) {
	studentID := r.Context().Value("student_id").(uuid.UUID)

	var req domain.CapstoneProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.svc.SubmitCapstone(r.Context(), studentID, &req); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (h *AcademyHandler) HandleListPendingCapstones(w http.ResponseWriter, r *http.Request) {
	caps, err := h.svc.GetPendingCapstones(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(caps)
}

func (h *AcademyHandler) HandleApproveCapstone(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, _ := strconv.Atoi(idStr)

	var req domain.ApproveCapstoneRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.svc.ApproveCapstone(r.Context(), id, &req); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *AcademyHandler) HandleAdminUpdateAlumni(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid alumni ID", http.StatusBadRequest)
		return
	}

	var req domain.GraduateStudentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	err = h.svc.AdminUpdateAlumni(r.Context(), id, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleGetEligibleStudents(w http.ResponseWriter, r *http.Request) {
	students, err := h.svc.GetEligibleStudents(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(students)
}

func (h *AcademyHandler) HandleListAlumni(w http.ResponseWriter, r *http.Request) {
	alumni, err := h.svc.ListAlumni(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(alumni)
}

func (h *AcademyHandler) HandleGetAlumniPortfolio(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	portfolio, err := h.svc.GetAlumniPortfolio(r.Context(), slug)
	if err != nil {
		http.Error(w, "Portfolio not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(portfolio)
}

// Class Sessions

func (h *AcademyHandler) HandleCreateClassSession(w http.ResponseWriter, r *http.Request) {
	var sess domain.ClassSession
	if err := json.NewDecoder(r.Body).Decode(&sess); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err := h.svc.AdminCreateClassSession(r.Context(), &sess)
	if err != nil {
		http.Error(w, "Failed to create session: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *AcademyHandler) HandleUpdateClassSession(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid session ID", http.StatusBadRequest)
		return
	}

	var sess domain.ClassSession
	if err := json.NewDecoder(r.Body).Decode(&sess); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	sess.ID = id

	err = h.svc.AdminUpdateClassSession(r.Context(), &sess)
	if err != nil {
		http.Error(w, "Failed to update session: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleDeleteClassSession(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid session ID", http.StatusBadRequest)
		return
	}

	err = h.svc.AdminDeleteClassSession(r.Context(), id)
	if err != nil {
		http.Error(w, "Failed to delete session: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// ─── Billing & Installments ───────────────────────────────────────────────────

// HandleGetBillingStatus returns the student's billing ledger state.
// GET /api/v1/academy/billing
func (h *AcademyHandler) HandleGetBillingStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		writeJSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	studentID, err := uuid.Parse(studentIDStr)
	if err != nil {
		writeJSONError(w, "Invalid student ID", http.StatusBadRequest)
		return
	}

	billing, err := h.svc.GetBillingStatus(r.Context(), studentID)
	if err != nil {
		writeJSONError(w, "Billing record not found", http.StatusNotFound)
		return
	}

	// Enrich with payment count for the frontend installment logic
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(billing)
}

// HandleInitiateInstallmentPayment creates a new Paystack checkout for an
// installment payment initiated from the billing dashboard.
// POST /api/v1/academy/billing/pay
func (h *AcademyHandler) HandleInitiateInstallmentPayment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		writeJSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	studentID, err := uuid.Parse(studentIDStr)
	if err != nil {
		writeJSONError(w, "Invalid student ID", http.StatusBadRequest)
		return
	}

	var req domain.BillingPaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.AmountNaira <= 0 {
		writeJSONError(w, "Amount must be greater than zero", http.StatusBadRequest)
		return
	}

	// Convert Naira → Kobo for Paystack
	amountKobo := req.AmountNaira * 100

	resp, err := h.svc.InitializeInstallmentPayment(r.Context(), studentID, amountKobo)
	if err != nil {
		writeJSONError(w, "Payment initialization failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

// HandleGetBillingHub returns the full billing aggregate (billing state +
// payment history + payment count) for the billing dashboard page.
// GET /api/v1/academy/billing/hub
func (h *AcademyHandler) HandleGetBillingHub(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		writeJSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	studentID, err := uuid.Parse(studentIDStr)
	if err != nil {
		writeJSONError(w, "Invalid student ID", http.StatusBadRequest)
		return
	}

	hub, err := h.svc.GetBillingHub(r.Context(), studentID)
	if err != nil {
		writeJSONError(w, "Billing record not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hub)
}

// ─── Admin Command Center ───────────────────────────────────────────────────

func (h *AcademyHandler) HandleGetAdminBillingOverview(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	overview, err := h.svc.GetBillingOverview(r.Context())
	if err != nil {
		writeJSONError(w, "Failed to retrieve billing overview: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(overview)
}

func (h *AcademyHandler) HandleGetAllStudentBillings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	billings, err := h.svc.GetAllStudentBillings(r.Context())
	if err != nil {
		writeJSONError(w, "Failed to retrieve student billings: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(billings)
}

func (h *AcademyHandler) HandleManualPayment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req domain.ManualPaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if req.StudentID == uuid.Nil || req.Amount <= 0 {
		writeJSONError(w, "Missing student_id or valid amount", http.StatusBadRequest)
		return
	}

	err := h.svc.ProcessManualPayment(r.Context(), &req)
	if err != nil {
		writeJSONError(w, "Failed to process manual payment: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (h *AcademyHandler) HandleUpdateStudentStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract ID from URL (Assumes /api/v1/admin/students/:id/status)
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 4 {
		writeJSONError(w, "Invalid student ID in path", http.StatusBadRequest)
		return
	}
	studentID, err := uuid.Parse(pathParts[3])
	if err != nil {
		writeJSONError(w, "Invalid student UUID", http.StatusBadRequest)
		return
	}

	var req domain.UpdateStudentStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err = h.svc.UpdateStudentStatus(r.Context(), studentID, &req)
	if err != nil {
		writeJSONError(w, "Failed to update student status: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (h *AcademyHandler) HandleJoinSession(w http.ResponseWriter, r *http.Request) {
	sessionID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid session ID", http.StatusBadRequest)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	studentID, _ := uuid.Parse(studentIDStr)

	redirectURL, err := h.svc.JoinSession(r.Context(), studentID, sessionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, redirectURL, http.StatusFound)
}

func (h *AcademyHandler) HandleGetStudentAttendanceHistory(w http.ResponseWriter, r *http.Request) {
	studentID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid student ID", http.StatusBadRequest)
		return
	}

	history, err := h.svc.GetStudentAttendanceHistory(r.Context(), studentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(history)
}

func (h *AcademyHandler) HandleGetSessionAttendance(w http.ResponseWriter, r *http.Request) {
	sessionID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid session ID", http.StatusBadRequest)
		return
	}

	students, err := h.svc.GetSessionAttendance(r.Context(), sessionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(students)
}


