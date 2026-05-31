-- Remove reminder tracking
ALTER TABLE class_sessions DROP COLUMN IF EXISTS reminder_sent;

-- Remove telegram chat ID
ALTER TABLE cohorts DROP COLUMN IF EXISTS telegram_chat_id;
