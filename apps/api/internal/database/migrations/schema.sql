CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    role VARCHAR(100),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[] NOT NULL,
    github_url VARCHAR(255),
    case_study_url VARCHAR(255),
    color VARCHAR(100) DEFAULT 'from-sky-500/20 to-transparent',
    border_color VARCHAR(100) DEFAULT 'border-sky-500/20',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile (
    id SERIAL PRIMARY KEY,
    bio TEXT NOT NULL,
    avatar_url VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    whatsapp_number VARCHAR(50),
    location VARCHAR(255),
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    twitter_url VARCHAR(255),
    experiences JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    technical_skills JSONB DEFAULT '[]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blog_metrics (
    slug VARCHAR(255) PRIMARY KEY,
    views INT DEFAULT 0,
    likes INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS blog_comments (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_blog_comments_slug ON blog_comments(slug);

CREATE TABLE IF NOT EXISTS cohort_applications (
    id UUID PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    role VARCHAR(100) NOT NULL,
    goal TEXT NOT NULL,
    reference VARCHAR(255) NOT NULL UNIQUE,
    payment_status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_first_login BOOLEAN DEFAULT TRUE,
    reset_token VARCHAR(255),
    reset_token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cohort_weeks (
    id SERIAL PRIMARY KEY,
    week_number INT NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'locked', -- locked, pre-flight, live, archived
    meet_link VARCHAR(255),
    recording_url VARCHAR(255),
    materials JSONB DEFAULT '[]',
    transcript TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    week_id INT NOT NULL REFERENCES cohort_weeks(id) ON DELETE CASCADE,
    github_url VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, passed, failed
    admin_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, week_id)
);

-- Seed initial 12 weeks
INSERT INTO cohort_weeks (week_number, title, status) VALUES
(1, 'Linux Foundations & CLI Mastery', 'locked'),
(2, 'Networking Fundamentals & Protocols', 'locked'),
(3, 'Cloud Infrastructure (AWS/GCP)', 'locked'),
(4, 'Containerization with Docker', 'locked'),
(5, 'Kubernetes Core Concepts', 'locked'),
(6, 'Advanced K8s: Networking & Storage', 'locked'),
(7, 'Infrastructure as Code (Terraform)', 'locked'),
(8, 'CI/CD Pipelines (GitHub Actions)', 'locked'),
(9, 'Observability: Metrics & Logging', 'locked'),
(10, 'Security & DevSecOps Implementation', 'locked'),
(11, 'Scaling & High Availability Strategies', 'locked'),
(12, 'Capstone Project Deployment', 'locked')
ON CONFLICT (week_number) DO NOTHING;

CREATE TABLE IF NOT EXISTS break_it_labs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    scenario TEXT NOT NULL,
    broken_code TEXT NOT NULL,
    solution_code TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, solved, archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_submissions (
    id SERIAL PRIMARY KEY,
    lab_id INT NOT NULL REFERENCES break_it_labs(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    proposed_fix TEXT NOT NULL,
    is_winner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lab_id, student_id) -- Force Push Strategy
);

CREATE TABLE IF NOT EXISTS submission_comments (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL REFERENCES lab_submissions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Alumni Profiles & Capstone Projects
CREATE TABLE IF NOT EXISTS alumni_profiles (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    cohort_name VARCHAR(100) NOT NULL,
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS capstone_projects (
    id SERIAL PRIMARY KEY,
    alumni_id INT NOT NULL REFERENCES alumni_profiles(id) ON DELETE CASCADE,
    project_title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    architecture_diagram_url VARCHAR(255),
    live_demo_url VARCHAR(255),
    repo_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for public lookup
CREATE INDEX IF NOT EXISTS idx_alumni_slug ON alumni_profiles(slug);
-- Add assignment_instructions column to cohort_weeks
ALTER TABLE cohort_weeks ADD COLUMN IF NOT EXISTS assignment_instructions TEXT;
-- Auth Security Overhaul Migration

-- 1. Add role and first-login tracking to admin users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT false;

-- 2. Token revocation table (lightweight blacklist for JWT invalidation)
CREATE TABLE IF NOT EXISTS revoked_tokens (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_hash ON revoked_tokens(token_hash);

-- 3. Mark existing admin users as NOT first login (they already have passwords)
UPDATE users SET is_first_login = false WHERE is_first_login IS NULL OR is_first_login = true;
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
