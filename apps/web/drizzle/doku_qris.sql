-- DOKU Fase 3: QRIS dinamis di POS via SNAP. Idempotent. Jalankan setelah doku_subscriptions.sql.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS doku_qris_merchant_id text,
  ADD COLUMN IF NOT EXISTS doku_qris_terminal_id text;

ALTER TABLE payment_attempts
  ADD COLUMN IF NOT EXISTS qr_content text,
  ADD COLUMN IF NOT EXISTS gateway_merchant_id text;

-- Notifikasi QRIS dicocokkan lewat partnerReferenceNo (= invoice_number) yang sudah unik.
