package handler

import (
	"encoding/json"
	"net/http"
	
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
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
		http.Error(w, "Slug is required", http.StatusBadRequest)
		return
	}

	metrics, comments, err := h.blogService.GetPostData(slug)
	if err != nil {
		http.Error(w, "Failed to fetch post data", http.StatusInternalServerError)
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
		http.Error(w, "Slug is required", http.StatusBadRequest)
		return
	}

	if err := h.blogService.RegisterView(slug); err != nil {
		http.Error(w, "Failed to register view", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"success"}`))
}

// RegisterLike handles POST /api/blog/{slug}/like
func (h *BlogHandler) RegisterLike(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		http.Error(w, "Slug is required", http.StatusBadRequest)
		return
	}

	if err := h.blogService.RegisterLike(slug); err != nil {
		http.Error(w, "Failed to register like", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"success"}`))
}

// LeaveComment handles POST /api/blog/{slug}/comment
func (h *BlogHandler) LeaveComment(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		http.Error(w, "Slug is required", http.StatusBadRequest)
		return
	}

	var req struct {
		DisplayName string `json:"display_name"`
		Content     string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if req.DisplayName == "" || req.Content == "" {
		http.Error(w, "Display name and content are required", http.StatusBadRequest)
		return
	}

	comment, err := h.blogService.LeaveComment(slug, req.DisplayName, req.Content)
	if err != nil {
		http.Error(w, "Failed to leave comment", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(comment)
}

// GetAdminStats handles GET /api/admin/blog/stats
func (h *BlogHandler) GetAdminStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.blogService.GetAdminStats()
	if err != nil {
		http.Error(w, "Failed to fetch admin stats", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
