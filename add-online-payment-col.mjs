import postgres from 'postgres';
import 'dotenv/config';

async function addCol() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sql = postgres(connectionString);

  try {
    console.log("Adding online_payment_enabled to tenants table...");
    await sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS online_payment_enabled boolean NOT NULL DEFAULT false`;
    console.log("Column added successfully!");
  } catch (error) {
    console.error("Error adding column:", error);
  } finally {
    await sql.end();
  }
}

addCol();
