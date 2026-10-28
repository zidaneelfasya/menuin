-- ==============================================================================
-- MENUIN: Production Capacity & Sizing Composite Indexes Migration
-- Date: 2026-10-28
-- Target: PostgreSQL 14+ / Supabase PostgreSQL
-- Idempotency: All statements use CREATE INDEX IF NOT EXISTS (Zero Downtime / Safe)
-- ==============================================================================

-- 1. TRANSACTIONS INDEXES
-- Accelerates POS checkout, shift reconciliation, and date-range sales reports
CREATE INDEX IF NOT EXISTS "transactions_tenant_created_idx" 
  ON "transactions" ("tenant_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "transactions_tenant_status_idx" 
  ON "transactions" ("tenant_id", "payment_status", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "transactions_tenant_status_created_idx" 
  ON "transactions" ("tenant_id", "status", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "transactions_shift_idx" 
  ON "transactions" ("shift_id");

CREATE INDEX IF NOT EXISTS "transactions_tenant_promo_idx" 
  ON "transactions" ("tenant_id", "promotion_id", "promo_code");

-- 2. TRANSACTION ITEMS INDEXES
-- Accelerates kitchen display completion, best-seller aggregation, and HPP calculation
CREATE INDEX IF NOT EXISTS "trx_items_tenant_trx_idx" 
  ON "transaction_items" ("tenant_id", "transaction_id");

CREATE INDEX IF NOT EXISTS "trx_items_tenant_completed_idx" 
  ON "transaction_items" ("tenant_id", "is_completed");

CREATE INDEX IF NOT EXISTS "trx_items_tenant_created_idx" 
  ON "transaction_items" ("tenant_id", "created_at" DESC);

-- 3. SHIFTS & CASH MOVEMENTS INDEXES
-- Eliminates sequential scan on cashier open/close shift queries
CREATE INDEX IF NOT EXISTS "shifts_tenant_status_created_idx" 
  ON "shifts" ("tenant_id", "status", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "shifts_tenant_start_idx" 
  ON "shifts" ("tenant_id", "start_time" DESC);

CREATE INDEX IF NOT EXISTS "cash_movements_shift_idx" 
  ON "cash_movements" ("shift_id");

CREATE INDEX IF NOT EXISTS "cash_movements_tenant_created_idx" 
  ON "cash_movements" ("tenant_id", "created_at" DESC);

-- 4. FINANCIAL REPORTS (EXPENSES, INCOMES, DAILY SUMMARY)
-- Accelerates finance overview, profit-loss, and cashflow reports
CREATE INDEX IF NOT EXISTS "expenses_tenant_date_idx" 
  ON "expenses" ("tenant_id", "date" DESC);

CREATE INDEX IF NOT EXISTS "incomes_tenant_date_idx" 
  ON "incomes" ("tenant_id", "date" DESC);

CREATE INDEX IF NOT EXISTS "daily_summary_tenant_date_idx" 
  ON "daily_summary" ("tenant_id", "date" DESC);

-- 5. PRODUCTS & STOREFRONT CATALOG
-- Accelerates public QR storefront and cashier product catalog search
CREATE INDEX IF NOT EXISTS "products_tenant_active_online_idx" 
  ON "products" ("tenant_id", "is_active", "is_available_online");

CREATE INDEX IF NOT EXISTS "categories_tenant_idx" 
  ON "categories" ("tenant_id");

-- 6. SETTLEMENT & VERIFICATION
CREATE INDEX IF NOT EXISTS "payment_attempts_status_created_idx" 
  ON "payment_attempts" ("status", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "payment_attempts_review_idx" 
  ON "payment_attempts" ("tenant_id", "requires_review", "reviewed_at");
