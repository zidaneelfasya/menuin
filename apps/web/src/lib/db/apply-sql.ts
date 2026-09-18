import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
  try {
    console.log('Running: ALTER TABLE products ADD COLUMN IF NOT EXISTS track_stock boolean DEFAULT true NOT NULL;');
    await sql.unsafe('ALTER TABLE products ADD COLUMN IF NOT EXISTS track_stock boolean DEFAULT true NOT NULL;');
    console.log('Migration applied successfully!');
  } catch (e) {
    console.error('Failed to execute statement:', e);
    process.exit(1);
  } finally {
    await sql.end();
  }
  process.exit(0);
}

run();
