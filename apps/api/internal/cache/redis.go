package cache

// Redis implementation stub.
// When ready to scale to multi-instance, implement TokenCache using go-redis:

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisCache struct {
	client *redis.Client
}

func NewRedisCache(url string) (TokenCache, error) {
	opts, err := redis.ParseURL(url)
	if err != nil {
		return nil, err
	}
	client := redis.NewClient(opts)

	// Verify connection with a timeout
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return &RedisCache{client: client}, nil
}

func (c *RedisCache) IsRevoked(ctx context.Context, tokenHash string) (bool, error) {
	_, err := c.client.Get(ctx, "revoked:"+tokenHash).Result()
	if err == redis.Nil {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func (c *RedisCache) Revoke(ctx context.Context, tokenHash string, ttl time.Duration) error {
	return c.client.Set(ctx, "revoked:"+tokenHash, "1", ttl).Err()
}

func (c *RedisCache) GetStudentStatus(ctx context.Context, studentID string) (string, bool) {
	val, err := c.client.Get(ctx, "status:"+studentID).Result()
	if err != nil {
		return "", false
	}
	return val, true
}

func (c *RedisCache) SetStudentStatus(ctx context.Context, studentID, status string, ttl time.Duration) {
	c.client.Set(ctx, "status:"+studentID, status, ttl)
}

func (c *RedisCache) InvalidateStudentStatus(ctx context.Context, studentID string) {
	c.client.Del(ctx, "status:"+studentID)
}
