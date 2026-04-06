-- Add assignment_instructions column to cohort_weeks
ALTER TABLE cohort_weeks ADD COLUMN IF NOT EXISTS assignment_instructions TEXT;
