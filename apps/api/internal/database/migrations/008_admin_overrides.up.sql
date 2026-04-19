-- 008_admin_overrides.up.sql
-- Supports administrative manual locks and academic probation

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS is_manually_locked BOOLEAN DEFAULT FALSE;

-- We already have status VARCHAR(20) and disqualification_reason TEXT from 005.
-- No schema changes needed for 'probation' as it fits in status VARCHAR(20).
