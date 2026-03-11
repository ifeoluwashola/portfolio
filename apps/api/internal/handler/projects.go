package handler

import (
	"encoding/json"
	"net/http"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
)

type ProjectHandler struct {
	service domain.ProjectService
}

func NewProjectHandler(service domain.ProjectService) *ProjectHandler {
	return &ProjectHandler{
		service: service,
	}
}

func (h *ProjectHandler) HandleGetGuardrailStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	stats, err := h.service.GetGuardrailStats(r.Context())
	if err != nil {
		writeJSONError(w, "Failed to retrieve project stats", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(stats)
}
