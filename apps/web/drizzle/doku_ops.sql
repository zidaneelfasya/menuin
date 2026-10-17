-- DOKU Fase 4: review, refund, dan settlement. Idempotent. Jalankan setelah doku_qris.sql.

ALTER TABLE payment_attempts
  ADD COLUMN IF NOT EXISTS review_resolution text,
  ADD COLUMN IF NOT EXISTS review_note text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by_membership_id uuid,
  ADD COLUMN IF NOT EXISTS refunded_amount integer,
  ADD COLUMN IF NOT EXISTS refund_reference text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS settled_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payment_attempts_refund_check' AND conrelid = 'payment_attempts'::regclass
  ) THEN
    ALTER TABLE payment_attempts
      ADD CONSTRAINT payment_attempts_refund_check
      CHECK (refunded_amount IS NULL OR (refunded_amount > 0 AND refunded_amount <= amount));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS payment_attempts_review_idx
  ON payment_attempts (tenant_id, requires_review, reviewed_at);
