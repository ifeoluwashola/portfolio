-- 1. Add media_urls JSONB arrays
ALTER TABLE threads ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE replies ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb;
