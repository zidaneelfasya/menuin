import postgres from 'postgres';

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  try {
    console.log('Running: ALTER TABLE modifiers ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true NOT NULL;');
    await sql.unsafe('ALTER TABLE modifiers ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true NOT NULL;');
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
