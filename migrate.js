require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');

async function main() {
  console.log("Connecting to database...");
  let connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
  try {
    const match = connectionString.match(/^(postgresql?:\/\/[^:]+:)(.*)(@[^@]+:\d+\/[^?]+.*)$/);
    if (match) {
      const password = match[2];
      if (password.includes('@') || password.includes('#') || password.includes('!')) {
        const encodedPassword = encodeURIComponent(password);
        connectionString = match[1] + encodedPassword + match[3];
      }
    }
  } catch (e) {
    console.error("Failed to parse DB URL", e);
  }
  const sql = postgres(connectionString, { prepare: false });
  
  try {
    const migrationSQL = fs.readFileSync('drizzle/0003_tense_sharon_ventura.sql', 'utf8');
    
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
