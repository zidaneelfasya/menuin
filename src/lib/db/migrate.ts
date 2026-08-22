import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

// Disable prepare to work with Supabase transaction pooler
const sql = postgres(connectionString, { max: 1, prepare: false });
const db = drizzle(sql);

async function runMigrate() {
  try {
    console.log('Running Drizzle migrations...');
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await sql.end();
  }
}

runMigrate();
