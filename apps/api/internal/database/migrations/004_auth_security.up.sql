-- Auth Security Overhaul Migration

-- 1. Add role and first-login tracking to admin users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT false;

-- 2. Token revocation table (lightweight blacklist for JWT invalidation)
CREATE TABLE IF NOT EXISTS revoked_tokens (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_hash ON revoked_tokens(token_hash);

-- 3. Mark existing admin users as NOT first login (they already have passwords)
UPDATE users SET is_first_login = false WHERE is_first_login IS NULL OR is_first_login = true;
