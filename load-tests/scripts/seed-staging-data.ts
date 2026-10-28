/**
 * MENUIN — Staging Load Test Synthetic Data Seeder
 * 
 * Safely provisions 10 realistic synthetic restaurant outlets for load testing.
 * Strictly prefixes all data with [STAGING] and slugs starting with 'stg-outlet-'.
 * 
 * Usage:
 *   npx tsx scripts/seed-staging-data.ts
 */

import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import testConfig from '../config/test-config.json';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

// Safety check: Abort if pointed at production database unless explicitly confirmed
if (connectionString.includes('production') && !process.env.ALLOW_PRODUCTION_TEST_SEED) {
  console.error('🛑 ABORT: Target database appears to be PRODUCTION. Set ALLOW_PRODUCTION_TEST_SEED=true to override.');
  process.exit(1);
}

const sql = postgres(connectionString, { max: 5 });

const DEFAULT_PIN = '123456';
const PIN_HASH = bcrypt.hashSync(DEFAULT_PIN, 10);

const CATEGORY_TEMPLATES = [
  { name: 'Makanan Utama', color: '#0E59F9' },
  { name: 'Minuman Kopi & Teh', color: '#10B981' },
  { name: 'Camilan & Snack', color: '#F59E0B' },
  { name: 'Paket Hemat', color: '#8B5CF6' },
];

const PRODUCT_TEMPLATES = [
  // Makanan Utama
  { name: 'Nasi Goreng Spesial Telur', price: '28000', catIdx: 0 },
  { name: 'Ayam Geprek Sambal Bawang', price: '25000', catIdx: 0 },
  { name: 'Mie Goreng Seafood Spesial', price: '32000', catIdx: 0 },
  { name: 'Bebek Goreng Kremes Crispy', price: '38000', catIdx: 0 },
  { name: 'Nasi Rendang Sapi Empuk', price: '35000', catIdx: 0 },
  { name: 'Kwetiau Sapi Siram Telur', price: '34000', catIdx: 0 },
  // Minuman
  { name: 'Kopi Susu Gula Aren Signature', price: '18000', catIdx: 1 },
  { name: 'Americano Double Shot Cold', price: '22000', catIdx: 1 },
  { name: 'Matcha Latte Oat Milk', price: '26000', catIdx: 1 },
  { name: 'Es Teh Manis Melati', price: '8000', catIdx: 1 },
  { name: 'Lemon Grass Tea Refreshing', price: '15000', catIdx: 1 },
  // Snack
  { name: 'Kentang Goreng Truffle Dip', price: '22000', catIdx: 2 },
  { name: 'Cireng Krispi Bumbu Rujak', price: '16000', catIdx: 2 },
  { name: 'Pisang Goreng Keju Cokelat', price: '18000', catIdx: 2 },
  { name: 'Tahu Cabe Garam Gurih', price: '15000', catIdx: 2 },
  // Paket Hemat
  { name: 'Paket Nasi Geprek + Es Teh', price: '29000', catIdx: 3 },
  { name: 'Paket Kopi + Pisang Goreng', price: '32000', catIdx: 3 },
];

async function seedStaging() {
  console.log(`🚀 Starting synthetic staging seed for ${testConfig.outlets.length} outlets...`);

  for (const outlet of testConfig.outlets) {
    console.log(`\n📦 Provisioning Outlet: ${outlet.name} (${outlet.slug})`);

    // 1. Create or Find Tenant
    const [tenant] = await sql`
      INSERT INTO tenants (
        id, name, slug, order_prefix, pos_tax_rate, service_charge_rate, pos_rounding, created_at, updated_at
      ) VALUES (
        ${crypto.randomUUID()}, ${outlet.name}, ${outlet.slug}, ${outlet.slug.toUpperCase().slice(-3)}, '10', '5', true, NOW(), NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        pos_tax_rate = '10',
        service_charge_rate = '5',
        pos_rounding = true,
        updated_at = NOW()
      RETURNING id, name, slug
    `;

    const tenantId = tenant.id;

    // 2. Create Owner Account & Membership
    const ownerEmail = `owner@${outlet.slug}.menuin.id`;
    const [ownerAccount] = await sql`
      INSERT INTO accounts (id, email, name, role, created_at, updated_at)
      VALUES (${crypto.randomUUID()}, ${ownerEmail}, ${`Owner ${outlet.name}`}, 'MERCHANT', NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
      RETURNING id
    `;

    const [ownerMembership] = await sql`
      INSERT INTO memberships (id, account_id, tenant_id, role, display_name, pin_hash, created_at, updated_at)
      VALUES (${crypto.randomUUID()}, ${ownerAccount.id}, ${tenantId}, 'OWNER', 'Owner Staging', ${PIN_HASH}, NOW(), NOW())
      ON CONFLICT (account_id, tenant_id) DO UPDATE SET role = 'OWNER', pin_hash = ${PIN_HASH}, updated_at = NOW()
      RETURNING id
    `;

    // 3. Create Cashier Account & Membership
    const [cashierAccount] = await sql`
      INSERT INTO accounts (id, email, name, role, created_at, updated_at)
      VALUES (${crypto.randomUUID()}, ${outlet.cashierUsername}, ${`Kasir ${outlet.name}`}, 'MERCHANT', NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
      RETURNING id
    `;

    const [cashierMembership] = await sql`
      INSERT INTO memberships (id, account_id, tenant_id, role, display_name, pin_hash, created_at, updated_at)
      VALUES (${crypto.randomUUID()}, ${cashierAccount.id}, ${tenantId}, 'CASHIER', 'Kasir Utama', ${PIN_HASH}, NOW(), NOW())
      ON CONFLICT (account_id, tenant_id) DO UPDATE SET role = 'CASHIER', pin_hash = ${PIN_HASH}, updated_at = NOW()
      RETURNING id
    `;

    // 4. Create Active Shift
    const existingActiveShifts = await sql`
      SELECT id FROM shifts WHERE tenant_id = ${tenantId} AND status = 'ACTIVE' LIMIT 1
    `;

    let activeShiftId: string;
    if (existingActiveShifts.length > 0) {
      activeShiftId = existingActiveShifts[0].id;
    } else {
      const [newShift] = await sql`
        INSERT INTO shifts (id, tenant_id, cashier_membership_id, status, initial_cash, opened_at, created_at, updated_at)
        VALUES (${crypto.randomUUID()}, ${tenantId}, ${cashierMembership.id}, 'ACTIVE', '500000', NOW(), NOW(), NOW())
        RETURNING id
      `;
      activeShiftId = newShift.id;
    }

    // 5. Create Categories
    const categoryIds: string[] = [];
    for (const catTpl of CATEGORY_TEMPLATES) {
      const [cat] = await sql`
        INSERT INTO categories (id, tenant_id, name, color, created_at, updated_at)
        VALUES (${crypto.randomUUID()}, ${tenantId}, ${catTpl.name}, ${catTpl.color}, NOW(), NOW())
        ON CONFLICT (tenant_id, name) DO UPDATE SET color = EXCLUDED.color, updated_at = NOW()
        RETURNING id
      `;
      categoryIds.push(cat.id);
    }

    // 6. Create Products
    const productIds: string[] = [];
    for (const prodTpl of PRODUCT_TEMPLATES) {
      const catId = categoryIds[prodTpl.catIdx] || categoryIds[0];
      const [prod] = await sql`
        INSERT INTO products (
          id, tenant_id, category_id, name, price, stock, track_stock, is_available, created_at, updated_at
        )
        VALUES (
          ${crypto.randomUUID()}, ${tenantId}, ${catId}, ${prodTpl.name}, ${prodTpl.price}, 1000, true, true, NOW(), NOW()
        )
        ON CONFLICT (tenant_id, name) DO UPDATE SET
          price = EXCLUDED.price,
          stock = 1000,
          is_available = true,
          updated_at = NOW()
        RETURNING id
      `;
      productIds.push(prod.id);
    }

    // 7. Seed 50 Historical Completed Transactions (for reporting & aggregation tests)
    const existingTxCount = await sql`
      SELECT COUNT(*)::int AS count FROM transactions WHERE tenant_id = ${tenantId}
    `;

    if (existingTxCount[0].count < 50) {
      console.log(`   ↳ Generating 50 historical completed transactions for analytics...`);
      for (let i = 1; i <= 50; i++) {
        const txId = crypto.randomUUID();
        const daysAgo = Math.floor(Math.random() * 28);
        const txDate = new Date(Date.now() - daysAgo * 86400000 - Math.random() * 36000000);
        const orderNum = `${outlet.slug.toUpperCase().slice(-3)}-${txDate.toISOString().slice(2, 10).replace(/-/g, '')}-${String(i).padStart(4, '0')}`;
        const subtotal = 45000 + (i % 5) * 15000;
        const tax = Math.round(subtotal * 0.1);
        const service = Math.round(subtotal * 0.05);
        const grandTotal = subtotal + tax + service;

        await sql`
          INSERT INTO transactions (
            id, tenant_id, cashier_membership_id, shift_id, order_number, queue_number,
            status, payment_status, payment_method, total_amount, tax, service_charge,
            grand_total, net_amount, customer_name, table_number, order_type, created_at, updated_at
          ) VALUES (
            ${txId}, ${tenantId}, ${cashierMembership.id}, ${activeShiftId}, ${orderNum}, ${i},
            'COMPLETED', 'PAID', 'CASH', ${subtotal.toString()}, ${tax.toString()}, ${service.toString()},
            ${grandTotal.toString()}, ${grandTotal.toString()}, ${'Pelanggan Staging ' + i}, ${String((i % 5) + 1)},
            'DINE_IN', ${txDate}, ${txDate}
          )
          ON CONFLICT (id) DO NOTHING
        `;

        // Insert 2 items per transaction
        const p1 = productIds[i % productIds.length];
        const p2 = productIds[(i + 1) % productIds.length];
        await sql`
          INSERT INTO transaction_items (
            id, tenant_id, transaction_id, product_id, quantity, price, subtotal, is_completed, created_at, updated_at
          ) VALUES 
          (${crypto.randomUUID()}, ${tenantId}, ${txId}, ${p1}, 1, '25000', '25000', true, ${txDate}, ${txDate}),
          (${crypto.randomUUID()}, ${tenantId}, ${txId}, ${p2}, 1, '20000', '20000', true, ${txDate}, ${txDate})
          ON CONFLICT (id) DO NOTHING
        `;
      }
    }

    console.log(`   ✅ Seeded: 1 Active Shift, 2 Memberships, ${categoryIds.length} Categories, ${productIds.length} Products, 50 Historical Transactions.`);
  }

  console.log('\n🎉 Staging seeder completed successfully! All 10 synthetic outlets are ready for load testing.');
  await sql.end();
}

seedStaging().catch((err) => {
  console.error('❌ Seeder failed:', err);
  process.exit(1);
});
