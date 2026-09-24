import 'dotenv/config';
import { db } from './src/lib/db/index';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    await db.execute(sql`ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;`);
    console.log('Enabled RLS on transactions');
    
    await db.execute(sql`
      CREATE POLICY "Enable real-time read for everyone" 
      ON transactions FOR SELECT 
      USING (true);
    `);
    console.log('Created SELECT policy for transactions');
  } catch (e) {
    console.error('Error (might already exist):', e);
  }
  process.exit(0);
}

run();
