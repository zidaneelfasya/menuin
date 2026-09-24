import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not defined!');
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function migrate() {
  try {
    await sql`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS void_reason text,
      ADD COLUMN IF NOT EXISTS voided_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS voided_by_membership_id uuid;
    `;
    console.log('Void/Anti-Fraud columns migration successful!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await sql.end();
  }
}

migrate();
