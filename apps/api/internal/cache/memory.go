package cache

import (
	"context"
	"sync"
	"time"
)

type cacheEntry struct {
	value     string
	expiresAt time.Time
}

// InMemoryCache is a thread-safe in-memory implementation of TokenCache.
// Suitable for single-instance deployments. Swap with RedisCache for multi-instance.
type InMemoryCache struct {
	mu              sync.RWMutex
	revokedTokens   map[string]time.Time // tokenHash -> expiresAt
	studentStatuses map[string]cacheEntry
}

func NewInMemoryCache() TokenCache {
	c := &InMemoryCache{
		revokedTokens:   make(map[string]time.Time),
		studentStatuses: make(map[string]cacheEntry),
	}
	// Start background cleanup goroutine
	go c.cleanup()
	return c
}

func (c *InMemoryCache) IsRevoked(_ context.Context, tokenHash string) (bool, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	exp, exists := c.revokedTokens[tokenHash]
	if !exists {
		return false, nil
	}
	// If the revocation entry has expired, treat as not revoked (JWT is also expired)
	if time.Now().After(exp) {
		return false, nil
	}
	return true, nil
}

func (c *InMemoryCache) Revoke(_ context.Context, tokenHash string, ttl time.Duration) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.revokedTokens[tokenHash] = time.Now().Add(ttl)
	return nil
}

func (c *InMemoryCache) GetStudentStatus(_ context.Context, studentID string) (string, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	entry, exists := c.studentStatuses[studentID]
	if !exists || time.Now().After(entry.expiresAt) {
		return "", false
	}
	return entry.value, true
}

func (c *InMemoryCache) SetStudentStatus(_ context.Context, studentID string, status string, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.studentStatuses[studentID] = cacheEntry{
		value:     status,
		expiresAt: time.Now().Add(ttl),
	}
}

func (c *InMemoryCache) InvalidateStudentStatus(_ context.Context, studentID string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.studentStatuses, studentID)
}

// cleanup periodically removes expired entries to prevent memory leaks
func (c *InMemoryCache) cleanup() {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		c.mu.Lock()
		now := time.Now()
		for hash, exp := range c.revokedTokens {
			if now.After(exp) {
				delete(c.revokedTokens, hash)
			}
		}
		for id, entry := range c.studentStatuses {
			if now.After(entry.expiresAt) {
				delete(c.studentStatuses, id)
			}
		}
		c.mu.Unlock()
	}
}
