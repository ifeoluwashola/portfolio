-- Add telegram chat ID to cohorts
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(255);

-- Update existing cohorts to use the specified chat ID
UPDATE cohorts SET telegram_chat_id = '-1003555375365' WHERE telegram_chat_id IS NULL;

-- Add reminder tracking to class sessions
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
