package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/service"
)

type ContactHandler struct {
	service  domain.ContactService
	notifier service.Notifier
}

func NewContactHandler(service domain.ContactService, notifier service.Notifier) *ContactHandler {
	return &ContactHandler{
		service:  service,
		notifier: notifier,
	}
}

func (h *ContactHandler) HandleSubmitContact(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var lead domain.ContactLead
	if err := json.NewDecoder(r.Body).Decode(&lead); err != nil {
		writeJSONError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err := h.service.ProcessNewLead(r.Context(), &lead)
	if err != nil {
		// Differentiate between validation errors and server errors if desired.
		// For simplicity, treating as bad request if validation fails (which service returns simple err for).
		writeJSONError(w, err.Error(), http.StatusBadRequest)
		return
	}

	go func(l domain.ContactLead) {
		if h.notifier != nil {
			if nErr := h.notifier.SendNotification(&l); nErr != nil {
				log.Printf("Failed to send notification email for lead %d: %v", l.ID, nErr)
			}
		}
	}(lead)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Consultation request received successfully.",
		"lead_id": lead.ID,
	})
}

func (h *ContactHandler) HandleGetContacts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	contacts, err := h.service.GetContacts(r.Context())
	if err != nil {
		writeJSONError(w, "Failed to retrieve contacts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(contacts)
}

func (h *ContactHandler) HandleGetContactByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		writeJSONError(w, "Invalid contact ID", http.StatusBadRequest)
		return
	}

	contact, err := h.service.GetContactByID(r.Context(), id)
	if err != nil {
		writeJSONError(w, "Failed to retrieve contact: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(contact)
}

func writeJSONError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{
		"error": message,
	})
}
