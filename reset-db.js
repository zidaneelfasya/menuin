require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

async function main() {
  console.log("Dropping and recreating public schema...");
  const dbUrl = "postgresql://postgres.rxtpflrlypkykkaikuxk:%40_C%23_MsjnE%21f47N@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";
  const sql = postgres(dbUrl, { prepare: false });
  try {
    await sql`DROP SCHEMA public CASCADE;`;
    await sql`CREATE SCHEMA public;`;
    console.log("Schema reset successfully!");
  } catch (err) {
    console.error("Failed to reset schema:", err);
  } finally {
    await sql.end();
  }
}

main();
