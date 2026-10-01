-- Migration 033 Down: Revert Capstone and Profile URL columns to VARCHAR(255)

ALTER TABLE capstone_projects
    ALTER COLUMN architecture_diagram_url TYPE VARCHAR(255),
    ALTER COLUMN live_demo_url TYPE VARCHAR(255),
    ALTER COLUMN repo_url TYPE VARCHAR(255);

ALTER TABLE students
    ALTER COLUMN linkedin_url TYPE VARCHAR(255),
    ALTER COLUMN github_url TYPE VARCHAR(255);

ALTER TABLE alumni_profiles
    ALTER COLUMN linkedin_url TYPE VARCHAR(255),
    ALTER COLUMN github_url TYPE VARCHAR(255);
