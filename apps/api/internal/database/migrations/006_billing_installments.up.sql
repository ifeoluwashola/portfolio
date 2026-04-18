-- Migration 006: High-Ticket Flexible Installment Billing System
-- All monetary values stored in KOBO (NGN x 100) to match Paystack API.
-- ₦250,000 = 25,000,000 kobo | ₦100,000 = 10,000,000 kobo | ₦75,000 = 7,500,000 kobo

-- student_billing: one row per student, tracks installment plan state
CREATE TABLE IF NOT EXISTS student_billing (
    student_id            UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
    total_due             INTEGER NOT NULL DEFAULT 25000000,
    total_paid            INTEGER NOT NULL DEFAULT 0,
    next_payment_due_date TIMESTAMPTZ,
    billing_status        VARCHAR(20) NOT NULL DEFAULT 'good_standing'
        CHECK (billing_status IN ('good_standing', 'payment_locked', 'paid_in_full')),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- payment_history: immutable ledger of every successful charge
CREATE TABLE IF NOT EXISTS payment_history (
    id           SERIAL PRIMARY KEY,
    student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount_paid  INTEGER NOT NULL,
    gateway      VARCHAR(50) NOT NULL DEFAULT 'paystack',
    reference_id VARCHAR(255) NOT NULL UNIQUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by student
CREATE INDEX IF NOT EXISTS idx_payment_history_student_id ON payment_history(student_id);
