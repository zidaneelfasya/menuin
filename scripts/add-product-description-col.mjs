import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function run() {
  try {
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS description text;`;
    console.log('✅ Column description added to products table successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to add description column:', error);
    process.exit(1);
  }
}

run();
