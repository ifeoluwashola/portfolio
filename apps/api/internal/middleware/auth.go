package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserIDKey contextKey = "userID"

func writeJSONError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// RequireAuth is a middleware that enforces JWT authentication
func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			writeJSONError(w, "Unauthorized: Missing Authorization header", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			writeJSONError(w, "Unauthorized: Invalid Authorization header format", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "default_unsafe_secret_for_dev_only"
		}

		// Parse and validate token (using jwt/v5)
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Validate signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			writeJSONError(w, "Unauthorized: Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// Extract claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			writeJSONError(w, "Unauthorized: Invalid token claims", http.StatusUnauthorized)
			return
		}

		// Store user ID in context
		userIDFloat, ok := claims["sub"].(float64)
		if !ok {
			writeJSONError(w, "Unauthorized: Missing subject in claims", http.StatusUnauthorized)
			return
		}
		
		ctx := context.WithValue(r.Context(), UserIDKey, int(userIDFloat))
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}
