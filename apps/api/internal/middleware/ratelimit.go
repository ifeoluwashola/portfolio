package middleware

import (
	"net/http"
	"time"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/cache"
)

// RateLimiter holds the cache dependency for rate limiting
type RateLimiter struct {
	cache cache.TokenCache
}

// NewRateLimiter creates a new rate limiter instance
func NewRateLimiter(cache cache.TokenCache) *RateLimiter {
	return &RateLimiter{cache: cache}
}

// RateLimit middeware limits requests based on IP address
func (rl *RateLimiter) RateLimit(limit int, window time.Duration) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			// Identify requester by IP (or X-Forwarded-For if behind a proxy)
			identifier := r.Header.Get("X-Forwarded-For")
			if identifier == "" {
				identifier = r.RemoteAddr
			}

			// Use the cache-backed Allow logic
			allowed, err := rl.cache.Allow(r.Context(), "ratelimit:"+identifier+":"+r.URL.Path, limit, window)
			if err != nil {
				// Fail-open for rate limiting to prioritize availability over strict limit enforcement on error
				next.ServeHTTP(w, r)
				return
			}

			if !allowed {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusTooManyRequests)
				w.Write([]byte(`{"error": "Too many requests. Please try again later."}`))
				return
			}

			next.ServeHTTP(w, r)
		}
	}
}
