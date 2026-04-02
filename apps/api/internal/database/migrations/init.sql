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
