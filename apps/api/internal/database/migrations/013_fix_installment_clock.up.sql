-- Retroactively fix student_billing for students who paid early
-- Ensure their next due date starts counting from cohort start date (May 30, 2026)

UPDATE student_billing
SET next_payment_due_date = CASE
    WHEN total_paid >= 25000000 THEN NULL
    WHEN current_timestamp < '2026-05-21 00:00:00'::timestamp THEN '2026-05-21 00:00:00'::timestamp + interval '30 days'
    ELSE current_timestamp + interval '30 days'
END,
billing_status = CASE
    WHEN total_paid >= 25000000 THEN 'paid_in_full'
    ELSE 'good_standing'
END
WHERE billing_status != 'paid_in_full';
