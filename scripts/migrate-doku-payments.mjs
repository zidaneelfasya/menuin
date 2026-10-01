import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not defined!');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Urutan penting: Fase 1 lalu Fase 2. Semua file idempotent.
const migrationFiles = ['doku_payments.sql', 'doku_subscriptions.sql'].map((f) =>
  path.join(__dirname, '../apps/web/drizzle', f)
);
const sql = postgres(databaseUrl, { max: 1, prepare: false });

async function migrate() {
  try {
    await sql.begin(async (tx) => {
      for (const file of migrationFiles) {
        await tx.unsafe(readFileSync(file, 'utf8'));
      }
    });
    console.log('DOKU payments migration successful!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

migrate();
