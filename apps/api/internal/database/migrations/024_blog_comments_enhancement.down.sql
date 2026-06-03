DROP TABLE IF EXISTS blog_comment_likes;

ALTER TABLE blog_comments DROP COLUMN IF EXISTS student_id;
ALTER TABLE blog_comments DROP COLUMN IF EXISTS parent_id;
ALTER TABLE blog_comments DROP COLUMN IF EXISTS likes;
