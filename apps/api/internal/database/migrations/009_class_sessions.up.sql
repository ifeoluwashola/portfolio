-- Migration 009: Class Sessions for Synchronous Cohort Model
-- Allows multiple recordings per week.

CREATE TABLE IF NOT EXISTS class_sessions (
    id SERIAL PRIMARY KEY,
    cohort_week_id INT NOT NULL REFERENCES cohort_weeks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    recording_url VARCHAR(255) NOT NULL,
    session_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data Migration: Move existing recordings to the new session table
INSERT INTO class_sessions (cohort_week_id, title, recording_url, session_date)
SELECT id, 'Main Recording', recording_url, created_at
FROM cohort_weeks
WHERE recording_url IS NOT NULL AND recording_url <> '';

-- Optional: We could drop recording_url from cohort_weeks, but let's keep it for compatibility for now 
-- or just stop using it in the code. The user asked to remove the input in UI.
