package handler

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/middleware"
	"github.com/google/uuid"
	"log/slog"
	"strconv"
	"strings"
)

type AcademyHandler struct {
	svc      domain.AcademyService
	auditSvc domain.AuditService
}

func NewAcademyHandler(svc domain.AcademyService, auditSvc domain.AuditService) *AcademyHandler {
	return &AcademyHandler{svc: svc, auditSvc: auditSvc}
}

func (h *AcademyHandler) HandleApply(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var req domain.AcademyApplyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	if req.Email == "" || req.FirstName == "" {
		RespondWithError(w, r, http.StatusBadRequest, "Missing required fields", nil)
		return
	}

	resp, err := h.svc.InitializeApplication(r.Context(), &req)
	if err != nil {
		// Differentiate configuration errors and business failures if necessary,
		// but standard 500 covers general Paystack issues safely in this demo.
		RespondWithError(w, r, http.StatusInternalServerError, "Payment initialization failed:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to encode response", nil)
	}
}

func (h *AcademyHandler) HandlePaystackWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	// Paystack requires raw body to verify HMAC signature
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Cannot read body", nil)
		return
	}
	defer r.Body.Close()

	signature := r.Header.Get("x-paystack-signature")
	if signature == "" {
		RespondWithError(w, r, http.StatusUnauthorized, "Missing signature", nil)
		return
	}

	err = h.svc.ProcessWebhook(r.Context(), signature, bodyBytes)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Webhook processing failed:", err)
		return
	}

	// Send generic 200 OK so Paystack knows we've received it successfully.
	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleGetAdminApplications(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	apps, err := h.svc.GetAdminApplications(r.Context())
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to retrieve applications:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(apps); err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to encode response", nil)
	}
}

func (h *AcademyHandler) HandleGrantScholarship(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	idStr := r.PathValue("id")
	appID, err := uuid.Parse(idStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid application ID", nil)
		return
	}

	var req domain.GrantScholarshipRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	if req.AmountNaira <= 0 {
		RespondWithError(w, r, http.StatusBadRequest, "Scholarship amount must be greater than zero", nil)
		return
	}

	amountKobo := req.AmountNaira * 100

	err = h.svc.GrantScholarship(r.Context(), appID, amountKobo)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Scholarship granted successfully"})
}

func (h *AcademyHandler) HandleGetSession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
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
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var req domain.AcademyLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	if req.Email == "" || req.Password == "" {
		RespondWithError(w, r, http.StatusBadRequest, "Missing required fields", nil)
		return
	}

	resp, err := h.svc.LoginStudent(r.Context(), &req)
	if err != nil {
		slog.Warn("Student login failed", "email", req.Email, "error", err)
		RespondWithError(w, r, http.StatusUnauthorized, "An error occurred", err)
		return
	}

	slog.Info("Student logged in successfully", "email", req.Email)

	// Set HttpOnly cookie for the student token
	http.SetCookie(w, &http.Cookie{
		Name:     "academy_token",
		Value:    resp.Token,
		Path:     "/",
		HttpOnly: true,
		Secure:   true, // Should be true in production
		SameSite: http.SameSiteLaxMode,
		MaxAge:   15 * 60, // 15 minutes
	})

	// Set refresh token cookie
	if resp.RefreshToken != "" {
		http.SetCookie(w, &http.Cookie{
			Name:     "academy_refresh_token",
			Value:    resp.RefreshToken,
			Path:     "/",
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteLaxMode,
			MaxAge:   7 * 24 * 60 * 60, // 7 days
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	// Return metadata and tokens (required by frontend server actions)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":        true,
		"is_first_login": resp.IsFirstLogin,
		"token":          resp.Token,
		"refresh_token":  resp.RefreshToken,
	})
}

func (h *AcademyHandler) HandleRefreshStudentToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	cookie, err := r.Cookie("academy_refresh_token")
	if err != nil {
		writeJSONError(w, "Missing refresh token", http.StatusUnauthorized)
		return
	}

	resp, newRefreshToken, err := h.svc.RefreshStudentToken(r.Context(), cookie.Value)
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Set new cookies
	http.SetCookie(w, &http.Cookie{
		Name:     "academy_token",
		Value:    resp.Token,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   15 * 60,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "academy_refresh_token",
		Value:    newRefreshToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   7 * 24 * 60 * 60,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":       true,
		"token":         resp.Token,
		"refresh_token": newRefreshToken,
	})
}

func (h *AcademyHandler) HandleAcademyLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
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

	// Clear both cookies
	http.SetCookie(w, &http.Cookie{
		Name:     "academy_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "academy_refresh_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})

	// Revoke refresh token family if present
	if rtCookie, err := r.Cookie("academy_refresh_token"); err == nil {
		_ = h.svc.RevokeRefreshTokens(r.Context(), rtCookie.Value)
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully"})
}

func (h *AcademyHandler) HandleAcademyChangePassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var req domain.AcademyChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized session", nil)
		return
	}

	stID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student ID formatted", nil)
		return
	}

	err = h.svc.ChangePassword(r.Context(), stID, &req)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to change password:", err)
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
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var req domain.AcademyForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	err := h.svc.ForgotPassword(r.Context(), &req)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "If the email exists, a reset instruction has been sent."})
}

func (h *AcademyHandler) HandleAcademyResetPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var req domain.AcademyResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	err := h.svc.ResetPassword(r.Context(), &req)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "An error occurred", err)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Password reset successfully"})
}

// Phase 4 handlers

func (h *AcademyHandler) HandleGetCurriculum(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	cohortIDStr := r.URL.Query().Get("cohort_id")
	cohortID := 1 // default master cohort
	if cohortIDStr != "" {
		if id, err := strconv.Atoi(cohortIDStr); err == nil {
			cohortID = id
		}
	}

	weeks, err := h.svc.GetCurriculum(r.Context(), cohortID)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to get curriculum:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(weeks)
}

func (h *AcademyHandler) HandleUpdateWeek(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var req domain.UpdateWeekRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	err := h.svc.UpdateCohortWeek(r.Context(), &req)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to update week:", err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleAdminCloneCohort(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var req domain.AdminCloneCohortRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	if req.NewCohortName == "" || req.SourceCohortID == 0 {
		RespondWithError(w, r, http.StatusBadRequest, "Missing required fields", nil)
		return
	}

	err := h.svc.AdminCloneCohort(r.Context(), &req)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to clone cohort:", err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Cohort cloned successfully"})
}

func (h *AcademyHandler) HandleGetSubmissions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	subs, err := h.svc.GetAdminSubmissions(r.Context())
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to fetch submissions:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(subs)
}

func (h *AcademyHandler) HandleGradeSubmission(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var req domain.GradeAssignmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	err := h.svc.GradeSubmission(r.Context(), &req)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to grade submission:", err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleGetStudentDashboard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized session", nil)
		return
	}

	stID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student ID formatted", nil)
		return
	}

	data, err := h.svc.GetStudentDashboardData(r.Context(), stID)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to fetch dashboard data:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func (h *AcademyHandler) HandleSubmitAssignment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized session", nil)
		return
	}

	stID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student ID formatted", nil)
		return
	}

	var req domain.SubmitAssignmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	err = h.svc.SubmitAssignment(r.Context(), stID, &req)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Submission failed:", err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleGetUploadURL(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized session", nil)
		return
	}

	stID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student ID formatted", nil)
		return
	}

	filename := r.URL.Query().Get("filename")
	if filename == "" {
		RespondWithError(w, r, http.StatusBadRequest, "Missing filename parameter", nil)
		return
	}

	uploadType := r.URL.Query().Get("type") // e.g. "avatar" or blank for assignments

	url, key, err := h.svc.GeneratePresignedUploadURL(r.Context(), stID, filename, uploadType)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to generate upload URL:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"upload_url": url,
		"file_key":   key,
	})
}

func (h *AcademyHandler) HandleAdminGetUploadURL(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	filename := r.URL.Query().Get("filename")
	if filename == "" {
		RespondWithError(w, r, http.StatusBadRequest, "Missing filename parameter", nil)
		return
	}

	uploadType := r.URL.Query().Get("type")

	// Use a fixed UUID for admin uploads so they are grouped together
	adminID := uuid.MustParse("00000000-0000-0000-0000-000000000000")
	url, key, err := h.svc.GeneratePresignedUploadURL(r.Context(), adminID, filename, uploadType)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to generate upload URL:", err)
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
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	fileKey := r.URL.Query().Get("key")
	if fileKey == "" {
		RespondWithError(w, r, http.StatusBadRequest, "Missing key parameter", nil)
		return
	}

	url, err := h.svc.GeneratePresignedDownloadURL(r.Context(), fileKey)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to generate download URL:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"download_url": url,
	})
}

// HandleGetAvatarURL is a public endpoint that resolves a presigned download URL
// for avatar images only (keys must start with "avatars/"). No auth required.
func (h *AcademyHandler) HandleGetAvatarURL(w http.ResponseWriter, r *http.Request) {
	fileKey := r.URL.Query().Get("key")
	if fileKey == "" {
		RespondWithError(w, r, http.StatusBadRequest, "Missing key parameter", nil)
		return
	}
	if len(fileKey) < 8 || fileKey[:8] != "avatars/" {
		RespondWithError(w, r, http.StatusForbidden, "Invalid key: must be an avatar key", nil)
		return
	}

	url, err := h.svc.GeneratePresignedDownloadURL(r.Context(), fileKey)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to generate avatar URL:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "public, max-age=300") // presigned URLs last 5min, cache for same
	json.NewEncoder(w).Encode(map[string]string{
		"download_url": url,
	})
}

// Phase 5: Break-It Labs Handlers

func (h *AcademyHandler) HandleListLabs(w http.ResponseWriter, r *http.Request) {
	labs, err := h.svc.ListLabs(r.Context())
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to fetch labs:", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(labs)
}

func (h *AcademyHandler) HandleGetLab(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid lab ID", nil)
		return
	}

	lab, err := h.svc.GetLab(r.Context(), id)
	if err != nil {
		RespondWithError(w, r, http.StatusNotFound, "Lab not found:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lab)
}

func (h *AcademyHandler) HandleSubmitLabFix(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid lab ID", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	stID, _ := uuid.Parse(studentIDStr)

	var req domain.SubmitLabFixRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid body", nil)
		return
	}
	req.LabID = id

	err = h.svc.SubmitLabFix(r.Context(), stID, &req)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleAddSubmissionComment(w http.ResponseWriter, r *http.Request) {
	subIDStr := r.PathValue("id")
	subID, err := strconv.Atoi(subIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid submission ID", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	stID, _ := uuid.Parse(studentIDStr)

	var req domain.SubmissionCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid body", nil)
		return
	}

	err = h.svc.AddSubmissionComment(r.Context(), stID, subID, req.Body)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (h *AcademyHandler) HandleAdminCreateLab(w http.ResponseWriter, r *http.Request) {
	var lab domain.BreakItLab
	if err := json.NewDecoder(r.Body).Decode(&lab); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid body", nil)
		return
	}
	err := h.svc.AdminCreateLab(r.Context(), &lab)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (h *AcademyHandler) HandleAdminUpdateLab(w http.ResponseWriter, r *http.Request) {
	var lab domain.BreakItLab
	if err := json.NewDecoder(r.Body).Decode(&lab); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid body", nil)
		return
	}
	err := h.svc.AdminUpdateLab(r.Context(), &lab)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleAdminDeleteLab(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, _ := strconv.Atoi(idStr)
	err := h.svc.AdminDeleteLab(r.Context(), id)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}

	if adminID, ok := r.Context().Value(middleware.UserIDKey).(int); ok {
		ip := r.RemoteAddr
		ua := r.UserAgent()
		h.auditSvc.LogAction(r.Context(), strconv.Itoa(adminID), "admin", "delete_lab", "break_it_lab", &idStr, nil, &ip, &ua)
	}

	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleAdminSetLabWinner(w http.ResponseWriter, r *http.Request) {
	var req domain.SetLabWinnerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid body", nil)
		return
	}
	err := h.svc.AdminSetLabWinner(r.Context(), &req)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// Phase 6: Alumni Hall of Fame

func (h *AcademyHandler) HandleListAllStudents(w http.ResponseWriter, r *http.Request) {
	students, err := h.svc.ListAllStudents(r.Context())
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(students)
}

func (h *AcademyHandler) HandleSearchStudents(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	students, err := h.svc.SearchStudents(r.Context(), q)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(students)
}

func (h *AcademyHandler) HandleWarnStudent(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "invalid student id", nil)
		return
	}

	var req domain.WarnStudentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "invalid request body", nil)
		return
	}

	if err := h.svc.AdminWarnStudent(r.Context(), id, req.Reason); err != nil {
		slog.Error("Failed to issue warning to student", "student_id", id, "error", err)
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	
	adminID, _ := r.Context().Value(middleware.UserIDKey).(int)
	slog.Info("Admin issued warning to student", "admin_id", adminID, "student_id", id, "reason", req.Reason)
	w.WriteHeader(http.StatusNoContent)
}

func (h *AcademyHandler) HandleDisqualifyStudent(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "invalid student id", nil)
		return
	}

	var req domain.DisqualifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "An error occurred", err)
		return
	}

	if err := h.svc.AdminDisqualifyStudent(r.Context(), id, req.Reason); err != nil {
		slog.Error("Failed to disqualify student", "student_id", id, "error", err)
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}

	if adminID, ok := r.Context().Value(middleware.UserIDKey).(int); ok {
		slog.Info("Admin disqualified student", "admin_id", adminID, "student_id", id, "reason", req.Reason)
		ip := r.RemoteAddr
		ua := r.UserAgent()
		idStr := id.String()
		details := map[string]string{"reason": req.Reason}
		h.auditSvc.LogAction(r.Context(), strconv.Itoa(adminID), "admin", "disqualify_student", "student", &idStr, details, &ip, &ua)
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *AcademyHandler) HandleSubmitCapstone(w http.ResponseWriter, r *http.Request) {
	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized session", nil)
		return
	}
	studentID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student ID", nil)
		return
	}

	var req domain.CapstoneProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "An error occurred", err)
		return
	}

	if err := h.svc.SubmitCapstone(r.Context(), studentID, &req); err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (h *AcademyHandler) HandleGetStudentCapstone(w http.ResponseWriter, r *http.Request) {
	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized session", nil)
		return
	}
	studentID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student ID", nil)
		return
	}

	cap, err := h.svc.GetStudentCapstone(r.Context(), studentID)
	if err != nil {
		if strings.Contains(err.Error(), "no rows in result set") {
			RespondWithError(w, r, http.StatusNotFound, "Not found", nil)
			return
		}
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cap)
}

func (h *AcademyHandler) HandleListPendingCapstones(w http.ResponseWriter, r *http.Request) {
	caps, err := h.svc.GetPendingCapstones(r.Context())
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(caps)
}

func (h *AcademyHandler) HandleGetCapstone(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid capstone ID", nil)
		return
	}

	cap, err := h.svc.GetCapstoneByID(r.Context(), id)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cap)
}

func (h *AcademyHandler) HandleApproveCapstone(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, _ := strconv.Atoi(idStr)

	var req domain.ApproveCapstoneRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "An error occurred", err)
		return
	}

	if err := h.svc.ApproveCapstone(r.Context(), id, &req); err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *AcademyHandler) HandleRejectCapstone(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid capstone ID", nil)
		return
	}

	var req domain.RejectCapstoneRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "An error occurred", err)
		return
	}

	if err := h.svc.RejectCapstone(r.Context(), id, req.Feedback); err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *AcademyHandler) HandleRevokeAlumni(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		RespondWithError(w, r, http.StatusBadRequest, "Slug is required", nil)
		return
	}

	if err := h.svc.RevokeAlumni(r.Context(), slug); err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *AcademyHandler) HandleManualCreateAlumni(w http.ResponseWriter, r *http.Request) {
	var req domain.ManualAlumniRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid body", nil)
		return
	}

	err := h.svc.ManualCreateAlumni(r.Context(), &req)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (h *AcademyHandler) HandleAdminUpdateAlumni(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid alumni ID", nil)
		return
	}

	var req domain.GraduateStudentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid body", nil)
		return
	}

	err = h.svc.AdminUpdateAlumni(r.Context(), id, &req)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleGetEligibleStudents(w http.ResponseWriter, r *http.Request) {
	students, err := h.svc.GetEligibleStudents(r.Context())
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(students)
}

func (h *AcademyHandler) HandleListAlumni(w http.ResponseWriter, r *http.Request) {
	alumni, err := h.svc.ListAlumni(r.Context())
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(alumni)
}

func (h *AcademyHandler) HandleGetAlumniPortfolio(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	portfolio, err := h.svc.GetAlumniPortfolio(r.Context(), slug)
	if err != nil {
		RespondWithError(w, r, http.StatusNotFound, "Portfolio not found", nil)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(portfolio)
}

// Class Sessions

func (h *AcademyHandler) HandleCreateClassSession(w http.ResponseWriter, r *http.Request) {
	var sess domain.ClassSession
	if err := json.NewDecoder(r.Body).Decode(&sess); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	err := h.svc.AdminCreateClassSession(r.Context(), &sess)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to create session:", err)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *AcademyHandler) HandleUpdateClassSession(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid session ID", nil)
		return
	}

	var sess domain.ClassSession
	if err := json.NewDecoder(r.Body).Decode(&sess); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request body", nil)
		return
	}
	sess.ID = id

	err = h.svc.AdminUpdateClassSession(r.Context(), &sess)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to update session:", err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *AcademyHandler) HandleDeleteClassSession(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid session ID", nil)
		return
	}

	err = h.svc.AdminDeleteClassSession(r.Context(), id)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to delete session:", err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// ─── Billing & Installments ───────────────────────────────────────────────────

// HandleGetBillingStatus returns the student's billing ledger state.
// GET /api/v1/academy/billing
func (h *AcademyHandler) HandleGetBillingStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
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
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
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
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
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
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
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
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
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
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
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
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
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
		slog.Error("Failed to update student status", "student_id", studentID, "error", err)
		writeJSONError(w, "Failed to update student status: "+err.Error(), http.StatusInternalServerError)
		return
	}

	adminID, _ := r.Context().Value(middleware.UserIDKey).(int)
	slog.Info("Admin updated student status", "admin_id", adminID, "student_id", studentID, "academic_status", req.AcademicStatus, "manually_locked", req.IsManuallyLocked)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (h *AcademyHandler) HandleJoinSession(w http.ResponseWriter, r *http.Request) {
	sessionID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid session ID", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	studentID, _ := uuid.Parse(studentIDStr)

	redirectURL, err := h.svc.JoinSession(r.Context(), studentID, sessionID)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}

	http.Redirect(w, r, redirectURL, http.StatusFound)
}

func (h *AcademyHandler) HandleGetStudentAttendanceHistory(w http.ResponseWriter, r *http.Request) {
	studentID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student ID", nil)
		return
	}

	history, err := h.svc.GetStudentAttendanceHistory(r.Context(), studentID)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(history)
}

func (h *AcademyHandler) HandleGetSessionAttendance(w http.ResponseWriter, r *http.Request) {
	sessionID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid session ID", nil)
		return
	}

	students, err := h.svc.GetSessionAttendance(r.Context(), sessionID)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(students)
}

func (h *AcademyHandler) HandleBroadcastReschedule(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid body", nil)
		return
	}

	if req.Reason == "" {
		RespondWithError(w, r, http.StatusBadRequest, "Reason is required", nil)
		return
	}

	err := h.svc.BroadcastReschedule(r.Context(), req.Reason)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "An error occurred", err)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Broadcast sent successfully"})
}


// ─── Student Profile ─────────────────────────────────────────────────────────

func (h *AcademyHandler) HandleGetStudentProfile(w http.ResponseWriter, r *http.Request) {
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

	profile, err := h.svc.GetStudentProfile(r.Context(), studentID)
	if err != nil {
		writeJSONError(w, "Failed to retrieve profile: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}

func (h *AcademyHandler) HandleUpdateStudentProfile(w http.ResponseWriter, r *http.Request) {
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

	var req domain.StudentProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if err := h.svc.UpdateStudentProfile(r.Context(), studentID, &req); err != nil {
		writeJSONError(w, "Failed to update profile: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (h *AcademyHandler) HandleUpdateStudentPreferences(w http.ResponseWriter, r *http.Request) {
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

	var req domain.UpdatePreferencesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if err := h.svc.UpdateStudentPreferences(r.Context(), studentID, &req); err != nil {
		writeJSONError(w, "Failed to update preferences: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (h *AcademyHandler) HandleRequestEmailChange(w http.ResponseWriter, r *http.Request) {
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

	var req domain.RequestEmailChangeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if err := h.svc.RequestEmailChange(r.Context(), studentID, &req); err != nil {
		writeJSONError(w, "Failed to request email change: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success", "message": "Verification email sent"})
}

func (h *AcademyHandler) HandleConfirmEmailChange(w http.ResponseWriter, r *http.Request) {
	var req domain.ConfirmEmailChangeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if err := h.svc.ConfirmEmailChange(r.Context(), &req); err != nil {
		writeJSONError(w, "Failed to confirm email change: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// ─── Notifications ─────────────────────────────────────────────────────────────

func (h *AcademyHandler) HandleGetUnreadNotifications(w http.ResponseWriter, r *http.Request) {
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

	notifs, err := h.svc.GetUnreadNotifications(r.Context(), studentID.String())
	if err != nil {
		writeJSONError(w, "Failed to fetch notifications", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notifs)
}

func (h *AcademyHandler) HandleMarkNotificationRead(w http.ResponseWriter, r *http.Request) {
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

	// Extract notification ID from URL path value
	notifIDStr := r.PathValue("id")
	notifID, err := uuid.Parse(notifIDStr)
	if err != nil {
		writeJSONError(w, "Invalid notification ID", http.StatusBadRequest)
		return
	}

	if err := h.svc.MarkNotificationRead(r.Context(), notifID, studentID.String()); err != nil {
		writeJSONError(w, "Failed to mark notification as read", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (h *AcademyHandler) HandleMarkAllNotificationsRead(w http.ResponseWriter, r *http.Request) {
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

	if err := h.svc.MarkAllNotificationsRead(r.Context(), studentID.String()); err != nil {
		writeJSONError(w, "Failed to mark all notifications as read", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (h *AcademyHandler) HandleBroadcastEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSONError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cohortIDStr := r.PathValue("id")
	if cohortIDStr == "" {
		writeJSONError(w, "Cohort ID is required", http.StatusBadRequest)
		return
	}

	cohortID, err := strconv.Atoi(cohortIDStr)
	if err != nil {
		writeJSONError(w, "Invalid cohort ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Subject string `json:"subject"`
		Body    string `json:"body"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Subject == "" || req.Body == "" {
		writeJSONError(w, "Subject and body are required", http.StatusBadRequest)
		return
	}

	err = h.svc.BroadcastEmailToCohort(r.Context(), cohortID, req.Subject, req.Body)
	if err != nil {
		slog.Error("Failed to broadcast email", "cohort_id", cohortID, "error", err)
		writeJSONError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	adminID, _ := r.Context().Value(middleware.UserIDKey).(int)
	slog.Info("Admin dispatched broadcast email", "admin_id", adminID, "cohort_id", cohortID, "subject", req.Subject)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// ─── War Room (Discussion Forum) Handlers ──────────────────────────────────────

func (h *AcademyHandler) HandleGetThreads(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	studentID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student session", nil)
		return
	}

	category := r.URL.Query().Get("category")
	search := r.URL.Query().Get("search")

	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 10
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
			if limit > 50 {
				limit = 50
			}
		}
	}

	offset := 0
	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	threads, err := h.svc.GetThreads(r.Context(), studentID, category, search, limit, offset)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to retrieve threads", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(threads)
}

func (h *AcademyHandler) HandleCreateThread(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	studentID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student session", nil)
		return
	}

	var req domain.CreateThreadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	thread, err := h.svc.CreateThread(r.Context(), studentID, &req)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, err.Error(), err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(thread)
}

func (h *AcademyHandler) HandleGetThread(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	idStr := r.PathValue("id")
	threadID, err := uuid.Parse(idStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid thread ID", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	studentID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student session", nil)
		return
	}

	thread, replies, err := h.svc.GetThreadByID(r.Context(), studentID, threadID)
	if err != nil {
		RespondWithError(w, r, http.StatusNotFound, "Thread not found", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"thread":  thread,
		"replies": replies,
	})
}

func (h *AcademyHandler) HandleCreateReply(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	threadIDStr := r.PathValue("id")
	threadID, err := uuid.Parse(threadIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid thread ID", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	studentID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student session", nil)
		return
	}

	var req domain.CreateReplyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	reply, err := h.svc.CreateReply(r.Context(), studentID, threadID, &req)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, err.Error(), err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reply)
}

func (h *AcademyHandler) HandleEndorseReply(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	replyIDStr := r.PathValue("id")
	replyID, err := uuid.Parse(replyIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid reply ID", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	studentID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student session", nil)
		return
	}

	err = h.svc.EndorseReply(r.Context(), studentID, replyID)
	if err != nil {
		// Handled as 403 Forbidden or 400 Bad Request depending on exact failure
		RespondWithError(w, r, http.StatusForbidden, err.Error(), err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success", "message": "Reply verified successfully"})
}

func (h *AcademyHandler) HandleDeleteReply(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	replyIDStr := r.PathValue("id")
	replyID, err := uuid.Parse(replyIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid reply ID", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	studentID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student session", nil)
		return
	}

	err = h.svc.DeleteReply(r.Context(), studentID, replyID)
	if err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			RespondWithError(w, r, http.StatusForbidden, err.Error(), err)
		} else {
			RespondWithError(w, r, http.StatusBadRequest, err.Error(), err)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *AcademyHandler) HandleUpdateThread(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	threadIDStr := r.PathValue("id")
	threadID, err := uuid.Parse(threadIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid thread ID", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	studentID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student session", nil)
		return
	}

	var req struct {
		Title    string `json:"title"`
		Content  string `json:"content"`
		Category string `json:"category"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	thread, err := h.svc.UpdateThread(r.Context(), studentID, threadID, req.Title, req.Content, req.Category)
	if err != nil {
		if err.Error() == "unauthorized: you can only edit your own threads" {
			RespondWithError(w, r, http.StatusForbidden, err.Error(), err)
		} else {
			RespondWithError(w, r, http.StatusBadRequest, err.Error(), err)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(thread)
}

func (h *AcademyHandler) HandleDeleteThread(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	threadIDStr := r.PathValue("id")
	threadID, err := uuid.Parse(threadIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid thread ID", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	studentID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student session", nil)
		return
	}

	err = h.svc.DeleteThread(r.Context(), studentID, threadID)
	if err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			RespondWithError(w, r, http.StatusForbidden, err.Error(), err)
		} else {
			RespondWithError(w, r, http.StatusBadRequest, err.Error(), err)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *AcademyHandler) HandleUpdateReply(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	replyIDStr := r.PathValue("id")
	replyID, err := uuid.Parse(replyIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid reply ID", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	studentID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student session", nil)
		return
	}

	var req struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	reply, err := h.svc.UpdateReply(r.Context(), studentID, replyID, req.Content)
	if err != nil {
		if err.Error() == "unauthorized: you can only edit your own replies" {
			RespondWithError(w, r, http.StatusForbidden, err.Error(), err)
		} else {
			RespondWithError(w, r, http.StatusBadRequest, err.Error(), err)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(reply)
}

func (h *AcademyHandler) HandleToggleThreadReaction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	threadIDStr := r.PathValue("id")
	threadID, err := uuid.Parse(threadIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid thread ID", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	studentID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student session", nil)
		return
	}

	var req struct {
		ReactionType string `json:"reaction_type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request body", nil)
		return
	}
	if req.ReactionType == "" {
		RespondWithError(w, r, http.StatusBadRequest, "Reaction type is required", nil)
		return
	}

	liked, counts, err := h.svc.ToggleThreadReaction(r.Context(), studentID, threadID, req.ReactionType)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, err.Error(), err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"liked":           liked,
		"reaction_counts": counts,
	})
}

func (h *AcademyHandler) HandleToggleReplyReaction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	replyIDStr := r.PathValue("id")
	replyID, err := uuid.Parse(replyIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid reply ID", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	studentID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid student session", nil)
		return
	}

	var req struct {
		ReactionType string `json:"reaction_type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request body", nil)
		return
	}
	if req.ReactionType == "" {
		RespondWithError(w, r, http.StatusBadRequest, "Reaction type is required", nil)
		return
	}

	liked, counts, err := h.svc.ToggleReplyReaction(r.Context(), studentID, replyID, req.ReactionType)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, err.Error(), err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"liked":           liked,
		"reaction_counts": counts,
	})
}


