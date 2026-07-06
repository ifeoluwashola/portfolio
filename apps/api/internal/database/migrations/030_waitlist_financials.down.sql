DROP TABLE IF EXISTS waitlist_transactions;
ALTER TABLE waitlist DROP COLUMN IF EXISTS total_amount_paid;
ALTER TABLE waitlist DROP COLUMN IF EXISTS deposit_paid;
