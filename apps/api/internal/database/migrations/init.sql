CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
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
