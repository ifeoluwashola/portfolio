ALTER TABLE students ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE students ADD COLUMN IF NOT EXISTS pending_email VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS email_verify_token VARCHAR(255);

-- Backfill username for existing records to prevent NOT NULL and UNIQUE constraint failures
UPDATE students 
SET username = SPLIT_PART(email, '@', 1) || '_' || substr(md5(random()::text), 1, 4) 
WHERE username IS NULL;

-- Enforce constraints
ALTER TABLE students ALTER COLUMN username SET NOT NULL;
-- Use IF NOT EXISTS for constraint requires PL/pgSQL or just simple ADD CONSTRAINT (we'll just use ADD CONSTRAINT since it's a new column)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_username_key') THEN
        ALTER TABLE students ADD CONSTRAINT students_username_key UNIQUE (username);
    END IF;
END $$;
