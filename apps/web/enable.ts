import 'dotenv/config';
import { db } from './src/lib/db/index';
import { tenants } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  await db.update(tenants).set({ onlinePaymentEnabled: true }).where(eq(tenants.slug, 'kopi-tiam'));
  console.log('Updated');
  process.exit(0);
}

run();
