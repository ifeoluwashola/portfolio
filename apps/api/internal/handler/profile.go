package handler

import (
	"encoding/json"
	"net/http"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
)

type ProfileHandler struct {
	service domain.ProfileService
}

func NewProfileHandler(service domain.ProfileService) *ProfileHandler {
	return &ProfileHandler{
		service: service,
	}
}

func (h *ProfileHandler) HandleGetProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	profile, err := h.service.GetProfile(r.Context())
	if err != nil {
		writeJSONError(w, "Failed to retrieve profile", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(profile)
}

func (h *ProfileHandler) HandleUpsertProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut && r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var profile domain.Profile
	if err := json.NewDecoder(r.Body).Decode(&profile); err != nil {
		writeJSONError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err := h.service.UpsertProfile(r.Context(), &profile)
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Profile updated successfully",
	})
}
