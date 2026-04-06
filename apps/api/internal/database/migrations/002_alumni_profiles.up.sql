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
