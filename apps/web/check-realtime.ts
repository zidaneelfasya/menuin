import 'dotenv/config';
import { db } from './src/lib/db/index';
import { sql } from 'drizzle-orm';

async function run() {
  const result = await db.execute(sql`
    SELECT pubname, tablename
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime';
  `);
  console.log(result);
  process.exit(0);
}
run();
