-- Disciplinary Management & Graduation PR Flow

-- 1. Update students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS warning_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS disqualification_reason TEXT;

-- 2. Modify capstone_projects to link to students (PR flow)
-- First drop existing to rebuild with correct flow
DROP TABLE IF EXISTS capstone_projects;
DROP TABLE IF EXISTS alumni_profiles;

CREATE TABLE alumni_profiles (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    cohort_name VARCHAR(100) NOT NULL,
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE capstone_projects (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    project_title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    architecture_diagram_url VARCHAR(255),
    live_demo_url VARCHAR(255),
    repo_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for public lookup
CREATE INDEX idx_alumni_slug ON alumni_profiles(slug);
CREATE INDEX idx_capstone_status ON capstone_projects(status);
