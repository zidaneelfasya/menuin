-- ==============================================================================
-- MENUIN PRODUCTION DATABASE SCHEMA (SOURCE OF TRUTH)
-- Dialect: PostgreSQL (Supabase / Vanilla PostgreSQL 15+)
--
-- File: production-schema.sql
-- Description:
--   Skema database lengkap dan mutakhir untuk seluruh ekosistem Menuin
--   (Storefront QR, POS Kasir Web/Mobile, Dapur Kitchen Screen, Business Verification / KYC,
--    DOKU Payment Gateway Omnichannel, Billing & Multi-Outlet Management, dan Superadmin).
--   Script ini dirancang 100% IDEMPOTENT (aman dijalankan berulang kali pada database
--   baru maupun database produksi yang sudah berjalan tanpa merusak data).
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CUSTOM ENUMS
-- ==============================================================================
DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('FREE', 'BASIC', 'PRO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tenant_role AS ENUM ('OWNER', 'MANAGER', 'CASHIER', 'STAFF', 'SYSTEM_ADMIN', 'VERIFICATION_ADMIN', 'SUPERADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- ==============================================================================
-- 3. BASE TABLES DEFINITION
-- ==============================================================================

-- 3. CORE GLOBAL IDENTITY: ACCOUNTS
-- Terhubung langsung ke Supabase Auth (auth.users)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  system_role TEXT DEFAULT 'USER' NOT NULL
);

-- 4. BUSINESS PROFILES & VERIFICATION (KYC)
-- Entitas bisnis hukum pemilik outlet (PT, CV, Perorangan, dll)
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  business_name TEXT,
  business_category TEXT,
  business_type TEXT DEFAULT 'INDIVIDUAL',
  address TEXT,
  city TEXT,
  postal_code TEXT,
  responsible_person_name TEXT NOT NULL,
  responsible_person_contact TEXT NOT NULL,
  responsible_person_email TEXT,
  business_description TEXT,
  business_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  tax_id TEXT,
  business_license_number TEXT,
  responsible_person_nik TEXT NOT NULL,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_holder TEXT,
  verification_status TEXT DEFAULT 'not_started' NOT NULL,
  responsible_person_position TEXT,
  responsible_person_nationality TEXT
);

-- 5. SETTLEMENT ACCOUNTS
-- Rekening bank tujuan pencairan dana (payout / disbursement)
CREATE TABLE IF NOT EXISTS settlement_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL,
  bank_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_account_number_masked TEXT NOT NULL,
  bank_account_holder TEXT NOT NULL,
  proof_document_key TEXT,
  verification_method TEXT DEFAULT 'MANUAL_REVIEW' NOT NULL,
  verification_status TEXT DEFAULT 'pending' NOT NULL,
  name_match_score INTEGER,
  verification_notes TEXT,
  is_default BOOLEAN DEFAULT false NOT NULL,
  doku_beneficiary_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. OUTLETS / RESTAURANTS: TENANTS
-- Unit restoran / toko cabang dengan pengaturan operasional, POS, dan pembayaran
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT,
  subscription_tier subscription_tier DEFAULT 'FREE'::subscription_tier NOT NULL,
  storefront_enabled BOOLEAN DEFAULT true NOT NULL,
  store_description TEXT,
  store_logo_url TEXT,
  store_banner_url TEXT,
  primary_color TEXT DEFAULT '#2563EB',
  dine_in_enabled BOOLEAN DEFAULT true NOT NULL,
  take_away_enabled BOOLEAN DEFAULT true NOT NULL,
  delivery_enabled BOOLEAN DEFAULT false NOT NULL,
  customer_name_required BOOLEAN DEFAULT true NOT NULL,
  customer_phone_required BOOLEAN DEFAULT false NOT NULL,
  table_number_required BOOLEAN DEFAULT false NOT NULL,
  order_process_type TEXT DEFAULT 'MANUAL' NOT NULL,
  pos_kitchen_sync BOOLEAN DEFAULT false NOT NULL,
  pos_require_customer BOOLEAN DEFAULT false NOT NULL,
  pos_order_type_selection TEXT DEFAULT 'MANUAL' NOT NULL,
  pos_tax_rate NUMERIC(5, 2) DEFAULT '0'::numeric NOT NULL,
  tax_name TEXT DEFAULT 'Pajak (PB1)' NOT NULL,
  service_charge_rate NUMERIC(5, 2) DEFAULT '0'::numeric NOT NULL,
  grab_food_fee_rate NUMERIC(5, 2) DEFAULT '20'::numeric NOT NULL,
  shopee_food_fee_rate NUMERIC(5, 2) DEFAULT '20'::numeric NOT NULL,
  go_food_fee_rate NUMERIC(5, 2) DEFAULT '20'::numeric NOT NULL,
  pos_pin_best_sellers BOOLEAN DEFAULT true NOT NULL,
  online_payment_enabled BOOLEAN DEFAULT false NOT NULL,
  midtrans_server_key TEXT,
  midtrans_client_key TEXT,
  midtrans_environment TEXT DEFAULT 'sandbox',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  outlet_key TEXT NOT NULL,
  receipt_header TEXT,
  receipt_footer TEXT,
  receipt_show_logo BOOLEAN DEFAULT true NOT NULL,
  receipt_show_customer BOOLEAN DEFAULT true NOT NULL,
  receipt_show_cashier BOOLEAN DEFAULT true NOT NULL,
  receipt_show_table BOOLEAN DEFAULT true NOT NULL,
  receipt_show_notes BOOLEAN DEFAULT true NOT NULL,
  receipt_custom_note TEXT,
  receipt_logo_url TEXT,
  kitchen_print_enabled BOOLEAN DEFAULT false NOT NULL,
  kitchen_ticket_title TEXT DEFAULT 'TIKET DAPUR',
  kitchen_ticket_notes TEXT,
  kitchen_show_customer BOOLEAN DEFAULT true NOT NULL,
  kitchen_show_cashier BOOLEAN DEFAULT true NOT NULL,
  kitchen_show_table BOOLEAN DEFAULT true NOT NULL,
  kitchen_show_notes BOOLEAN DEFAULT true NOT NULL,
  kitchen_auto_cut BOOLEAN DEFAULT true NOT NULL,
  order_prefix TEXT,
  doku_client_id TEXT,
  doku_secret_key TEXT,
  doku_sub_account_id TEXT,
  doku_environment TEXT DEFAULT 'sandbox',
  pos_rounding BOOLEAN DEFAULT false NOT NULL,
  open_hours TEXT,
  address TEXT,
  city TEXT,
  maps_url TEXT,
  cuisine_type TEXT,
  wifi_ssid TEXT,
  wifi_password TEXT,
  business_profile_id UUID,
  postal_code TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  storefront_photo_url TEXT,
  outlet_compliance_status TEXT DEFAULT 'incomplete' NOT NULL,
  doku_sub_account_status TEXT,
  doku_qris_merchant_id TEXT,
  doku_qris_terminal_id TEXT,
  settlement_account_id UUID,
  indoor_photo_url TEXT,
  province TEXT,
  district TEXT
);

-- 7. SAAS SUBSCRIPTIONS & BILLING
-- Paket langganan outlet Menuin (FREE, BASIC, PRO)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  plan TEXT NOT NULL,
  status subscription_status DEFAULT 'ACTIVE'::subscription_status NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. SUBSCRIPTION INVOICES
-- Tagihan pembayaran langganan bulanan / tahunan
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  plan_code TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount INTEGER NOT NULL,
  period_days INTEGER NOT NULL,
  status TEXT DEFAULT 'PENDING' NOT NULL,
  created_by_membership_id UUID,
  subscription_id UUID,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. OUTLET MEMBERSHIPS & TEAM ACCESS
-- Hak akses akun staf/manajer/kasir per outlet
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  display_name TEXT,
  pin_hash TEXT,
  role tenant_role DEFAULT 'STAFF'::tenant_role NOT NULL,
  status TEXT DEFAULT 'ACTIVE' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  account_id UUID NOT NULL
);

-- 10. TEAM INVITATIONS
-- Undangan staf baru melalui email
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  email TEXT NOT NULL,
  role tenant_role DEFAULT 'STAFF'::tenant_role NOT NULL,
  token_hash TEXT NOT NULL,
  status invitation_status DEFAULT 'PENDING'::invitation_status NOT NULL,
  invited_by UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 11. POS HARDWARE DEVICES
-- Tablet/Handphone kasir yang terotorisasi
CREATE TABLE IF NOT EXISTS pos_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  device_identifier TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE' NOT NULL,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 12. POS SESSIONS
-- Sesi login kasir pada device
CREATE TABLE IF NOT EXISTS pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  device_id UUID NOT NULL,
  membership_id UUID NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'ACTIVE' NOT NULL
);

-- 13. DEVICE PAIRING CODES
-- Kode 6 digit untuk pairing aplikasi mobile POS ke outlet
CREATE TABLE IF NOT EXISTS device_pairing_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  code TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 14. CASHIER SHIFTS
-- Shift kerja kasir dan rekonsiliasi kas laci (cash drawer)
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  membership_id UUID NOT NULL,
  device_id UUID,
  start_time TIMESTAMPTZ DEFAULT now() NOT NULL,
  end_time TIMESTAMPTZ,
  starting_cash NUMERIC(12, 2) DEFAULT '0'::numeric NOT NULL,
  actual_cash NUMERIC(12, 2),
  expected_cash NUMERIC(12, 2),
  cash_difference NUMERIC(12, 2),
  status TEXT DEFAULT 'ACTIVE' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 15. CASH MOVEMENTS (CASH IN / CASH OUT)
-- Pencatatan mutasi kas manual selama shift
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  shift_id UUID NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 16. PRODUCT CATEGORIES
-- Kategori menu makanan & minuman
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  icon TEXT
);

-- 17. PRODUCTS & MENU ITEMS
-- Item menu, harga, stok, dan pengaturan dapur
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  category_id UUID,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  barcode TEXT,
  price NUMERIC(12, 2) NOT NULL,
  cost_price NUMERIC(12, 2) NOT NULL,
  stock INTEGER DEFAULT 0 NOT NULL,
  min_stock INTEGER DEFAULT 5 NOT NULL,
  image_url TEXT,
  is_available_online BOOLEAN DEFAULT true NOT NULL,
  is_featured BOOLEAN DEFAULT false NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  track_stock BOOLEAN DEFAULT true NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  potongan NUMERIC(12, 2) DEFAULT 0
);

-- 18. MODIFIER GROUPS (TOPPING / LEVEL / VARIAN)
-- Kelompok pilihan modifier produk
CREATE TABLE IF NOT EXISTS modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false NOT NULL,
  min_selections INTEGER DEFAULT 0 NOT NULL,
  max_selections INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 19. MODIFIERS
-- Opsi modifier satuan dan harga tambahan
CREATE TABLE IF NOT EXISTS modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  group_id UUID NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(12, 2) DEFAULT '0'::numeric NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  is_available BOOLEAN DEFAULT true NOT NULL
);

-- 20. PRODUCT MODIFIER GROUPS (JUNCTION)
-- Relasi many-to-many produk ke kelompok modifier
CREATE TABLE IF NOT EXISTS product_modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  product_id UUID NOT NULL,
  modifier_group_id UUID NOT NULL
);

-- 21. STOCK MOVEMENTS (INVENTORY TRACKING)
-- Riwayat pergerakan stok bahan dan menu
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  product_id UUID NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER DEFAULT 0 NOT NULL,
  current_stock INTEGER DEFAULT 0 NOT NULL,
  reason TEXT,
  reference_id TEXT,
  actor_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 22. RESTAURANT TABLES & QR CODES
-- Meja makan dan token QR Code pemesanan dine-in
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  qr_code_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 23. OPERATING HOURS
-- Jam operasional buka/tutup harian outlet
CREATE TABLE IF NOT EXISTS operating_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL,
  open_time TEXT DEFAULT '09:00' NOT NULL,
  close_time TEXT DEFAULT '22:00' NOT NULL,
  is_closed BOOLEAN DEFAULT false NOT NULL
);

-- 24. PROMOTIONS & DISCOUNT VOUCHERS
-- Kode promo dan diskon harga transaksi
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'PERCENTAGE' NOT NULL,
  value NUMERIC(12, 2) NOT NULL,
  min_order NUMERIC(12, 2) DEFAULT '0'::numeric NOT NULL,
  max_discount NUMERIC(12, 2),
  is_active BOOLEAN DEFAULT true NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  target_type TEXT DEFAULT 'ALL' NOT NULL,
  applicable_product_ids JSONB DEFAULT '[]'::jsonb,
  min_product_qty INTEGER DEFAULT 1 NOT NULL
);

-- 25. TESTIMONIALS
-- Ulasan & rating publik untuk landing page
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT,
  rating NUMERIC(2, 1) DEFAULT 5.0 NOT NULL,
  content TEXT NOT NULL,
  sentiment TEXT DEFAULT 'Excellent' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 26. TRANSACTIONS & ORDERS (CENTRAL ORDER LEDGER)
-- Catatan transaksi penjualan POS, QR Storefront, dan Delivery
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  source TEXT DEFAULT 'POS' NOT NULL,
  pos_session_id UUID,
  cashier_membership_id UUID,
  total_amount NUMERIC(12, 2) NOT NULL,
  discount NUMERIC(12, 2) DEFAULT '0'::numeric,
  tax NUMERIC(12, 2) DEFAULT '0'::numeric,
  service_charge NUMERIC(12, 2) DEFAULT '0'::numeric,
  platform_fee NUMERIC(12, 2) DEFAULT '0'::numeric,
  grand_total NUMERIC(12, 2) NOT NULL,
  promo_code TEXT,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'PENDING' NOT NULL,
  status TEXT DEFAULT 'COMPLETED' NOT NULL,
  order_type TEXT DEFAULT 'DINE_IN' NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  table_number TEXT,
  public_token UUID DEFAULT gen_random_uuid(),
  order_number TEXT,
  snap_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  shift_id UUID,
  void_reason TEXT,
  voided_at TIMESTAMPTZ,
  voided_by_membership_id UUID,
  promotion_id UUID,
  gateway_fee NUMERIC(12, 2) DEFAULT 0 NOT NULL,
  net_amount NUMERIC(12, 2),
  rounding NUMERIC(12, 2) DEFAULT 0,
  idempotency_key TEXT,
  queue_number INTEGER
);

-- 27. TRANSACTION ITEMS
-- Detail rincian menu yang dipesan pada setiap transaksi
CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  transaction_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  modifiers JSONB,
  notes TEXT,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 28. ONLINE PAYMENTS (MIDTRANS AUDIT LOG)
-- Riwayat transaksi pembayaran Midtrans
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  transaction_id UUID NOT NULL,
  provider_transaction_id TEXT,
  provider TEXT DEFAULT 'MIDTRANS' NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT DEFAULT 'PENDING' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 29. PAYMENT ATTEMPTS (DOKU OMNICHANNEL & QRIS DINAMIS)
-- Percobaan pembayaran checkout dan QRIS
CREATE TABLE IF NOT EXISTS payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  purpose TEXT DEFAULT 'ORDER' NOT NULL,
  transaction_id UUID,
  subscription_invoice_id UUID,
  provider TEXT NOT NULL,
  product TEXT NOT NULL,
  environment TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'CREATED' NOT NULL,
  sub_account_id TEXT,
  payment_url TEXT,
  qr_content TEXT,
  gateway_merchant_id TEXT,
  provider_reference TEXT,
  provider_status TEXT,
  payment_channel TEXT,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  fee_amount INTEGER,
  net_amount INTEGER,
  fee_source TEXT,
  requires_review BOOLEAN DEFAULT false NOT NULL,
  review_reason TEXT,
  review_resolution TEXT,
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by_membership_id UUID,
  refunded_amount INTEGER,
  refund_reference TEXT,
  refunded_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  last_error TEXT,
  last_checked_at TIMESTAMPTZ,
  raw_create_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 30. PAYMENT WEBHOOK EVENTS (IDEMPOTENCY LEDGER)
-- Pencatatan event webhook DOKU untuk idempotensi
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  request_id TEXT NOT NULL,
  invoice_number TEXT,
  signature_valid BOOLEAN NOT NULL,
  headers JSONB,
  raw_body TEXT NOT NULL,
  processed_at TIMESTAMPTZ,
  result TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 31. PROVIDER ONBOARDINGS (DOKU SUB-ACCOUNTS)
-- Integrasi sub-account merchant DOKU untuk split settlement
CREATE TABLE IF NOT EXISTS provider_onboardings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  provider TEXT DEFAULT 'DOKU' NOT NULL,
  provider_reference TEXT,
  provider_status TEXT DEFAULT 'NOT_STARTED' NOT NULL,
  raw_response JSONB,
  last_error_code TEXT,
  last_error_message TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  idempotency_key TEXT
);

-- 32. INCOMES (PEMASUKAN NON-PENJUALAN)
-- Pencatatan arus kas masuk operasional
CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method TEXT DEFAULT 'TUNAI' NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT now() NOT NULL,
  receipt_url TEXT,
  created_by_membership_id UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 33. EXPENSES (PENGELUARAN RESTORAN)
-- Pengeluaran operasional outlet dan HPP
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method TEXT DEFAULT 'TUNAI' NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT now() NOT NULL,
  receipt_url TEXT,
  created_by_membership_id UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 34. CATEGORY BUDGETS
-- Anggaran batas pengeluaran per kategori per bulan
CREATE TABLE IF NOT EXISTS category_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  flow_type TEXT NOT NULL,
  category TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  period_month TEXT DEFAULT 'DEFAULT' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 35. DAILY SALES SUMMARIES
-- Agregasi penjualan harian teroptimasi untuk performa laporan
CREATE TABLE IF NOT EXISTS daily_sales_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0 NOT NULL,
  gross_sales NUMERIC(12, 2) DEFAULT '0'::numeric NOT NULL,
  discount NUMERIC(12, 2) DEFAULT '0'::numeric NOT NULL,
  net_sales NUMERIC(12, 2) DEFAULT '0'::numeric NOT NULL,
  tax NUMERIC(12, 2) DEFAULT '0'::numeric NOT NULL,
  service_charge NUMERIC(12, 2) DEFAULT '0'::numeric NOT NULL,
  cogs_hpp NUMERIC(12, 2) DEFAULT '0'::numeric NOT NULL,
  gross_profit NUMERIC(12, 2) DEFAULT '0'::numeric NOT NULL,
  cash_sales NUMERIC(12, 2) DEFAULT '0'::numeric NOT NULL,
  non_cash_sales NUMERIC(12, 2) DEFAULT '0'::numeric NOT NULL,
  pos_sales NUMERIC(12, 2) DEFAULT '0'::numeric NOT NULL,
  storefront_sales NUMERIC(12, 2) DEFAULT '0'::numeric NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 36. VERIFICATION SUBMISSIONS (KYC TIER)
-- Pengajuan berkas verifikasi identitas & usaha merchant
CREATE TABLE IF NOT EXISTS verification_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL,
  tenant_id UUID,
  submitted_by UUID,
  status TEXT DEFAULT 'draft' NOT NULL,
  review_notes TEXT,
  rejection_reason TEXT,
  action_required_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,
  version INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  submission_scope TEXT NOT NULL,
  attempt_number INTEGER DEFAULT 1 NOT NULL,
  submission_snapshot JSONB NOT NULL,
  decision_reason TEXT,
  internal_notes TEXT
);

-- 37. VERIFICATION DOCUMENTS
-- File dokumen legalitas pendukung (KTP, NPWP, NIB, dll)
CREATE TABLE IF NOT EXISTS verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  review_status TEXT DEFAULT 'pending' NOT NULL,
  review_note TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  reviewed_at TIMESTAMPTZ,
  tenant_id UUID,
  document_scope TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL
);

-- 38. VERIFICATION SECTION REVIEWS
-- Peninjauan review per seksi pengajuan oleh tim verifikasi
CREATE TABLE IF NOT EXISTS verification_section_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL,
  section TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  flagged_fields JSONB,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 39. VERIFICATION DRAFTS
-- Draf sementara formulir verifikasi multi-step
CREATE TABLE IF NOT EXISTS verification_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL,
  current_step INTEGER DEFAULT 1 NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 40. VERIFICATION AUDIT LOGS
-- Jejak audit perubahan status kepatuhan & verifikasi
CREATE TABLE IF NOT EXISTS verification_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID,
  actor_id UUID,
  actor_role TEXT,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  business_profile_id UUID NOT NULL,
  tenant_id UUID,
  ip_address TEXT
);

-- 41. CARE TICKETS (MERCHANT SUPPORT TICKETING)
-- Tiket bantuan pengaduan dan kendala verifikasi
CREATE TABLE IF NOT EXISTS care_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL,
  tenant_id UUID,
  account_id UUID,
  verification_submission_id UUID,
  category TEXT DEFAULT 'BUSINESS_VERIFICATION' NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'NORMAL' NOT NULL,
  status TEXT DEFAULT 'open' NOT NULL,
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 42. SYSTEM RATE LIMITS
-- Pembatasan request berbasis IP dan pencegahan brute-force
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT,
  action TEXT NOT NULL,
  attempts INTEGER DEFAULT 1 NOT NULL,
  lock_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 43. SYSTEM AUDIT LOGS
-- Rekam aktivitas aksi krusial pengguna di sistem
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  actor_membership_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  account_id UUID,
  entity_type TEXT,
  entity_id TEXT
);

-- ==============================================================================
-- 4. CONSTRAINTS (UNIQUE & CHECK CONSTRAINTS)
-- ==============================================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'accounts_auth_user_id_unique' AND conrelid = 'accounts'::regclass
  ) THEN
    ALTER TABLE accounts ADD CONSTRAINT accounts_auth_user_id_unique UNIQUE (auth_user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'care_tickets_ticket_number_key' AND conrelid = 'care_tickets'::regclass
  ) THEN
    ALTER TABLE care_tickets ADD CONSTRAINT care_tickets_ticket_number_key UNIQUE (ticket_number);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_tenant_id_unique' AND conrelid = 'categories'::regclass
  ) THEN
    ALTER TABLE categories ADD CONSTRAINT categories_tenant_id_unique UNIQUE (tenant_id, id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_tenant_slug_unique' AND conrelid = 'categories'::regclass
  ) THEN
    ALTER TABLE categories ADD CONSTRAINT categories_tenant_slug_unique UNIQUE (tenant_id, slug);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_summary_tenant_date_unique' AND conrelid = 'daily_sales_summaries'::regclass
  ) THEN
    ALTER TABLE daily_sales_summaries ADD CONSTRAINT daily_summary_tenant_date_unique UNIQUE (tenant_id, date);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'device_pairing_codes_code_key' AND conrelid = 'device_pairing_codes'::regclass
  ) THEN
    ALTER TABLE device_pairing_codes ADD CONSTRAINT device_pairing_codes_code_key UNIQUE (code);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'device_pairing_codes_code_unique' AND conrelid = 'device_pairing_codes'::regclass
  ) THEN
    ALTER TABLE device_pairing_codes ADD CONSTRAINT device_pairing_codes_code_unique UNIQUE (code);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_account_tenant_unique' AND conrelid = 'memberships'::regclass
  ) THEN
    ALTER TABLE memberships ADD CONSTRAINT memberships_account_tenant_unique UNIQUE (account_id, tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_tenant_id_unique' AND conrelid = 'memberships'::regclass
  ) THEN
    ALTER TABLE memberships ADD CONSTRAINT memberships_tenant_id_unique UNIQUE (tenant_id, id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'modifier_groups_tenant_id_unique' AND conrelid = 'modifier_groups'::regclass
  ) THEN
    ALTER TABLE modifier_groups ADD CONSTRAINT modifier_groups_tenant_id_unique UNIQUE (tenant_id, id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'modifiers_tenant_id_unique' AND conrelid = 'modifiers'::regclass
  ) THEN
    ALTER TABLE modifiers ADD CONSTRAINT modifiers_tenant_id_unique UNIQUE (tenant_id, id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pos_devices_device_identifier_unique' AND conrelid = 'pos_devices'::regclass
  ) THEN
    ALTER TABLE pos_devices ADD CONSTRAINT pos_devices_device_identifier_unique UNIQUE (device_identifier);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pos_devices_tenant_id_unique' AND conrelid = 'pos_devices'::regclass
  ) THEN
    ALTER TABLE pos_devices ADD CONSTRAINT pos_devices_tenant_id_unique UNIQUE (tenant_id, id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pos_sessions_tenant_id_unique' AND conrelid = 'pos_sessions'::regclass
  ) THEN
    ALTER TABLE pos_sessions ADD CONSTRAINT pos_sessions_tenant_id_unique UNIQUE (tenant_id, id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_tenant_barcode_unique' AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_tenant_barcode_unique UNIQUE (tenant_id, barcode);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_tenant_id_unique' AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_tenant_id_unique UNIQUE (tenant_id, id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_tenant_sku_unique' AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_tenant_sku_unique UNIQUE (tenant_id, sku);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'promotions_tenant_code_unique' AND conrelid = 'promotions'::regclass
  ) THEN
    ALTER TABLE promotions ADD CONSTRAINT promotions_tenant_code_unique UNIQUE (tenant_id, code);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shifts_tenant_id_unique' AND conrelid = 'shifts'::regclass
  ) THEN
    ALTER TABLE shifts ADD CONSTRAINT shifts_tenant_id_unique UNIQUE (tenant_id, id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenants_outlet_key_unique' AND conrelid = 'tenants'::regclass
  ) THEN
    ALTER TABLE tenants ADD CONSTRAINT tenants_outlet_key_unique UNIQUE (outlet_key);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenants_slug_unique' AND conrelid = 'tenants'::regclass
  ) THEN
    ALTER TABLE tenants ADD CONSTRAINT tenants_slug_unique UNIQUE (slug);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_public_token_unique' AND conrelid = 'transactions'::regclass
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_public_token_unique UNIQUE (public_token);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_tenant_id_unique' AND conrelid = 'transactions'::regclass
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_tenant_id_unique UNIQUE (tenant_id, id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_tenant_order_unique' AND conrelid = 'transactions'::regclass
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_tenant_order_unique UNIQUE (tenant_id, order_number);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_drafts_tenant_id_unique' AND conrelid = 'verification_drafts'::regclass
  ) THEN
    ALTER TABLE verification_drafts ADD CONSTRAINT verification_drafts_tenant_id_unique UNIQUE (tenant_id);
  END IF;
END $$;


-- ==============================================================================
-- 5. FOREIGN KEY CONSTRAINTS
-- ==============================================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'accounts_auth_user_id_users_id_fk' AND conrelid = 'accounts'::regclass
  ) THEN
    ALTER TABLE accounts ADD CONSTRAINT accounts_auth_user_id_users_id_fk FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_account_id_accounts_id_fk' AND conrelid = 'audit_logs'::regclass
  ) THEN
    ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_account_id_accounts_id_fk FOREIGN KEY (account_id) REFERENCES accounts(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_tenant_id_actor_membership_id_memberships_tenant_id_' AND conrelid = 'audit_logs'::regclass
  ) THEN
    ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_tenant_id_actor_membership_id_memberships_tenant_id_ FOREIGN KEY (tenant_id, actor_membership_id) REFERENCES memberships(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_tenant_id_tenants_id_fk' AND conrelid = 'audit_logs'::regclass
  ) THEN
    ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'business_profiles_account_id_accounts_id_fk' AND conrelid = 'business_profiles'::regclass
  ) THEN
    ALTER TABLE business_profiles ADD CONSTRAINT business_profiles_account_id_accounts_id_fk FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'business_profiles_account_id_fkey' AND conrelid = 'business_profiles'::regclass
  ) THEN
    ALTER TABLE business_profiles ADD CONSTRAINT business_profiles_account_id_fkey FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'care_tickets_account_id_fkey' AND conrelid = 'care_tickets'::regclass
  ) THEN
    ALTER TABLE care_tickets ADD CONSTRAINT care_tickets_account_id_fkey FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'care_tickets_assigned_to_fkey' AND conrelid = 'care_tickets'::regclass
  ) THEN
    ALTER TABLE care_tickets ADD CONSTRAINT care_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES accounts(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'care_tickets_tenant_id_fkey' AND conrelid = 'care_tickets'::regclass
  ) THEN
    ALTER TABLE care_tickets ADD CONSTRAINT care_tickets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'care_tickets_verification_submission_id_fkey' AND conrelid = 'care_tickets'::regclass
  ) THEN
    ALTER TABLE care_tickets ADD CONSTRAINT care_tickets_verification_submission_id_fkey FOREIGN KEY (verification_submission_id) REFERENCES verification_submissions(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cash_movements_tenant_id_shift_id_shifts_tenant_id_id_fk' AND conrelid = 'cash_movements'::regclass
  ) THEN
    ALTER TABLE cash_movements ADD CONSTRAINT cash_movements_tenant_id_shift_id_shifts_tenant_id_id_fk FOREIGN KEY (tenant_id, shift_id) REFERENCES shifts(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cash_movements_tenant_id_tenants_id_fk' AND conrelid = 'cash_movements'::regclass
  ) THEN
    ALTER TABLE cash_movements ADD CONSTRAINT cash_movements_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_tenant_id_tenants_id_fk' AND conrelid = 'categories'::regclass
  ) THEN
    ALTER TABLE categories ADD CONSTRAINT categories_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'category_budgets_tenant_id_fkey' AND conrelid = 'category_budgets'::regclass
  ) THEN
    ALTER TABLE category_budgets ADD CONSTRAINT category_budgets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'category_budgets_tenant_id_tenants_id_fk' AND conrelid = 'category_budgets'::regclass
  ) THEN
    ALTER TABLE category_budgets ADD CONSTRAINT category_budgets_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_sales_summaries_tenant_id_tenants_id_fk' AND conrelid = 'daily_sales_summaries'::regclass
  ) THEN
    ALTER TABLE daily_sales_summaries ADD CONSTRAINT daily_sales_summaries_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'device_pairing_codes_tenant_id_fkey' AND conrelid = 'device_pairing_codes'::regclass
  ) THEN
    ALTER TABLE device_pairing_codes ADD CONSTRAINT device_pairing_codes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'device_pairing_codes_tenant_id_tenants_id_fk' AND conrelid = 'device_pairing_codes'::regclass
  ) THEN
    ALTER TABLE device_pairing_codes ADD CONSTRAINT device_pairing_codes_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_tenant_id_fkey' AND conrelid = 'expenses'::regclass
  ) THEN
    ALTER TABLE expenses ADD CONSTRAINT expenses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_tenant_id_tenants_id_fk' AND conrelid = 'expenses'::regclass
  ) THEN
    ALTER TABLE expenses ADD CONSTRAINT expenses_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'incomes_tenant_id_fkey' AND conrelid = 'incomes'::regclass
  ) THEN
    ALTER TABLE incomes ADD CONSTRAINT incomes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'incomes_tenant_id_tenants_id_fk' AND conrelid = 'incomes'::regclass
  ) THEN
    ALTER TABLE incomes ADD CONSTRAINT incomes_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invitations_tenant_id_invited_by_memberships_tenant_id_id_fk' AND conrelid = 'invitations'::regclass
  ) THEN
    ALTER TABLE invitations ADD CONSTRAINT invitations_tenant_id_invited_by_memberships_tenant_id_id_fk FOREIGN KEY (tenant_id, invited_by) REFERENCES memberships(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invitations_tenant_id_tenants_id_fk' AND conrelid = 'invitations'::regclass
  ) THEN
    ALTER TABLE invitations ADD CONSTRAINT invitations_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_account_id_accounts_id_fk' AND conrelid = 'memberships'::regclass
  ) THEN
    ALTER TABLE memberships ADD CONSTRAINT memberships_account_id_accounts_id_fk FOREIGN KEY (account_id) REFERENCES accounts(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_tenant_id_tenants_id_fk' AND conrelid = 'memberships'::regclass
  ) THEN
    ALTER TABLE memberships ADD CONSTRAINT memberships_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'modifier_groups_tenant_id_tenants_id_fk' AND conrelid = 'modifier_groups'::regclass
  ) THEN
    ALTER TABLE modifier_groups ADD CONSTRAINT modifier_groups_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'modifiers_tenant_id_group_id_modifier_groups_tenant_id_id_fk' AND conrelid = 'modifiers'::regclass
  ) THEN
    ALTER TABLE modifiers ADD CONSTRAINT modifiers_tenant_id_group_id_modifier_groups_tenant_id_id_fk FOREIGN KEY (tenant_id, group_id) REFERENCES modifier_groups(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'modifiers_tenant_id_tenants_id_fk' AND conrelid = 'modifiers'::regclass
  ) THEN
    ALTER TABLE modifiers ADD CONSTRAINT modifiers_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'operating_hours_tenant_id_tenants_id_fk' AND conrelid = 'operating_hours'::regclass
  ) THEN
    ALTER TABLE operating_hours ADD CONSTRAINT operating_hours_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_attempts_sub_invoice_fk' AND conrelid = 'payment_attempts'::regclass
  ) THEN
    ALTER TABLE payment_attempts ADD CONSTRAINT payment_attempts_sub_invoice_fk FOREIGN KEY (subscription_invoice_id) REFERENCES subscription_invoices(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_attempts_tenant_id_tenants_id_fk' AND conrelid = 'payment_attempts'::regclass
  ) THEN
    ALTER TABLE payment_attempts ADD CONSTRAINT payment_attempts_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_attempts_transaction_fk' AND conrelid = 'payment_attempts'::regclass
  ) THEN
    ALTER TABLE payment_attempts ADD CONSTRAINT payment_attempts_transaction_fk FOREIGN KEY (tenant_id, transaction_id) REFERENCES transactions(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_tenant_id_tenants_id_fk' AND conrelid = 'payments'::regclass
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_tenant_id_transaction_id_transactions_tenant_id_id_fk' AND conrelid = 'payments'::regclass
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_tenant_id_transaction_id_transactions_tenant_id_id_fk FOREIGN KEY (tenant_id, transaction_id) REFERENCES transactions(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pos_devices_tenant_id_tenants_id_fk' AND conrelid = 'pos_devices'::regclass
  ) THEN
    ALTER TABLE pos_devices ADD CONSTRAINT pos_devices_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pos_sessions_tenant_id_device_id_pos_devices_tenant_id_id_fk' AND conrelid = 'pos_sessions'::regclass
  ) THEN
    ALTER TABLE pos_sessions ADD CONSTRAINT pos_sessions_tenant_id_device_id_pos_devices_tenant_id_id_fk FOREIGN KEY (tenant_id, device_id) REFERENCES pos_devices(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pos_sessions_tenant_id_membership_id_memberships_tenant_id_id_f' AND conrelid = 'pos_sessions'::regclass
  ) THEN
    ALTER TABLE pos_sessions ADD CONSTRAINT pos_sessions_tenant_id_membership_id_memberships_tenant_id_id_f FOREIGN KEY (tenant_id, membership_id) REFERENCES memberships(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pos_sessions_tenant_id_tenants_id_fk' AND conrelid = 'pos_sessions'::regclass
  ) THEN
    ALTER TABLE pos_sessions ADD CONSTRAINT pos_sessions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_modifier_groups_tenant_id_modifier_group_id_modifier_gr' AND conrelid = 'product_modifier_groups'::regclass
  ) THEN
    ALTER TABLE product_modifier_groups ADD CONSTRAINT product_modifier_groups_tenant_id_modifier_group_id_modifier_gr FOREIGN KEY (tenant_id, modifier_group_id) REFERENCES modifier_groups(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_modifier_groups_tenant_id_product_id_products_tenant_id' AND conrelid = 'product_modifier_groups'::regclass
  ) THEN
    ALTER TABLE product_modifier_groups ADD CONSTRAINT product_modifier_groups_tenant_id_product_id_products_tenant_id FOREIGN KEY (tenant_id, product_id) REFERENCES products(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_modifier_groups_tenant_id_tenants_id_fk' AND conrelid = 'product_modifier_groups'::regclass
  ) THEN
    ALTER TABLE product_modifier_groups ADD CONSTRAINT product_modifier_groups_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_tenant_id_category_id_categories_tenant_id_id_fk' AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_tenant_id_category_id_categories_tenant_id_id_fk FOREIGN KEY (tenant_id, category_id) REFERENCES categories(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_tenant_id_tenants_id_fk' AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'promotions_tenant_id_tenants_id_fk' AND conrelid = 'promotions'::regclass
  ) THEN
    ALTER TABLE promotions ADD CONSTRAINT promotions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'provider_onboardings_business_profile_id_business_profiles_id_f' AND conrelid = 'provider_onboardings'::regclass
  ) THEN
    ALTER TABLE provider_onboardings ADD CONSTRAINT provider_onboardings_business_profile_id_business_profiles_id_f FOREIGN KEY (business_profile_id) REFERENCES business_profiles(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'provider_onboardings_business_profile_id_fkey' AND conrelid = 'provider_onboardings'::regclass
  ) THEN
    ALTER TABLE provider_onboardings ADD CONSTRAINT provider_onboardings_business_profile_id_fkey FOREIGN KEY (business_profile_id) REFERENCES business_profiles(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'provider_onboardings_tenant_id_fkey' AND conrelid = 'provider_onboardings'::regclass
  ) THEN
    ALTER TABLE provider_onboardings ADD CONSTRAINT provider_onboardings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'provider_onboardings_tenant_id_tenants_id_fk' AND conrelid = 'provider_onboardings'::regclass
  ) THEN
    ALTER TABLE provider_onboardings ADD CONSTRAINT provider_onboardings_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'settlement_accounts_business_profile_id_business_profiles_id_fk' AND conrelid = 'settlement_accounts'::regclass
  ) THEN
    ALTER TABLE settlement_accounts ADD CONSTRAINT settlement_accounts_business_profile_id_business_profiles_id_fk FOREIGN KEY (business_profile_id) REFERENCES business_profiles(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'settlement_accounts_business_profile_id_fkey' AND conrelid = 'settlement_accounts'::regclass
  ) THEN
    ALTER TABLE settlement_accounts ADD CONSTRAINT settlement_accounts_business_profile_id_fkey FOREIGN KEY (business_profile_id) REFERENCES business_profiles(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shifts_tenant_id_device_id_pos_devices_tenant_id_id_fk' AND conrelid = 'shifts'::regclass
  ) THEN
    ALTER TABLE shifts ADD CONSTRAINT shifts_tenant_id_device_id_pos_devices_tenant_id_id_fk FOREIGN KEY (tenant_id, device_id) REFERENCES pos_devices(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shifts_tenant_id_membership_id_memberships_tenant_id_id_fk' AND conrelid = 'shifts'::regclass
  ) THEN
    ALTER TABLE shifts ADD CONSTRAINT shifts_tenant_id_membership_id_memberships_tenant_id_id_fk FOREIGN KEY (tenant_id, membership_id) REFERENCES memberships(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shifts_tenant_id_tenants_id_fk' AND conrelid = 'shifts'::regclass
  ) THEN
    ALTER TABLE shifts ADD CONSTRAINT shifts_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_product_id_fkey' AND conrelid = 'stock_movements'::regclass
  ) THEN
    ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_tenant_id_fkey' AND conrelid = 'stock_movements'::regclass
  ) THEN
    ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscription_invoices_subscription_id_subscriptions_id_fk' AND conrelid = 'subscription_invoices'::regclass
  ) THEN
    ALTER TABLE subscription_invoices ADD CONSTRAINT subscription_invoices_subscription_id_subscriptions_id_fk FOREIGN KEY (subscription_id) REFERENCES subscriptions(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscription_invoices_tenant_id_tenants_id_fk' AND conrelid = 'subscription_invoices'::regclass
  ) THEN
    ALTER TABLE subscription_invoices ADD CONSTRAINT subscription_invoices_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_tenant_id_tenants_id_fk' AND conrelid = 'subscriptions'::regclass
  ) THEN
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tables_tenant_id_tenants_id_fk' AND conrelid = 'tables'::regclass
  ) THEN
    ALTER TABLE tables ADD CONSTRAINT tables_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenants_business_profile_id_business_profiles_id_fk' AND conrelid = 'tenants'::regclass
  ) THEN
    ALTER TABLE tenants ADD CONSTRAINT tenants_business_profile_id_business_profiles_id_fk FOREIGN KEY (business_profile_id) REFERENCES business_profiles(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenants_settlement_account_id_fkey' AND conrelid = 'tenants'::regclass
  ) THEN
    ALTER TABLE tenants ADD CONSTRAINT tenants_settlement_account_id_fkey FOREIGN KEY (settlement_account_id) REFERENCES settlement_accounts(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenants_settlement_account_id_settlement_accounts_id_fk' AND conrelid = 'tenants'::regclass
  ) THEN
    ALTER TABLE tenants ADD CONSTRAINT tenants_settlement_account_id_settlement_accounts_id_fk FOREIGN KEY (settlement_account_id) REFERENCES settlement_accounts(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transaction_items_tenant_id_product_id_products_tenant_id_id_fk' AND conrelid = 'transaction_items'::regclass
  ) THEN
    ALTER TABLE transaction_items ADD CONSTRAINT transaction_items_tenant_id_product_id_products_tenant_id_id_fk FOREIGN KEY (tenant_id, product_id) REFERENCES products(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transaction_items_tenant_id_tenants_id_fk' AND conrelid = 'transaction_items'::regclass
  ) THEN
    ALTER TABLE transaction_items ADD CONSTRAINT transaction_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transaction_items_tenant_id_transaction_id_transactions_tenant_' AND conrelid = 'transaction_items'::regclass
  ) THEN
    ALTER TABLE transaction_items ADD CONSTRAINT transaction_items_tenant_id_transaction_id_transactions_tenant_ FOREIGN KEY (tenant_id, transaction_id) REFERENCES transactions(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_promotion_id_fkey' AND conrelid = 'transactions'::regclass
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_promotion_id_promotions_id_fk' AND conrelid = 'transactions'::regclass
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_promotion_id_promotions_id_fk FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_tenant_id_cashier_membership_id_memberships_tenant' AND conrelid = 'transactions'::regclass
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_tenant_id_cashier_membership_id_memberships_tenant FOREIGN KEY (tenant_id, cashier_membership_id) REFERENCES memberships(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_tenant_id_pos_session_id_pos_sessions_tenant_id_id' AND conrelid = 'transactions'::regclass
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_tenant_id_pos_session_id_pos_sessions_tenant_id_id FOREIGN KEY (tenant_id, pos_session_id) REFERENCES pos_sessions(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_tenant_id_shift_id_shifts_tenant_id_id_fk' AND conrelid = 'transactions'::regclass
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_tenant_id_shift_id_shifts_tenant_id_id_fk FOREIGN KEY (tenant_id, shift_id) REFERENCES shifts(tenant_id, id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_tenant_id_tenants_id_fk' AND conrelid = 'transactions'::regclass
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_audit_logs_actor_id_accounts_id_fk' AND conrelid = 'verification_audit_logs'::regclass
  ) THEN
    ALTER TABLE verification_audit_logs ADD CONSTRAINT verification_audit_logs_actor_id_accounts_id_fk FOREIGN KEY (actor_id) REFERENCES accounts(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_audit_logs_actor_id_fkey' AND conrelid = 'verification_audit_logs'::regclass
  ) THEN
    ALTER TABLE verification_audit_logs ADD CONSTRAINT verification_audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES accounts(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_audit_logs_business_profile_id_business_profiles_i' AND conrelid = 'verification_audit_logs'::regclass
  ) THEN
    ALTER TABLE verification_audit_logs ADD CONSTRAINT verification_audit_logs_business_profile_id_business_profiles_i FOREIGN KEY (business_profile_id) REFERENCES business_profiles(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_audit_logs_submission_id_fkey' AND conrelid = 'verification_audit_logs'::regclass
  ) THEN
    ALTER TABLE verification_audit_logs ADD CONSTRAINT verification_audit_logs_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_audit_logs_submission_id_verification_submissions_' AND conrelid = 'verification_audit_logs'::regclass
  ) THEN
    ALTER TABLE verification_audit_logs ADD CONSTRAINT verification_audit_logs_submission_id_verification_submissions_ FOREIGN KEY (submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_audit_logs_tenant_id_tenants_id_fk' AND conrelid = 'verification_audit_logs'::regclass
  ) THEN
    ALTER TABLE verification_audit_logs ADD CONSTRAINT verification_audit_logs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_documents_submission_id_fkey' AND conrelid = 'verification_documents'::regclass
  ) THEN
    ALTER TABLE verification_documents ADD CONSTRAINT verification_documents_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_documents_submission_id_verification_submissions_i' AND conrelid = 'verification_documents'::regclass
  ) THEN
    ALTER TABLE verification_documents ADD CONSTRAINT verification_documents_submission_id_verification_submissions_i FOREIGN KEY (submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_documents_tenant_id_tenants_id_fk' AND conrelid = 'verification_documents'::regclass
  ) THEN
    ALTER TABLE verification_documents ADD CONSTRAINT verification_documents_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_drafts_account_id_accounts_id_fk' AND conrelid = 'verification_drafts'::regclass
  ) THEN
    ALTER TABLE verification_drafts ADD CONSTRAINT verification_drafts_account_id_accounts_id_fk FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_drafts_tenant_id_tenants_id_fk' AND conrelid = 'verification_drafts'::regclass
  ) THEN
    ALTER TABLE verification_drafts ADD CONSTRAINT verification_drafts_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_section_reviews_reviewed_by_accounts_id_fk' AND conrelid = 'verification_section_reviews'::regclass
  ) THEN
    ALTER TABLE verification_section_reviews ADD CONSTRAINT verification_section_reviews_reviewed_by_accounts_id_fk FOREIGN KEY (reviewed_by) REFERENCES accounts(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_section_reviews_submission_id_verification_submiss' AND conrelid = 'verification_section_reviews'::regclass
  ) THEN
    ALTER TABLE verification_section_reviews ADD CONSTRAINT verification_section_reviews_submission_id_verification_submiss FOREIGN KEY (submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_submissions_business_profile_id_business_profiles_' AND conrelid = 'verification_submissions'::regclass
  ) THEN
    ALTER TABLE verification_submissions ADD CONSTRAINT verification_submissions_business_profile_id_business_profiles_ FOREIGN KEY (business_profile_id) REFERENCES business_profiles(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_submissions_business_profile_id_fkey' AND conrelid = 'verification_submissions'::regclass
  ) THEN
    ALTER TABLE verification_submissions ADD CONSTRAINT verification_submissions_business_profile_id_fkey FOREIGN KEY (business_profile_id) REFERENCES business_profiles(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_submissions_reviewed_by_accounts_id_fk' AND conrelid = 'verification_submissions'::regclass
  ) THEN
    ALTER TABLE verification_submissions ADD CONSTRAINT verification_submissions_reviewed_by_accounts_id_fk FOREIGN KEY (reviewed_by) REFERENCES accounts(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_submissions_reviewed_by_fkey' AND conrelid = 'verification_submissions'::regclass
  ) THEN
    ALTER TABLE verification_submissions ADD CONSTRAINT verification_submissions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES accounts(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_submissions_submitted_by_fkey' AND conrelid = 'verification_submissions'::regclass
  ) THEN
    ALTER TABLE verification_submissions ADD CONSTRAINT verification_submissions_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES accounts(id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_submissions_tenant_id_fkey' AND conrelid = 'verification_submissions'::regclass
  ) THEN
    ALTER TABLE verification_submissions ADD CONSTRAINT verification_submissions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_submissions_tenant_id_tenants_id_fk' AND conrelid = 'verification_submissions'::regclass
  ) THEN
    ALTER TABLE verification_submissions ADD CONSTRAINT verification_submissions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- ==============================================================================
-- 6. PERFORMANCE & FILTER INDEXES
-- ==============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS accounts_auth_user_id_unique ON public.accounts USING btree (auth_user_id);
CREATE INDEX IF NOT EXISTS accounts_system_role_idx ON public.accounts USING btree (system_role);
CREATE INDEX IF NOT EXISTS idx_business_profiles_account ON public.business_profiles USING btree (account_id);
CREATE UNIQUE INDEX IF NOT EXISTS care_tickets_ticket_number_key ON public.care_tickets USING btree (ticket_number);
CREATE INDEX IF NOT EXISTS idx_care_tickets_verification ON public.care_tickets USING btree (verification_submission_id);
CREATE UNIQUE INDEX IF NOT EXISTS categories_tenant_id_unique ON public.categories USING btree (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS categories_tenant_slug_unique ON public.categories USING btree (tenant_id, slug);
CREATE UNIQUE INDEX IF NOT EXISTS category_budgets_tenant_flow_cat_month_idx ON public.category_budgets USING btree (tenant_id, flow_type, category, period_month);
CREATE INDEX IF NOT EXISTS daily_summary_tenant_date_idx ON public.daily_sales_summaries USING btree (tenant_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS daily_summary_tenant_date_unique ON public.daily_sales_summaries USING btree (tenant_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS device_pairing_codes_code_key ON public.device_pairing_codes USING btree (code);
CREATE UNIQUE INDEX IF NOT EXISTS device_pairing_codes_code_unique ON public.device_pairing_codes USING btree (code);
CREATE INDEX IF NOT EXISTS expenses_tenant_date_idx ON public.expenses USING btree (tenant_id, date);
CREATE INDEX IF NOT EXISTS incomes_date_idx ON public.incomes USING btree (date);
CREATE INDEX IF NOT EXISTS incomes_tenant_id_idx ON public.incomes USING btree (tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS pending_invitation_idx ON public.invitations USING btree (tenant_id, email) WHERE (status = 'PENDING'::invitation_status);
CREATE UNIQUE INDEX IF NOT EXISTS memberships_account_tenant_unique ON public.memberships USING btree (account_id, tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS memberships_tenant_id_unique ON public.memberships USING btree (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS modifier_groups_tenant_id_unique ON public.modifier_groups USING btree (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS modifiers_tenant_id_unique ON public.modifiers USING btree (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_one_active_per_sub_invoice_uq ON public.payment_attempts USING btree (subscription_invoice_id) WHERE (status = ANY (ARRAY['CREATED'::text, 'PENDING'::text]));
CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_one_active_per_tx_uq ON public.payment_attempts USING btree (transaction_id) WHERE (status = ANY (ARRAY['CREATED'::text, 'PENDING'::text]));
CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_provider_invoice_uq ON public.payment_attempts USING btree (provider, invoice_number);
CREATE INDEX IF NOT EXISTS payment_attempts_review_idx ON public.payment_attempts USING btree (tenant_id, requires_review, reviewed_at);
CREATE INDEX IF NOT EXISTS payment_attempts_status_created_idx ON public.payment_attempts USING btree (status, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS payment_webhook_events_provider_request_uq ON public.payment_webhook_events USING btree (provider, request_id);
CREATE UNIQUE INDEX IF NOT EXISTS pos_devices_device_identifier_unique ON public.pos_devices USING btree (device_identifier);
CREATE UNIQUE INDEX IF NOT EXISTS pos_devices_tenant_id_unique ON public.pos_devices USING btree (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS pos_sessions_tenant_id_unique ON public.pos_sessions USING btree (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS products_tenant_barcode_unique ON public.products USING btree (tenant_id, barcode);
CREATE UNIQUE INDEX IF NOT EXISTS products_tenant_id_unique ON public.products USING btree (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS products_tenant_sku_unique ON public.products USING btree (tenant_id, sku);
CREATE UNIQUE INDEX IF NOT EXISTS promotions_tenant_code_unique ON public.promotions USING btree (tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_provider_onboardings_tenant ON public.provider_onboardings USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS provider_onboardings_profile_idx ON public.provider_onboardings USING btree (business_profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS provider_onboardings_provider_tenant_idx ON public.provider_onboardings USING btree (provider, tenant_id);
CREATE INDEX IF NOT EXISTS settlement_accounts_profile_idx ON public.settlement_accounts USING btree (business_profile_id);
CREATE INDEX IF NOT EXISTS settlement_accounts_status_idx ON public.settlement_accounts USING btree (verification_status);
CREATE UNIQUE INDEX IF NOT EXISTS shifts_tenant_id_unique ON public.shifts USING btree (tenant_id, id);
CREATE INDEX IF NOT EXISTS stock_movements_product_idx ON public.stock_movements USING btree (product_id);
CREATE INDEX IF NOT EXISTS stock_movements_tenant_idx ON public.stock_movements USING btree (tenant_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS subscription_invoices_one_pending_uq ON public.subscription_invoices USING btree (tenant_id) WHERE (status = 'PENDING'::text);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_sub_idx ON public.subscriptions USING btree (tenant_id) WHERE (status = 'ACTIVE'::subscription_status);
CREATE UNIQUE INDEX IF NOT EXISTS tenants_outlet_key_unique ON public.tenants USING btree (outlet_key);
CREATE INDEX IF NOT EXISTS tenants_settlement_account_idx ON public.tenants USING btree (settlement_account_id);
CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug_unique ON public.tenants USING btree (slug);
CREATE INDEX IF NOT EXISTS trx_items_tenant_completed_idx ON public.transaction_items USING btree (tenant_id, is_completed);
CREATE INDEX IF NOT EXISTS trx_items_tenant_trx_idx ON public.transaction_items USING btree (tenant_id, transaction_id);
CREATE UNIQUE INDEX IF NOT EXISTS transactions_public_token_unique ON public.transactions USING btree (public_token);
CREATE INDEX IF NOT EXISTS transactions_tenant_created_idx ON public.transactions USING btree (tenant_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS transactions_tenant_id_unique ON public.transactions USING btree (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS transactions_tenant_idempotency_unique ON public.transactions USING btree (tenant_id, idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS transactions_tenant_order_unique ON public.transactions USING btree (tenant_id, order_number);
CREATE INDEX IF NOT EXISTS transactions_tenant_status_created_idx ON public.transactions USING btree (tenant_id, status, created_at);
CREATE INDEX IF NOT EXISTS transactions_tenant_status_idx ON public.transactions USING btree (tenant_id, payment_status, created_at);
CREATE INDEX IF NOT EXISTS idx_verification_audit_logs_submission ON public.verification_audit_logs USING btree (submission_id);
CREATE INDEX IF NOT EXISTS verification_audit_logs_profile_idx ON public.verification_audit_logs USING btree (business_profile_id, created_at);
CREATE INDEX IF NOT EXISTS verification_audit_logs_tenant_idx ON public.verification_audit_logs USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_verification_documents_submission ON public.verification_documents USING btree (submission_id);
CREATE INDEX IF NOT EXISTS verification_documents_submission_idx ON public.verification_documents USING btree (submission_id, review_status);
CREATE INDEX IF NOT EXISTS verification_documents_tenant_idx ON public.verification_documents USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS verification_drafts_account_idx ON public.verification_drafts USING btree (account_id);
CREATE UNIQUE INDEX IF NOT EXISTS verification_drafts_tenant_id_unique ON public.verification_drafts USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS verification_drafts_tenant_idx ON public.verification_drafts USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS verification_section_reviews_sub_idx ON public.verification_section_reviews USING btree (submission_id);
CREATE INDEX IF NOT EXISTS idx_verification_submissions_status ON public.verification_submissions USING btree (status);
CREATE INDEX IF NOT EXISTS idx_verification_submissions_tenant ON public.verification_submissions USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS verification_submissions_profile_idx ON public.verification_submissions USING btree (business_profile_id, status);
CREATE INDEX IF NOT EXISTS verification_submissions_tenant_idx ON public.verification_submissions USING btree (tenant_id);

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ==============================================================================
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Enable real-time read for everyone'
  ) THEN
    CREATE POLICY "Enable real-time read for everyone" ON transactions
      FOR SELECT
      TO public
      USING (true)
      ;
  END IF;
END $$;


-- ==============================================================================
-- 8. SUPABASE REALTIME CONFIGURATION
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
