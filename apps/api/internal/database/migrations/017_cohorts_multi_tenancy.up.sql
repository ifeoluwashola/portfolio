CREATE TABLE IF NOT EXISTS cohorts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'onboarding', -- 'onboarding', 'active', 'graduated'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default cohort for existing data
INSERT INTO cohorts (id, name, status) VALUES (1, 'Cohort 1', 'active')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence if needed (not strictly necessary but safe)
SELECT setval('cohorts_id_seq', (SELECT MAX(id) FROM cohorts));

-- Add cohort_id to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS cohort_id INT;
UPDATE students SET cohort_id = 1 WHERE cohort_id IS NULL;
ALTER TABLE students ALTER COLUMN cohort_id SET NOT NULL;
ALTER TABLE students ADD CONSTRAINT fk_students_cohort FOREIGN KEY (cohort_id) REFERENCES cohorts(id);

-- Add cohort_id to cohort_weeks
ALTER TABLE cohort_weeks ADD COLUMN IF NOT EXISTS cohort_id INT;
UPDATE cohort_weeks SET cohort_id = 1 WHERE cohort_id IS NULL;
ALTER TABLE cohort_weeks ALTER COLUMN cohort_id SET NOT NULL;
ALTER TABLE cohort_weeks ADD CONSTRAINT fk_cohort_weeks_cohort FOREIGN KEY (cohort_id) REFERENCES cohorts(id);

-- Replace the unique constraint on week_number with a composite unique constraint
ALTER TABLE cohort_weeks DROP CONSTRAINT IF EXISTS cohort_weeks_week_number_key;
ALTER TABLE cohort_weeks ADD CONSTRAINT unique_cohort_week UNIQUE (cohort_id, week_number);
