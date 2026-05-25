ALTER TABLE cohort_weeks DROP CONSTRAINT IF EXISTS unique_cohort_week;
ALTER TABLE cohort_weeks ADD CONSTRAINT cohort_weeks_week_number_key UNIQUE (week_number);

ALTER TABLE cohort_weeks DROP CONSTRAINT IF EXISTS fk_cohort_weeks_cohort;
ALTER TABLE cohort_weeks DROP COLUMN IF EXISTS cohort_id;

ALTER TABLE students DROP CONSTRAINT IF EXISTS fk_students_cohort;
ALTER TABLE students DROP COLUMN IF EXISTS cohort_id;

DROP TABLE IF EXISTS cohorts;
