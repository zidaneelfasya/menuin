-- DOKU payment integration (Fase 1). Idempotent: aman dijalankan berulang.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS doku_sub_account_id text,
  ADD COLUMN IF NOT EXISTS doku_sub_account_status text;

CREATE TABLE IF NOT EXISTS payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL CONSTRAINT payment_attempts_tenant_id_tenants_id_fk REFERENCES tenants(id),
  transaction_id uuid NOT NULL,
  provider text NOT NULL,
  product text NOT NULL,
  environment text NOT NULL,
  invoice_number text NOT NULL,
  amount integer NOT NULL CONSTRAINT payment_attempts_amount_check CHECK (amount > 0),
  status text NOT NULL DEFAULT 'CREATED'
    CONSTRAINT payment_attempts_status_check
    CHECK (status IN ('CREATED', 'PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELED')),
  sub_account_id text,
  payment_url text,
  provider_reference text,
  provider_status text,
  payment_channel text,
  expires_at timestamptz,
  paid_at timestamptz,
  fee_amount integer,
  net_amount integer,
  fee_source text,
  requires_review boolean NOT NULL DEFAULT false,
  review_reason text,
  last_error text,
  last_checked_at timestamptz,
  raw_create_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_attempts_transaction_fk
    FOREIGN KEY (tenant_id, transaction_id) REFERENCES transactions(tenant_id, id)
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_provider_invoice_uq
  ON payment_attempts (provider, invoice_number);

-- Maksimal satu attempt aktif per order.
CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_one_active_per_tx_uq
  ON payment_attempts (transaction_id)
  WHERE status IN ('CREATED', 'PENDING');

CREATE INDEX IF NOT EXISTS payment_attempts_status_created_idx
  ON payment_attempts (status, created_at);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  request_id text NOT NULL,
  invoice_number text,
  signature_valid boolean NOT NULL,
  headers jsonb,
  raw_body text NOT NULL,
  processed_at timestamptz,
  result text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_webhook_events_provider_request_uq
  ON payment_webhook_events (provider, request_id);

-- Tabel pembayaran hanya diakses server (service role / koneksi DB langsung).
-- RLS aktif tanpa policy = tertutup untuk anon/authenticated via Supabase API.
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhook_events ENABLE ROW LEVEL SECURITY;
