package handler

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
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
