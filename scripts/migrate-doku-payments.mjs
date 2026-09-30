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
const migrationPath = path.join(__dirname, '../apps/web/drizzle/doku_payments.sql');
const sql = postgres(databaseUrl, { max: 1, prepare: false });

async function migrate() {
  try {
    const statements = readFileSync(migrationPath, 'utf8');
    await sql.begin((tx) => tx.unsafe(statements));
    console.log('DOKU payments migration successful!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

migrate();
