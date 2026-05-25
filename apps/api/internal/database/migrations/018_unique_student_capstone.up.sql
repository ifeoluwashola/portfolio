-- 1. Delete duplicate capstone projects, keeping only the latest one (highest ID)
DELETE FROM capstone_projects a
USING capstone_projects b
WHERE a.student_id = b.student_id AND a.id < b.id;

-- 2. Add a UNIQUE constraint to student_id on capstone_projects
ALTER TABLE capstone_projects ADD CONSTRAINT unique_student_capstone UNIQUE (student_id);
