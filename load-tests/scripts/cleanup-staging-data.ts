/**
 * MENUIN — Staging Load Test Synthetic Data Cleanup
 * 
 * Safely removes all synthetic staging tenants and transactional records.
 * STRICT SAFETY RULE: Only deletes records where slug LIKE 'stg-outlet-%'.
 * 
 * Usage:
 *   npx tsx scripts/cleanup-staging-data.ts
 */

import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const sql = postgres(connectionString, { max: 5 });

async function cleanupStaging() {
  console.log('🧹 Scanning for synthetic staging tenants (slug LIKE "stg-outlet-%")...');

  const stagingTenants = await sql`
    SELECT id, slug, name FROM tenants WHERE slug LIKE 'stg-outlet-%'
  `;

  if (stagingTenants.length === 0) {
    console.log('✨ No synthetic staging tenants found. Database is already clean.');
    await sql.end();
    return;
  }

  console.log(`⚠️ Found ${stagingTenants.length} synthetic tenants to clean up:`);
  stagingTenants.forEach(t => console.log(`   - [${t.slug}] ${t.name}`));

  const tenantIds = stagingTenants.map(t => t.id);

  console.log('\n🗑️ Deleting associated staging data in dependency order...');

  // 1. Transaction Items
  const itemsDeleted = await sql`
    DELETE FROM transaction_items WHERE tenant_id = ANY(${tenantIds}) RETURNING id
  `;
  console.log(`   ↳ Deleted ${itemsDeleted.length} transaction items`);

  // 2. Transactions
  const txDeleted = await sql`
    DELETE FROM transactions WHERE tenant_id = ANY(${tenantIds}) RETURNING id
  `;
  console.log(`   ↳ Deleted ${txDeleted.length} transactions`);

  // 3. Cash Movements
  const cashDeleted = await sql`
    DELETE FROM cash_movements WHERE tenant_id = ANY(${tenantIds}) RETURNING id
  `;
  console.log(`   ↳ Deleted ${cashDeleted.length} cash movements`);

  // 4. Shifts
  const shiftsDeleted = await sql`
    DELETE FROM shifts WHERE tenant_id = ANY(${tenantIds}) RETURNING id
  `;
  console.log(`   ↳ Deleted ${shiftsDeleted.length} shifts`);

  // 5. Products & Modifiers
  const pmgDeleted = await sql`
    DELETE FROM product_modifier_groups WHERE tenant_id = ANY(${tenantIds}) RETURNING id
  `;
  console.log(`   ↳ Deleted ${pmgDeleted.length} product modifier associations`);

  const prodDeleted = await sql`
    DELETE FROM products WHERE tenant_id = ANY(${tenantIds}) RETURNING id
  `;
  console.log(`   ↳ Deleted ${prodDeleted.length} products`);

  // 6. Categories
  const catDeleted = await sql`
    DELETE FROM categories WHERE tenant_id = ANY(${tenantIds}) RETURNING id
  `;
  console.log(`   ↳ Deleted ${catDeleted.length} categories`);

  // 7. Memberships
  const membersDeleted = await sql`
    DELETE FROM memberships WHERE tenant_id = ANY(${tenantIds}) RETURNING id
  `;
  console.log(`   ↳ Deleted ${membersDeleted.length} memberships`);

  // 8. Synthetic Accounts
  const accountsDeleted = await sql`
    DELETE FROM accounts WHERE email LIKE '%@stg-outlet%.menuin.id' RETURNING id
  `;
  console.log(`   ↳ Deleted ${accountsDeleted.length} synthetic accounts`);

  // 9. Tenants
  const tenantsDeleted = await sql`
    DELETE FROM tenants WHERE id = ANY(${tenantIds}) RETURNING id
  `;
  console.log(`   ↳ Deleted ${tenantsDeleted.length} synthetic tenants`);

  console.log('\n🎉 Complete! All synthetic staging data removed safely.');
  await sql.end();
}

cleanupStaging().catch(err => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
