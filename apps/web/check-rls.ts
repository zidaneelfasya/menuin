import 'dotenv/config';
import { db } from './src/lib/db/index';
import { sql } from 'drizzle-orm';

async function run() {
  const result = await db.execute(sql`
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = 'transactions';
  `);
  console.log('RLS Enabled:', result[0]?.relrowsecurity);
  process.exit(0);
}
run();
