-- Migration 034 Down: Remove student_comment and updated_at from capstone_projects

ALTER TABLE capstone_projects 
DROP COLUMN IF EXISTS student_comment,
DROP COLUMN IF EXISTS updated_at;
