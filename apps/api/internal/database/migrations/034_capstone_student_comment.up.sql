-- Migration 034: Add student_comment and updated_at to capstone_projects
-- Allows students to respond to reviewer feedback and attach submission notes.

ALTER TABLE capstone_projects 
ADD COLUMN IF NOT EXISTS student_comment TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
