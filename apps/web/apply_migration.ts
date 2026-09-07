import { config } from 'dotenv';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

config({ path: '.env.local' });

async function runMigration() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

  try {
    const migrationFile = path.join(process.cwd(), 'drizzle', 'manual_upgrade.sql');
    const sqlContent = fs.readFileSync(migrationFile, 'utf8');
    
    // Split by statement-breakpoint if Drizzle outputs multiple statements
    const statements = sqlContent.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);
    
    await sql.begin(async (tx) => {
      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await tx.unsafe(statement);
      }
    });

    console.log('Migration executed successfully.');
  } catch (error) {
    console.error('Error executing migration:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
