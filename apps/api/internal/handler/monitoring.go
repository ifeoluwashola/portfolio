package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"runtime"
	"strings"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/middleware"
)

type MonitoringHandler struct {
	auditSvc  domain.AuditService
	logBuffer *middleware.RingBuffer
}

func NewMonitoringHandler(auditSvc domain.AuditService, logBuffer *middleware.RingBuffer) *MonitoringHandler {
	return &MonitoringHandler{
		auditSvc:  auditSvc,
		logBuffer: logBuffer,
	}
}

func (h *MonitoringHandler) HandleGetMetrics(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	metrics := map[string]interface{}{
		"goroutines": runtime.NumGoroutine(),
		"alloc_mb":   m.Alloc / 1024 / 1024,
		"sys_mb":     m.Sys / 1024 / 1024,
		"num_gc":     m.NumGC,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

func (h *MonitoringHandler) HandleGetLogs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	lines := h.logBuffer.GetLines()

	// Parse JSON lines back to objects for the frontend if they are JSON,
	// otherwise just send as strings. The frontend can parse it.
	parsedLines := make([]interface{}, 0, len(lines))
	for _, line := range lines {
		if strings.HasPrefix(strings.TrimSpace(line), "{") {
			var obj map[string]interface{}
			if err := json.Unmarshal([]byte(line), &obj); err == nil {
				parsedLines = append(parsedLines, obj)
				continue
			}
		}
		// If not valid JSON or not JSON format, send as raw string map
		parsedLines = append(parsedLines, map[string]string{"raw": line})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(parsedLines)
}

func (h *MonitoringHandler) HandleGetAuditLogs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, r, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	query := r.URL.Query().Get("query")
	hoursStr := r.URL.Query().Get("hours")
	hours := 0
	if hoursStr != "" {
		fmt.Sscanf(hoursStr, "%d", &hours)
	}

	logs, err := h.auditSvc.GetRecentAuditLogs(r.Context(), 100, query, hours)
	if err != nil {
		RespondWithError(w, r, http.StatusInternalServerError, "Failed to retrieve audit logs:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}
