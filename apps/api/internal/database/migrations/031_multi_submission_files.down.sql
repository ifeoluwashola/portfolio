-- Reverse: convert submission_file_keys (TEXT array) back to submission_file_key (VARCHAR)

-- Step 1: Re-create the old single-value column
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS submission_file_key VARCHAR(255);

-- Step 2: Copy the first element from the array back to the old column
UPDATE assignments
SET submission_file_key = submission_file_keys[1]
WHERE submission_file_keys IS NOT NULL AND array_length(submission_file_keys, 1) > 0;

-- Step 3: Drop the array column
ALTER TABLE assignments DROP COLUMN IF EXISTS submission_file_keys;
