-- Migration 010: Session-Level Lifecycle and Meeting Links
-- Moves state and meeting metadata from the week level to the individual session level.

-- 1. Upgrade class_sessions table
ALTER TABLE class_sessions 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'archived')),
ADD COLUMN IF NOT EXISTS meeting_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;

-- 2. Data Migration: For weeks with an existing meet_link, 
-- create an initial 'Main Session' if no sessions exist, OR update the first session.
-- Since the user gave us Part 1 which includes 'Update GET /api/v1/cohort-weeks/:id...', 
-- we ensure data parity.

-- If a session already exists (from migration 009), update its meeting_url if cohort_weeks.meet_link exists.
UPDATE class_sessions cs
SET meeting_url = cw.meet_link,
    status = CASE 
        WHEN cw.status = 'live' THEN 'live' 
        WHEN cw.status = 'archived' THEN 'archived'
        ELSE 'scheduled'
    END,
    scheduled_at = cw.created_at
FROM cohort_weeks cw
WHERE cs.cohort_week_id = cw.id
AND (cs.meeting_url IS NULL OR cs.meeting_url = '')
AND cw.meet_link IS NOT NULL AND cw.meet_link <> '';

-- 3. Cleanup: Remove global meet_link from cohort_weeks
-- We keep recording_url for now as it was explicitly mentioned in 009 to keep for compatibility, 
-- but we remove the live link as per this current request.
ALTER TABLE cohort_weeks DROP COLUMN IF EXISTS meet_link;
