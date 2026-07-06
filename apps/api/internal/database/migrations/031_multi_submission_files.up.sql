-- Convert submission_file_key (single VARCHAR) to submission_file_keys (TEXT array)
-- to support multiple document uploads per assignment submission.

-- Step 1: Add the new array column
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS submission_file_keys TEXT[];

-- Step 2: Migrate existing data from the old column into the new array
UPDATE assignments
SET submission_file_keys = ARRAY[submission_file_key]
WHERE submission_file_key IS NOT NULL AND submission_file_key != '';

-- Step 3: Drop the old single-value column
ALTER TABLE assignments DROP COLUMN IF EXISTS submission_file_key;
