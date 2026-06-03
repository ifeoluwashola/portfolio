package handler

import (
	"encoding/json"
	"html"
	"net/http"
	"strconv"
	
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/middleware"
	"github.com/google/uuid"
)

type BlogHandler struct {
	blogService domain.BlogService
}

func NewBlogHandler(blogService domain.BlogService) *BlogHandler {
	return &BlogHandler{blogService: blogService}
}

// GetPostData handles GET /api/blog/{slug}
func (h *BlogHandler) GetPostData(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		RespondWithError(w, r, http.StatusBadRequest, "Slug is required", nil)
		return
	}

	metrics, comments, err := h.blogService.GetPostData(slug)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to fetch post data", nil)
		return
	}

	response := map[string]interface{}{
		"views":    metrics.Views,
		"likes":    metrics.Likes,
		"comments": comments,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// RegisterView handles POST /api/blog/{slug}/view
func (h *BlogHandler) RegisterView(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		RespondWithError(w, r, http.StatusBadRequest, "Slug is required", nil)
		return
	}

	if err := h.blogService.RegisterView(slug); err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to register view", nil)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"success"}`))
}

// RegisterLike handles POST /api/blog/{slug}/like
func (h *BlogHandler) RegisterLike(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		RespondWithError(w, r, http.StatusBadRequest, "Slug is required", nil)
		return
	}

	if err := h.blogService.RegisterLike(slug); err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to register like", nil)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"success"}`))
}

// LeaveComment handles POST /api/blog/{slug}/comment
func (h *BlogHandler) LeaveComment(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		RespondWithError(w, r, http.StatusBadRequest, "Slug is required", nil)
		return
	}

	var req struct {
		DisplayName string `json:"display_name"`
		Content     string `json:"content"`
		ParentID    *int   `json:"parent_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	if req.DisplayName == "" || req.Content == "" {
		RespondWithError(w, r, http.StatusBadRequest, "Display name and content are required", nil)
		return
	}

	var studentIDPtr *uuid.UUID
	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if ok && studentIDStr != "" {
		id, err := uuid.Parse(studentIDStr)
		if err == nil {
			studentIDPtr = &id
		}
	}

	// Sanitize inputs to prevent stored XSS
	sanitizedName := html.EscapeString(req.DisplayName)
	sanitizedContent := html.EscapeString(req.Content)

	comment, err := h.blogService.LeaveComment(slug, sanitizedName, sanitizedContent, studentIDPtr, req.ParentID)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to leave comment", nil)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(comment)
}

// LikeComment handles POST /api/blog/comments/{id}/like
func (h *BlogHandler) LikeComment(w http.ResponseWriter, r *http.Request) {
	commentIDStr := r.PathValue("id")
	if commentIDStr == "" {
		RespondWithError(w, r, http.StatusBadRequest, "Comment ID is required", nil)
		return
	}
	
	commentID, err := strconv.Atoi(commentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusBadRequest, "Invalid Comment ID", nil)
		return
	}

	studentIDStr, ok := r.Context().Value(middleware.StudentIDKey).(string)
	if !ok || studentIDStr == "" {
		RespondWithError(w, r, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	studentID, err := uuid.Parse(studentIDStr)
	if err != nil {
		RespondWithError(w, r, http.StatusUnauthorized, "Invalid Student ID", nil)
		return
	}

	if err := h.blogService.LikeComment(commentID, studentID); err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to like comment", nil)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"success"}`))
}

// GetAdminStats handles GET /api/admin/blog/stats
func (h *BlogHandler) GetAdminStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.blogService.GetAdminStats()
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to fetch admin stats", nil)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
