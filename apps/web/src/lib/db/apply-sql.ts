import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  const sql = postgres(process.env.DATABASE_URL);
  const sqlContent = fs.readFileSync(path.join(process.cwd(), 'drizzle/0004_odd_magma.sql'), 'utf-8');
  
  const statements = sqlContent.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);
  
  for (const statement of statements) {
    try {
      console.log('Running:\\n' + statement);
      await sql.unsafe(statement);
    } catch (e) {
      console.error('Failed to execute statement:\\n', statement);
      console.error(e);
      process.exit(1);
    }
  }
  
  console.log('Migration applied successfully!');
  process.exit(0);
}

run();
