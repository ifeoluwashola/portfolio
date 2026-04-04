package cache

import (
	"context"
	"time"
)

// TokenCache provides an abstraction for token revocation checks and status caching.
// Implementations can be in-memory (default) or Redis (production scale).
type TokenCache interface {
	// IsRevoked checks if a token hash exists in the revocation cache
	IsRevoked(ctx context.Context, tokenHash string) (bool, error)
	// Revoke marks a token hash as revoked with a TTL matching the token's remaining lifetime
	Revoke(ctx context.Context, tokenHash string, ttl time.Duration) error

	// GetStudentStatus retrieves a cached student status (avoids DB hit per request)
	GetStudentStatus(ctx context.Context, studentID string) (string, bool)
	// SetStudentStatus caches a student's status with a short TTL
	SetStudentStatus(ctx context.Context, studentID string, status string, ttl time.Duration)

	// Invalidate removes a cached student status (e.g. on disqualification)
	InvalidateStudentStatus(ctx context.Context, studentID string)
}
