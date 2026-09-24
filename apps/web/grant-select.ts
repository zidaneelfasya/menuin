import 'dotenv/config';
import { db } from './src/lib/db/index';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    await db.execute(sql`GRANT SELECT ON transactions TO anon;`);
    await db.execute(sql`GRANT SELECT ON transactions TO authenticated;`);
    console.log('Granted SELECT on transactions to anon and authenticated');
  } catch (e) {
    console.error('Error:', e);
  }
  process.exit(0);
}

run();
