-- Migration 007: Registration Fields and 16-Week Roadmap
-- Adds experience level and laptop check to applications, and extends the curriculum.

-- 1. Update cohort_applications schema
ALTER TABLE cohort_applications 
ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS has_laptop BOOLEAN DEFAULT FALSE;

-- 2. Extend cohort_weeks to 16 weeks
INSERT INTO cohort_weeks (week_number, title, status) VALUES
(13, 'Capstone Phase I: Project Scoping & Design', 'locked'),
(14, 'Capstone Phase II: Infrastructure Provisioning', 'locked'),
(15, 'Capstone Phase III: CI/CD & Security Hardening', 'locked'),
(16, 'Final Demo: Production Readiness Audit', 'locked')
ON CONFLICT (week_number) DO NOTHING;
