-- Refresh Token Support
-- Stores opaque refresh tokens with single-use rotation and family tracking.
-- Family tracking enables theft detection: if a revoked token is reused,
-- the entire family (all tokens from that login session) is revoked.

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_type VARCHAR(10) NOT NULL,      -- 'admin' or 'student'
    user_id VARCHAR(255) NOT NULL,       -- int (admin) or uuid (student) stored as text
    family_id UUID NOT NULL,             -- groups tokens from the same login session
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_type, user_id);
