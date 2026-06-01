package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

// ErrorResponse represents a generic error response
type ErrorResponse struct {
	Error string `json:"error"`
}

// RespondWithError logs the internal error and sends a safe JSON message to the client
func RespondWithError(w http.ResponseWriter, r *http.Request, statusCode int, clientMessage string, internalErr error) {
	if internalErr != nil {
		slog.ErrorContext(r.Context(), "HTTP Request Error",
			slog.String("path", r.URL.Path),
			slog.String("method", r.Method),
			slog.String("client_message", clientMessage),
			slog.String("internal_error", internalErr.Error()),
			slog.Int("status", statusCode),
		)
	} else {
		slog.ErrorContext(r.Context(), "HTTP Request Error",
			slog.String("path", r.URL.Path),
			slog.String("method", r.Method),
			slog.String("client_message", clientMessage),
			slog.Int("status", statusCode),
		)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(ErrorResponse{Error: clientMessage})
}
