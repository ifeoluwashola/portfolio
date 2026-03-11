package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
)

type ProjectDataHandler struct {
	service domain.ProjectDataService
}

func NewProjectDataHandler(service domain.ProjectDataService) *ProjectDataHandler {
	return &ProjectDataHandler{
		service: service,
	}
}

func (h *ProjectDataHandler) HandleGetProjects(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	projects, err := h.service.GetProjects(r.Context())
	if err != nil {
		writeJSONError(w, "Failed to retrieve projects", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(projects)
}

func (h *ProjectDataHandler) HandleCreateProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var project domain.Project
	if err := json.NewDecoder(r.Body).Decode(&project); err != nil {
		writeJSONError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err := h.service.CreateProject(r.Context(), &project)
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Project created successfully",
		"project_id": project.ID,
	})
}

func (h *ProjectDataHandler) HandleDeleteProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		writeJSONError(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	err = h.service.DeleteProject(r.Context(), id)
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Project deleted successfully"})
}

func (h *ProjectDataHandler) HandleUpdateProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		writeJSONError(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	var project domain.Project
	if err := json.NewDecoder(r.Body).Decode(&project); err != nil {
		writeJSONError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	project.ID = id // force the ID from the URL path

	err = h.service.UpdateProject(r.Context(), &project)
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Project updated successfully"})
}
