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
      ALTER TABLE tenants 
      ADD COLUMN IF NOT EXISTS kitchen_print_enabled boolean DEFAULT false NOT NULL,
      ADD COLUMN IF NOT EXISTS kitchen_ticket_title text DEFAULT 'TIKET DAPUR',
      ADD COLUMN IF NOT EXISTS kitchen_ticket_notes text,
      ADD COLUMN IF NOT EXISTS kitchen_show_customer boolean DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS kitchen_show_cashier boolean DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS kitchen_show_table boolean DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS kitchen_show_notes boolean DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS kitchen_auto_cut boolean DEFAULT true NOT NULL;
    `;
    console.log('Kitchen columns migration successful!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await sql.end();
  }
}

migrate();
