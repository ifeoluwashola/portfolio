package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
)

type WaitlistHandler struct {
	service domain.WaitlistService
}

func NewWaitlistHandler(service domain.WaitlistService) *WaitlistHandler {
	return &WaitlistHandler{
		service: service,
	}
}

func (h *WaitlistHandler) HandleJoinWaitlist(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSONError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req domain.AddWaitlistRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	lead, err := h.service.JoinWaitlist(r.Context(), &req)
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Successfully joined the waitlist!",
		"lead":    lead,
	})
}

func (h *WaitlistHandler) HandleGetWaitlistLeads(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSONError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 10
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
			if limit > 100 {
				limit = 100
			}
		}
	}

	offset := 0
	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	leads, total, err := h.service.GetWaitlistLeads(r.Context(), limit, offset)
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"leads":  leads,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

func (h *WaitlistHandler) HandleBroadcastToWaitlist(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSONError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req domain.BroadcastRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err := h.service.BroadcastToWaitlist(r.Context(), req.Subject, req.Body)
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Broadcast email dispatched successfully to waitlist.",
	})
}
