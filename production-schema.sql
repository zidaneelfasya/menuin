-- ==============================================================================
-- MENUIN PRODUCTION DATABASE SCHEMA (SOURCE OF TRUTH)
-- Dialect: PostgreSQL (Supabase / Vanilla PostgreSQL 15+)
--
-- File: production-schema.sql
-- Description:
--   Skema database lengkap dan mutakhir untuk seluruh ekosistem Menuin
--   (Storefront QR, POS Kasir Web/Mobile, Dapur Kitchen Screen, dan Superadmin).
--   Script ini dirancang IDEMPOTENT (aman dijalankan berulang kali pada database
--   baru maupun database produksi yang sudah berjalan tanpa merusak data).
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM ENUMS
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('FREE', 'BASIC', 'PRO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tenant_role AS ENUM ('OWNER', 'MANAGER', 'CASHIER', 'STAFF');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. CORE GLOBAL IDENTITY: ACCOUNTS
-- Terhubung langsung ke Supabase Auth (auth.users)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. OUTLETS / RESTAURANTS: TENANTS
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  outlet_key TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  subscription_tier subscription_tier NOT NULL DEFAULT 'FREE',
  storefront_enabled BOOLEAN NOT NULL DEFAULT true,
  store_description TEXT,
  store_logo_url TEXT,
  store_banner_url TEXT,
  primary_color TEXT DEFAULT '#2563EB',
  
  -- Ordering & Order ID Prefix Settings
  order_prefix TEXT,
  dine_in_enabled BOOLEAN NOT NULL DEFAULT true,
  take_away_enabled BOOLEAN NOT NULL DEFAULT true,
  delivery_enabled BOOLEAN NOT NULL DEFAULT false,
  customer_name_required BOOLEAN NOT NULL DEFAULT true,
  customer_phone_required BOOLEAN NOT NULL DEFAULT false,
  table_number_required BOOLEAN NOT NULL DEFAULT false,
  order_process_type TEXT NOT NULL DEFAULT 'MANUAL',
  
  -- POS Settings
  pos_kitchen_sync BOOLEAN NOT NULL DEFAULT false,
  pos_require_customer BOOLEAN NOT NULL DEFAULT false,
  pos_order_type_selection TEXT NOT NULL DEFAULT 'MANUAL',
  pos_tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  tax_name TEXT NOT NULL DEFAULT 'Pajak (PB1)',
  service_charge_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  
  -- Komisi Platform Online Food (%)
  grab_food_fee_rate NUMERIC(5, 2) NOT NULL DEFAULT 20,
  shopee_food_fee_rate NUMERIC(5, 2) NOT NULL DEFAULT 20,
  go_food_fee_rate NUMERIC(5, 2) NOT NULL DEFAULT 20,
  
  -- Preferensi Tampilan
  pos_pin_best_sellers BOOLEAN NOT NULL DEFAULT true,
  
  -- Integrasi Pembayaran Online (Midtrans)
  online_payment_enabled BOOLEAN NOT NULL DEFAULT false,
  midtrans_server_key TEXT,
  midtrans_client_key TEXT,
  midtrans_environment TEXT DEFAULT 'sandbox',

  -- Pengaturan Kustomisasi Struk Kasir
  receipt_header TEXT,
  receipt_footer TEXT,
  receipt_logo_url TEXT,
  receipt_show_logo BOOLEAN NOT NULL DEFAULT true,
  receipt_show_customer BOOLEAN NOT NULL DEFAULT true,
  receipt_show_cashier BOOLEAN NOT NULL DEFAULT true,
  receipt_show_table BOOLEAN NOT NULL DEFAULT true,
  receipt_show_notes BOOLEAN NOT NULL DEFAULT true,
  receipt_custom_note TEXT,

  -- Pengaturan Tiket Dapur (Kitchen Slip)
  kitchen_print_enabled BOOLEAN NOT NULL DEFAULT false,
  kitchen_ticket_title TEXT DEFAULT 'TIKET DAPUR',
  kitchen_ticket_notes TEXT,
  kitchen_show_customer BOOLEAN NOT NULL DEFAULT true,
  kitchen_show_cashier BOOLEAN NOT NULL DEFAULT true,
  kitchen_show_table BOOLEAN NOT NULL DEFAULT true,
  kitchen_show_notes BOOLEAN NOT NULL DEFAULT true,
  kitchen_auto_cut BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status subscription_status NOT NULL DEFAULT 'ACTIVE',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_sub_idx ON subscriptions(tenant_id) WHERE status = 'ACTIVE';

-- 6. STAFF & ROLE MEMBERSHIPS
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  display_name TEXT,
  pin_hash TEXT,
  role tenant_role NOT NULL DEFAULT 'STAFF',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT memberships_account_tenant_unique UNIQUE(account_id, tenant_id),
  CONSTRAINT memberships_tenant_id_unique UNIQUE(tenant_id, id)
);

-- 7. POS DEVICES (HARDWARE IDENTIFICATION)
CREATE TABLE IF NOT EXISTS pos_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  device_identifier TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pos_devices_tenant_id_unique UNIQUE(tenant_id, id)
);

-- 8. POS SESSIONS (ACTIVE TERMINAL LOGIN)
CREATE TABLE IF NOT EXISTS pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  device_id UUID NOT NULL,
  membership_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT pos_sessions_tenant_id_unique UNIQUE(tenant_id, id),
  CONSTRAINT pos_sessions_device_fk FOREIGN KEY (tenant_id, device_id) REFERENCES pos_devices(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT pos_sessions_membership_fk FOREIGN KEY (tenant_id, membership_id) REFERENCES memberships(tenant_id, id) ON DELETE CASCADE
);

-- 9. INVITATIONS
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role tenant_role NOT NULL DEFAULT 'STAFF',
  token_hash TEXT NOT NULL,
  status invitation_status NOT NULL DEFAULT 'PENDING',
  invited_by UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT invitations_invited_by_fk FOREIGN KEY (tenant_id, invited_by) REFERENCES memberships(tenant_id, id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS pending_invitation_idx ON invitations(tenant_id, email) WHERE status = 'PENDING';

-- 10. SECURITY & RATE LIMITS
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT,
  action TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  lock_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  actor_membership_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT audit_logs_actor_membership_fk FOREIGN KEY (tenant_id, actor_membership_id) REFERENCES memberships(tenant_id, id) ON DELETE SET NULL
);

-- 12. PROMOTIONS & DISCOUNTS
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'PERCENTAGE',
  value NUMERIC(12, 2) NOT NULL,
  min_order NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_discount NUMERIC(12, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT promotions_tenant_code_unique UNIQUE(tenant_id, code)
);

-- 13. MENU CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT categories_tenant_slug_unique UNIQUE(tenant_id, slug),
  CONSTRAINT categories_tenant_id_unique UNIQUE(tenant_id, id)
);

-- 14. PRODUCTS / MENU ITEMS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  barcode TEXT,
  price NUMERIC(12, 2) NOT NULL,
  cost_price NUMERIC(12, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  track_stock BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  description TEXT,
  is_available_online BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_tenant_sku_unique UNIQUE(tenant_id, sku),
  CONSTRAINT products_tenant_barcode_unique UNIQUE(tenant_id, barcode),
  CONSTRAINT products_tenant_id_unique UNIQUE(tenant_id, id),
  CONSTRAINT products_category_fk FOREIGN KEY (tenant_id, category_id) REFERENCES categories(tenant_id, id) ON DELETE SET NULL
);

-- 15. CASHIER SHIFTS
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL,
  device_id UUID,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  starting_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
  actual_cash NUMERIC(12, 2),
  expected_cash NUMERIC(12, 2),
  cash_difference NUMERIC(12, 2),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shifts_tenant_id_unique UNIQUE(tenant_id, id),
  CONSTRAINT shifts_membership_fk FOREIGN KEY (tenant_id, membership_id) REFERENCES memberships(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT shifts_device_fk FOREIGN KEY (tenant_id, device_id) REFERENCES pos_devices(tenant_id, id) ON DELETE SET NULL
);

-- 16. CASH MOVEMENTS (CASH IN / CASH OUT IN DRAWER)
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cash_movements_shift_fk FOREIGN KEY (tenant_id, shift_id) REFERENCES shifts(tenant_id, id) ON DELETE CASCADE
);

-- 17. STOCK MOVEMENTS (INVENTORY TRACKING LOGS)
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  reference_id TEXT,
  actor_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. TRANSACTIONS & ORDERS
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'POS',
  pos_session_id UUID,
  cashier_membership_id UUID,
  shift_id UUID,
  total_amount NUMERIC(12, 2) NOT NULL,
  discount NUMERIC(12, 2) DEFAULT 0,
  tax NUMERIC(12, 2) DEFAULT 0,
  service_charge NUMERIC(12, 2) DEFAULT 0,
  platform_fee NUMERIC(12, 2) DEFAULT 0,
  grand_total NUMERIC(12, 2) NOT NULL,
  promo_code TEXT,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  order_type TEXT NOT NULL DEFAULT 'DINE_IN',
  customer_name TEXT,
  customer_phone TEXT,
  table_number TEXT,
  public_token UUID DEFAULT gen_random_uuid() UNIQUE,
  order_number TEXT,
  snap_token TEXT,
  void_reason TEXT,
  voided_at TIMESTAMPTZ,
  voided_by_membership_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT transactions_tenant_order_unique UNIQUE(tenant_id, order_number),
  CONSTRAINT transactions_tenant_id_unique UNIQUE(tenant_id, id),
  CONSTRAINT transactions_pos_session_fk FOREIGN KEY (tenant_id, pos_session_id) REFERENCES pos_sessions(tenant_id, id) ON DELETE SET NULL,
  CONSTRAINT transactions_cashier_membership_fk FOREIGN KEY (tenant_id, cashier_membership_id) REFERENCES memberships(tenant_id, id) ON DELETE SET NULL,
  CONSTRAINT transactions_shift_fk FOREIGN KEY (tenant_id, shift_id) REFERENCES shifts(tenant_id, id) ON DELETE SET NULL
);

-- 19. TRANSACTION ITEMS
CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  modifiers JSONB,
  notes TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT transaction_items_tx_fk FOREIGN KEY (tenant_id, transaction_id) REFERENCES transactions(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT transaction_items_product_fk FOREIGN KEY (tenant_id, product_id) REFERENCES products(tenant_id, id) ON DELETE RESTRICT
);

-- 20. MODIFIER GROUPS (TOPPING / LEVEL / VARIAN)
CREATE TABLE IF NOT EXISTS modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  min_selections INTEGER NOT NULL DEFAULT 0,
  max_selections INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT modifier_groups_tenant_id_unique UNIQUE(tenant_id, id)
);

-- 21. MODIFIERS (PILIHAN MODIFIER & HARGA TAMBAHAN)
CREATE TABLE IF NOT EXISTS modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  group_id UUID NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT modifiers_tenant_id_unique UNIQUE(tenant_id, id),
  CONSTRAINT modifiers_group_fk FOREIGN KEY (tenant_id, group_id) REFERENCES modifier_groups(tenant_id, id) ON DELETE CASCADE
);

-- 22. PRODUCT MODIFIER GROUPS (JUNCTION)
CREATE TABLE IF NOT EXISTS product_modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  modifier_group_id UUID NOT NULL,
  CONSTRAINT pmg_product_fk FOREIGN KEY (tenant_id, product_id) REFERENCES products(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT pmg_group_fk FOREIGN KEY (tenant_id, modifier_group_id) REFERENCES modifier_groups(tenant_id, id) ON DELETE CASCADE
);

-- 23. TESTIMONIALS (LANDING PAGE REVIEWS)
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT,
  rating NUMERIC(2, 1) NOT NULL DEFAULT 5.0,
  content TEXT NOT NULL,
  sentiment TEXT NOT NULL DEFAULT 'Excellent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. ONLINE PAYMENTS (MIDTRANS AUDIT LOG)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL,
  provider_transaction_id TEXT,
  provider TEXT NOT NULL DEFAULT 'MIDTRANS',
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payments_tx_fk FOREIGN KEY (tenant_id, transaction_id) REFERENCES transactions(tenant_id, id) ON DELETE CASCADE
);

-- 25. RESTAURANT TABLES (MEJA MAKAN & QR MEJA)
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  qr_code_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 26. OPERATING HOURS (JADWAL OPERASIONAL OUTLET)
CREATE TABLE IF NOT EXISTS operating_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  open_time TEXT NOT NULL DEFAULT '09:00',
  close_time TEXT NOT NULL DEFAULT '22:00',
  is_closed BOOLEAN NOT NULL DEFAULT false
);

-- 27. POS DEVICE PAIRING CODES
CREATE TABLE IF NOT EXISTS device_pairing_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 28. SUPABASE REALTIME CONFIGURATION
-- Aktifkan Realtime untuk transaksi dan shift kasir
-- ==============================================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE shifts;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
