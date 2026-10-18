import { db } from '../src/lib/db';
import { tenants } from '../src/lib/db/schema';

async function main() {
  const rows = await db.select({
    name: tenants.name,
    slug: tenants.slug,
    onlinePaymentEnabled: tenants.onlinePaymentEnabled,
    dokuSubAccountId: tenants.dokuSubAccountId,
  }).from(tenants).limit(20);
  
  console.log('\n=== Tenant Payment Status ===');
  rows.forEach(r => {
    console.log(`\nNama: ${r.name}`);
    console.log(`  Slug: ${r.slug}`);
    console.log(`  onlinePaymentEnabled: ${r.onlinePaymentEnabled}`);
    console.log(`  dokuSubAccountId: ${r.dokuSubAccountId || '(kosong)'}`);
  });
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
