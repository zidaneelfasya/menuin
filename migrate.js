require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');

async function main() {
  console.log("Connecting to database...");
  const sql = postgres(process.env.DATABASE_URL, { prepare: false });
  
  try {
    const migrationSQL = fs.readFileSync('drizzle/0001_lush_jubilee.sql', 'utf8');
    
    console.log("Executing SQL...");
    // Split the SQL script into statements if needed, or run as a single string
    await sql.unsafe(migrationSQL);
    console.log("Migration applied successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await sql.end();
  }
}

main();
