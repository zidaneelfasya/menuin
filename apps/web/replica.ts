import 'dotenv/config';
import { db } from './src/lib/db/index';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    await db.execute(sql`ALTER TABLE transactions REPLICA IDENTITY FULL;`);
    console.log('Set REPLICA IDENTITY FULL on transactions');
  } catch (e) {
    console.error('Error:', e);
  }
  process.exit(0);
}

run();
