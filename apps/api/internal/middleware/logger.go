package middleware

import (
	"fmt"
	"log/slog"
	"net/http"
	"time"
)

// responseWriter is a wrapper around http.ResponseWriter to capture the status code
type responseWriter struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func wrapResponseWriter(w http.ResponseWriter) *responseWriter {
	return &responseWriter{ResponseWriter: w, status: http.StatusOK}
}

func (rw *responseWriter) WriteHeader(code int) {
	if rw.wroteHeader {
		return
	}
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
	rw.wroteHeader = true
}

// RequestLogger returns a middleware that logs HTTP requests using structured slog
func RequestLogger(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			wrapped := wrapResponseWriter(w)

			// Process request
			next.ServeHTTP(wrapped, r)

			// Log details
			duration := time.Since(start)
			
			level := slog.LevelInfo
			if wrapped.status >= 500 {
				level = slog.LevelError
			} else if wrapped.status >= 400 {
				level = slog.LevelWarn
			}

			var actorID string
			if sID, ok := r.Context().Value(StudentIDKey).(string); ok {
				actorID = "student:" + sID
			} else if uID, ok := r.Context().Value(UserIDKey).(int); ok {
				actorID = fmt.Sprintf("admin:%d", uID)
			}

			args := []slog.Attr{
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
				slog.String("remote_ip", r.RemoteAddr),
				slog.String("user_agent", r.UserAgent()),
				slog.Int("status", wrapped.status),
				slog.Duration("duration", duration),
			}

			if actorID != "" {
				args = append(args, slog.String("actor_id", actorID))
			}

			logger.LogAttrs(r.Context(), level, "HTTP Request", args...)
		})
	}
}
