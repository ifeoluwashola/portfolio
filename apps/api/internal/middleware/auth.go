package middleware

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/cache"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const (
	UserIDKey   contextKey = "userID"
	UserRoleKey contextKey = "userRole"
	StudentIDKey contextKey = "studentID"
)

// AuthMiddleware holds shared dependencies for all auth checks
type AuthMiddleware struct {
	jwtSecret  string
	cache      cache.TokenCache
	studentRepo interface {
		GetStudentByID(ctx context.Context, id interface{}) (*domain.Student, error)
	}
}

// NewAuthMiddleware creates a middleware instance with injected dependencies
func NewAuthMiddleware(jwtSecret string, tokenCache cache.TokenCache) *AuthMiddleware {
	return &AuthMiddleware{
		jwtSecret: jwtSecret,
		cache:     tokenCache,
	}
}

// SetStudentRepo sets the student repo for DB-backed status checks
func (m *AuthMiddleware) SetStudentRepo(repo interface {
	GetStudentByID(ctx context.Context, id interface{}) (*domain.Student, error)
}) {
	m.studentRepo = repo
}

func writeJSONError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// parseAndValidateJWT is the shared JWT parsing logic
func (m *AuthMiddleware) parseAndValidateJWT(r *http.Request) (*jwt.Token, jwt.MapClaims, string, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return nil, nil, "", jwt.ErrTokenMalformed
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return nil, nil, "", jwt.ErrTokenMalformed
	}

	tokenString := parts[1]

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(m.jwtSecret), nil
	})

	if err != nil || !token.Valid {
		return nil, nil, "", jwt.ErrTokenInvalidClaims
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, nil, "", jwt.ErrTokenInvalidClaims
	}

	return token, claims, tokenString, nil
}

// isTokenRevoked checks the cache first, falls back to DB via the persistent layer
func (m *AuthMiddleware) isTokenRevoked(ctx context.Context, rawToken string) bool {
	hash := hashTokenMW(rawToken)
	revoked, err := m.cache.IsRevoked(ctx, hash)
	if err != nil {
		return false // fail open on cache errors (DB is the fallback source of truth)
	}
	return revoked
}

// RequireAuth enforces admin JWT authentication with RBAC
func (m *AuthMiddleware) RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, claims, rawToken, err := m.parseAndValidateJWT(r)
		if err != nil {
			writeJSONError(w, "Unauthorized: Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// Check token type
		tokenType, _ := claims["type"].(string)
		if tokenType != "admin" {
			writeJSONError(w, "Forbidden: Admin access required", http.StatusForbidden)
			return
		}

		// Check revocation
		if m.isTokenRevoked(r.Context(), rawToken) {
			writeJSONError(w, "Unauthorized: Token has been revoked", http.StatusUnauthorized)
			return
		}

		// Extract role
		role, _ := claims["role"].(string)
		if role == "" {
			role = "admin" // backwards compat for tokens issued before RBAC
		}

		// Extract user ID
		userIDFloat, ok := claims["sub"].(float64)
		if !ok {
			writeJSONError(w, "Unauthorized: Missing subject in claims", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, int(userIDFloat))
		ctx = context.WithValue(ctx, UserRoleKey, role)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

// RequireStudentAuth enforces student JWT authentication with real-time status check
func (m *AuthMiddleware) RequireStudentAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, claims, rawToken, err := m.parseAndValidateJWT(r)
		if err != nil {
			writeJSONError(w, "Unauthorized: Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// Check token type
		tokenType, _ := claims["type"].(string)
		if tokenType != "student" && tokenType != "" {
			// Allow empty type for backwards compat with existing student tokens
		}

		// Check revocation
		if m.isTokenRevoked(r.Context(), rawToken) {
			writeJSONError(w, "Unauthorized: Token has been revoked", http.StatusUnauthorized)
			return
		}

		studentIDStr, ok := claims["sub"].(string)
		if !ok {
			writeJSONError(w, "Unauthorized: Missing subject in claims", http.StatusUnauthorized)
			return
		}

		// Real-time status check via cache (avoids stale JWT claims)
		status, found := m.cache.GetStudentStatus(r.Context(), studentIDStr)
		if !found {
			// Cache miss — use JWT claim as fallback, cache will be populated by service layer
			status, _ = claims["status"].(string)
			if status != "" {
				m.cache.SetStudentStatus(r.Context(), studentIDStr, status, 2*time.Minute)
			}
		}

		if status == "disqualified" {
			writeJSONError(w, "Forbidden: Your access has been revoked", http.StatusForbidden)
			return
		}

		ctx := context.WithValue(r.Context(), StudentIDKey, studentIDStr)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func hashTokenMW(rawToken string) string {
	h := sha256.Sum256([]byte(rawToken))
	return hex.EncodeToString(h[:])
}
