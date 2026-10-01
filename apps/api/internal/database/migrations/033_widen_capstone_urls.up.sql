-- Migration 033: Widen Capstone and Profile URL columns to TEXT
-- Prevents SQLSTATE 22001 (value too long for character varying(255)) when storing long S3 or diagram URLs.

ALTER TABLE capstone_projects
    ALTER COLUMN architecture_diagram_url TYPE TEXT,
    ALTER COLUMN live_demo_url TYPE TEXT,
    ALTER COLUMN repo_url TYPE TEXT;

ALTER TABLE students
    ALTER COLUMN linkedin_url TYPE TEXT,
    ALTER COLUMN github_url TYPE TEXT;

ALTER TABLE alumni_profiles
    ALTER COLUMN linkedin_url TYPE TEXT,
    ALTER COLUMN github_url TYPE TEXT;
