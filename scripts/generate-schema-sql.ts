import * as fs from 'fs';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
if (!process.env.DATABASE_URL) dotenv.config({ path: 'apps/web/.env.local' });

async function main() {
  const dump = JSON.parse(fs.readFileSync('db-schema-dump.json', 'utf8'));

  // 1. Enums
  let out = `-- ==============================================================================
-- MENUIN PRODUCTION DATABASE SCHEMA (SOURCE OF TRUTH)
-- Dialect: PostgreSQL (Supabase / Vanilla PostgreSQL 15+)
--
-- File: schema.sql
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
`;

  for (const e of dump.enums) {
    out += `DO $$ BEGIN
  CREATE TYPE ${e.typname} AS ENUM (${e.values.map((v: string) => `'${v}'`).join(', ')});
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

`;
  }

  // 2. Determine Table Dependency Order (topological sort or logical grouped order)
  const logicalOrder = [
    // Core Identity
    'accounts',
    // Business Verification & Profiles
    'business_profiles',
    'settlement_accounts',
    // Outlets / Tenants
    'tenants',
    // Subscriptions
    'subscriptions',
    'subscription_invoices',
    // Teams & Members
    'memberships',
    'invitations',
    // Hardware & POS Sessions
    'pos_devices',
    'pos_sessions',
    'device_pairing_codes',
    'shifts',
    'cash_movements',
    // Catalog
    'categories',
    'products',
    'modifier_groups',
    'modifiers',
    'product_modifier_groups',
    'stock_movements',
    // Storefront & Dining
    'tables',
    'operating_hours',
    'promotions',
    'testimonials',
    // Orders & Transactions
    'transactions',
    'transaction_items',
    // Payments
    'payments',
    'payment_attempts',
    'payment_webhook_events',
    'provider_onboardings',
    // Finance & Accounting
    'incomes',
    'expenses',
    'category_budgets',
    'daily_sales_summaries',
    // Verification Workflows & Compliance
    'verification_submissions',
    'verification_documents',
    'verification_section_reviews',
    'verification_drafts',
    'verification_audit_logs',
    'care_tickets',
    // Security & Audit
    'rate_limits',
    'audit_logs'
  ];

  // Group metadata for nice comments
  const groupHeaders: Record<string, string> = {
    accounts: '-- 3. CORE GLOBAL IDENTITY: ACCOUNTS\n-- Terhubung langsung ke Supabase Auth (auth.users)',
    business_profiles: '-- 4. BUSINESS PROFILES & VERIFICATION (KYC)\n-- Entitas bisnis hukum pemilik outlet (PT, CV, Perorangan, dll)',
    settlement_accounts: '-- 5. SETTLEMENT ACCOUNTS\n-- Rekening bank tujuan pencairan dana (payout / disbursement)',
    tenants: '-- 6. OUTLETS / RESTAURANTS: TENANTS\n-- Unit restoran / toko cabang dengan pengaturan operasional, POS, dan pembayaran',
    subscriptions: '-- 7. SAAS SUBSCRIPTIONS & BILLING\n-- Paket langganan outlet Menuin (FREE, BASIC, PRO)',
    subscription_invoices: '-- 8. SUBSCRIPTION INVOICES\n-- Tagihan pembayaran langganan bulanan / tahunan',
    memberships: '-- 9. OUTLET MEMBERSHIPS & TEAM ACCESS\n-- Hak akses akun staf/manajer/kasir per outlet',
    invitations: '-- 10. TEAM INVITATIONS\n-- Undangan staf baru melalui email',
    pos_devices: '-- 11. POS HARDWARE DEVICES\n-- Tablet/Handphone kasir yang terotorisasi',
    pos_sessions: '-- 12. POS SESSIONS\n-- Sesi login kasir pada device',
    device_pairing_codes: '-- 13. DEVICE PAIRING CODES\n-- Kode 6 digit untuk pairing aplikasi mobile POS ke outlet',
    shifts: '-- 14. CASHIER SHIFTS\n-- Shift kerja kasir dan rekonsiliasi kas laci (cash drawer)',
    cash_movements: '-- 15. CASH MOVEMENTS (CASH IN / CASH OUT)\n-- Pencatatan mutasi kas manual selama shift',
    categories: '-- 16. PRODUCT CATEGORIES\n-- Kategori menu makanan & minuman',
    products: '-- 17. PRODUCTS & MENU ITEMS\n-- Item menu, harga, stok, dan pengaturan dapur',
    modifier_groups: '-- 18. MODIFIER GROUPS (TOPPING / LEVEL / VARIAN)\n-- Kelompok pilihan modifier produk',
    modifiers: '-- 19. MODIFIERS\n-- Opsi modifier satuan dan harga tambahan',
    product_modifier_groups: '-- 20. PRODUCT MODIFIER GROUPS (JUNCTION)\n-- Relasi many-to-many produk ke kelompok modifier',
    stock_movements: '-- 21. STOCK MOVEMENTS (INVENTORY TRACKING)\n-- Riwayat pergerakan stok bahan dan menu',
    tables: '-- 22. RESTAURANT TABLES & QR CODES\n-- Meja makan dan token QR Code pemesanan dine-in',
    operating_hours: '-- 23. OPERATING HOURS\n-- Jam operasional buka/tutup harian outlet',
    promotions: '-- 24. PROMOTIONS & DISCOUNT VOUCHERS\n-- Kode promo dan diskon harga transaksi',
    testimonials: '-- 25. TESTIMONIALS\n-- Ulasan & rating publik untuk landing page',
    transactions: '-- 26. TRANSACTIONS & ORDERS (CENTRAL ORDER LEDGER)\n-- Catatan transaksi penjualan POS, QR Storefront, dan Delivery',
    transaction_items: '-- 27. TRANSACTION ITEMS\n-- Detail rincian menu yang dipesan pada setiap transaksi',
    payments: '-- 28. ONLINE PAYMENTS (MIDTRANS AUDIT LOG)\n-- Riwayat transaksi pembayaran Midtrans',
    payment_attempts: '-- 29. PAYMENT ATTEMPTS (DOKU OMNICHANNEL & QRIS DINAMIS)\n-- Percobaan pembayaran checkout dan QRIS',
    payment_webhook_events: '-- 30. PAYMENT WEBHOOK EVENTS (IDEMPOTENCY LEDGER)\n-- Pencatatan event webhook DOKU untuk idempotensi',
    provider_onboardings: '-- 31. PROVIDER ONBOARDINGS (DOKU SUB-ACCOUNTS)\n-- Integrasi sub-account merchant DOKU untuk split settlement',
    incomes: '-- 32. INCOMES (PEMASUKAN NON-PENJUALAN)\n-- Pencatatan arus kas masuk operasional',
    expenses: '-- 33. EXPENSES (PENGELUARAN RESTORAN)\n-- Pengeluaran operasional outlet dan HPP',
    category_budgets: '-- 34. CATEGORY BUDGETS\n-- Anggaran batas pengeluaran per kategori per bulan',
    daily_sales_summaries: '-- 35. DAILY SALES SUMMARIES\n-- Agregasi penjualan harian teroptimasi untuk performa laporan',
    verification_submissions: '-- 36. VERIFICATION SUBMISSIONS (KYC TIER)\n-- Pengajuan berkas verifikasi identitas & usaha merchant',
    verification_documents: '-- 37. VERIFICATION DOCUMENTS\n-- File dokumen legalitas pendukung (KTP, NPWP, NIB, dll)',
    verification_section_reviews: '-- 38. VERIFICATION SECTION REVIEWS\n-- Peninjauan review per seksi pengajuan oleh tim verifikasi',
    verification_drafts: '-- 39. VERIFICATION DRAFTS\n-- Draf sementara formulir verifikasi multi-step',
    verification_audit_logs: '-- 40. VERIFICATION AUDIT LOGS\n-- Jejak audit perubahan status kepatuhan & verifikasi',
    care_tickets: '-- 41. CARE TICKETS (MERCHANT SUPPORT TICKETING)\n-- Tiket bantuan pengaduan dan kendala verifikasi',
    rate_limits: '-- 42. SYSTEM RATE LIMITS\n-- Pembatasan request berbasis IP dan pencegahan brute-force',
    audit_logs: '-- 43. SYSTEM AUDIT LOGS\n-- Rekam aktivitas aksi krusial pengguna di sistem'
  };

  function formatColumnType(c: any): string {
    if (c.data_type === 'USER-DEFINED') {
      return c.udt_name;
    }
    if (c.data_type === 'character varying') {
      return c.character_maximum_length ? `VARCHAR(${c.character_maximum_length})` : 'VARCHAR';
    }
    if (c.data_type === 'numeric') {
      if (c.numeric_precision && c.numeric_scale !== null) {
        return `NUMERIC(${c.numeric_precision}, ${c.numeric_scale})`;
      }
      return 'NUMERIC';
    }
    if (c.data_type === 'timestamp with time zone') {
      return 'TIMESTAMPTZ';
    }
    if (c.data_type === 'timestamp without time zone') {
      return 'TIMESTAMP';
    }
    if (c.data_type === 'integer') return 'INTEGER';
    if (c.data_type === 'boolean') return 'BOOLEAN';
    if (c.data_type === 'text') return 'TEXT';
    if (c.data_type === 'uuid') return 'UUID';
    if (c.data_type === 'jsonb') return 'JSONB';
    if (c.data_type === 'json') return 'JSON';
    if (c.data_type === 'date') return 'DATE';
    if (c.data_type === 'real') return 'REAL';
    return c.data_type.toUpperCase();
  }

  function formatColumnDefault(def: string | null): string {
    if (!def) return '';
    // Format postgres defaults cleanly
    let clean = def;
    if (clean.endsWith('::text')) clean = clean.replace('::text', '');
    if (clean.endsWith('::bpchar')) clean = clean.replace('::bpchar', '');
    return ` DEFAULT ${clean}`;
  }

  out += `\n-- ==============================================================================
-- 3. BASE TABLES DEFINITION
-- ==============================================================================
`;

  for (const tableName of logicalOrder) {
    const tableCols = dump.columns.filter((c: any) => c.table_name === tableName);
    if (!tableCols.length) continue;

    const header = groupHeaders[tableName];
    if (header) {
      out += `\n${header}\n`;
    }

    out += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;

    const colDefs = tableCols.map((c: any) => {
      let line = `  ${c.column_name} ${formatColumnType(c)}`;
      // Primary key directly on column if single PK is 'id'
      if (c.column_name === 'id') {
        line += ' PRIMARY KEY';
      }
      if (c.column_default) {
        line += formatColumnDefault(c.column_default);
      }
      if (c.is_nullable === 'NO' && c.column_name !== 'id') {
        line += ' NOT NULL';
      }
      return line;
    });

    out += colDefs.join(',\n');
    out += '\n);\n';
  }

  out += `\n-- ==============================================================================
-- 4. CONSTRAINTS (UNIQUE & CHECK CONSTRAINTS)
-- ==============================================================================
`;

  // Get unique constraints (excluding primary keys which are already defined)
  const processedConstraints = new Set<string>();
  for (const tc of dump.constraints) {
    if (tc.constraint_type === 'PRIMARY KEY') continue;
    if (tc.constraint_type === 'FOREIGN KEY') continue; // FKs handled in next section
    if (processedConstraints.has(tc.constraint_name)) continue;
    processedConstraints.add(tc.constraint_name);

    out += `DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '${tc.constraint_name}' AND conrelid = '${tc.table_name}'::regclass
  ) THEN
    ALTER TABLE ${tc.table_name} ADD CONSTRAINT ${tc.constraint_name} ${tc.constraint_def};
  END IF;
END $$;\n\n`;
  }

  out += `\n-- ==============================================================================
-- 5. FOREIGN KEY CONSTRAINTS
-- ==============================================================================
`;

  const processedFKs = new Set<string>();
  for (const tc of dump.constraints) {
    if (tc.constraint_type !== 'FOREIGN KEY') continue;
    if (processedFKs.has(tc.constraint_name)) continue;
    processedFKs.add(tc.constraint_name);

    out += `DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '${tc.constraint_name}' AND conrelid = '${tc.table_name}'::regclass
  ) THEN
    ALTER TABLE ${tc.table_name} ADD CONSTRAINT ${tc.constraint_name} ${tc.constraint_def};
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;\n\n`;
  }

  out += `\n-- ==============================================================================
-- 6. PERFORMANCE & FILTER INDEXES
-- ==============================================================================
`;

  for (const idx of dump.indexes) {
    // Skip pkey indexes as they are created automatically with PRIMARY KEY
    if (idx.indexname.endsWith('_pkey')) continue;
    // Also convert CREATE INDEX / CREATE UNIQUE INDEX to CREATE INDEX IF NOT EXISTS
    let sql = idx.indexdef;
    if (sql.startsWith('CREATE UNIQUE INDEX ')) {
      sql = sql.replace('CREATE UNIQUE INDEX ', 'CREATE UNIQUE INDEX IF NOT EXISTS ');
    } else if (sql.startsWith('CREATE INDEX ')) {
      sql = sql.replace('CREATE INDEX ', 'CREATE INDEX IF NOT EXISTS ');
    }
    out += `${sql};\n`;
  }

  out += `\n-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ==============================================================================
`;

  for (const t of dump.tables) {
    if (t.rls_enabled) {
      out += `ALTER TABLE ${t.table_name} ENABLE ROW LEVEL SECURITY;\n`;
    }
  }

  out += `\n-- Policies\n`;
  for (const p of dump.policies) {
    out += `DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = '${p.tablename}' AND policyname = '${p.policyname.replace(/'/g, "''")}'
  ) THEN
    CREATE POLICY "${p.policyname}" ON ${p.tablename}
      FOR ${p.cmd}
      TO ${p.roles.join(', ')}
      ${p.qual ? `USING (${p.qual})` : ''}
      ${p.with_check ? `WITH CHECK (${p.with_check})` : ''};
  END IF;
END $$;\n\n`;
  }

  out += `\n-- ==============================================================================
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
`;

  fs.writeFileSync('schema.sql', out, 'utf8');

  // Also write production-schema.sql with same content except header filename
  const prodOut = out.replace('-- File: schema.sql', '-- File: production-schema.sql');
  fs.writeFileSync('production-schema.sql', prodOut, 'utf8');

  console.log('✅ Successfully generated schema.sql and production-schema.sql!');
}

main().catch(console.error);
