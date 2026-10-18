-- DOKU Fase 2: langganan Menuin via DOKU Checkout. Idempotent.
-- Jalankan SETELAH doku_payments.sql.

CREATE TABLE IF NOT EXISTS subscription_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL CONSTRAINT subscription_invoices_tenant_id_tenants_id_fk REFERENCES tenants(id),
  plan_code text NOT NULL,
  plan text NOT NULL,
  amount integer NOT NULL CONSTRAINT subscription_invoices_amount_check CHECK (amount > 0),
  period_days integer NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'
    CONSTRAINT subscription_invoices_status_check CHECK (status IN ('PENDING', 'PAID', 'CANCELED')),
  created_by_membership_id uuid,
  subscription_id uuid CONSTRAINT subscription_invoices_subscription_id_subscriptions_id_fk REFERENCES subscriptions(id),
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscription_invoices_one_pending_uq
  ON subscription_invoices (tenant_id)
  WHERE status = 'PENDING';

ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

-- payment_attempts sekarang melayani order (ORDER) maupun langganan (SUBSCRIPTION).
ALTER TABLE payment_attempts
  ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'ORDER',
  ADD COLUMN IF NOT EXISTS subscription_invoice_id uuid;

ALTER TABLE payment_attempts ALTER COLUMN transaction_id DROP NOT NULL;

DO $$
BEGIN
  -- Nama pendek eksplisit (nama panjang > 63 karakter akan dipotong Postgres).
  ALTER TABLE payment_attempts
    DROP CONSTRAINT IF EXISTS payment_attempts_subscription_invoice_id_subscription_invoices_;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payment_attempts_sub_invoice_fk' AND conrelid = 'payment_attempts'::regclass
  ) THEN
    ALTER TABLE payment_attempts
      ADD CONSTRAINT payment_attempts_sub_invoice_fk
      FOREIGN KEY (subscription_invoice_id) REFERENCES subscription_invoices(id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payment_attempts_target_check' AND conrelid = 'payment_attempts'::regclass
  ) THEN
    ALTER TABLE payment_attempts
      ADD CONSTRAINT payment_attempts_target_check CHECK (
        (purpose = 'ORDER' AND transaction_id IS NOT NULL AND subscription_invoice_id IS NULL)
        OR (purpose = 'SUBSCRIPTION' AND subscription_invoice_id IS NOT NULL AND transaction_id IS NULL)
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_one_active_per_sub_invoice_uq
  ON payment_attempts (subscription_invoice_id)
  WHERE status IN ('CREATED', 'PENDING');
