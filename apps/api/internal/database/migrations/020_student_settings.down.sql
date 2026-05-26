ALTER TABLE students DROP CONSTRAINT IF EXISTS students_username_key;
ALTER TABLE students DROP COLUMN IF EXISTS username;
ALTER TABLE students DROP COLUMN IF EXISTS display_name;
ALTER TABLE students DROP COLUMN IF EXISTS preferences;
ALTER TABLE students DROP COLUMN IF EXISTS pending_email;
ALTER TABLE students DROP COLUMN IF EXISTS email_verify_token;
