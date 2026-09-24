import 'dotenv/config';
import { db } from './src/lib/db/index';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    await db.execute(sql`ALTER PUBLICATION supabase_realtime ADD TABLE transactions;`);
    console.log('Realtime enabled for transactions table');
  } catch (error) {
    console.log('Maybe already enabled or error:', error);
  }
  process.exit(0);
}

run();
