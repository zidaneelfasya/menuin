import 'dotenv/config';
import { db } from './src/lib/db/index';
import { tenants } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const allTenants = await db.select({
    slug: tenants.slug,
    onlinePaymentEnabled: tenants.onlinePaymentEnabled,
    midtransClientKey: tenants.midtransClientKey,
    midtransServerKey: tenants.midtransServerKey
  }).from(tenants);
  
  console.log(allTenants);
  process.exit(0);
}

run();
