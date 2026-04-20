-- Migration 012: Decouple Module State from Session Lifecycle
-- Removes status from cohort_weeks and moves visibility control to sessions.

-- 1. Add visibility_status to class_sessions
ALTER TABLE class_sessions 
ADD COLUMN IF NOT EXISTS visibility_status VARCHAR(20) DEFAULT 'locked' CHECK (visibility_status IN ('locked', 'published'));

-- 2. Data Migration: Set visibility for existing sessions
-- If a week was already 'live' or 'archived', its sessions should be 'published' by default.
UPDATE class_sessions cs
SET visibility_status = 'published'
FROM cohort_weeks cw
WHERE cs.cohort_week_id = cw.id
AND cw.status IN ('live', 'archived', 'pre-flight');

-- 3. Cleanup: Remove status from cohort_weeks
ALTER TABLE cohort_weeks DROP COLUMN IF EXISTS status;
