import postgres from 'postgres';
import fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1, prepare: false });

async function run() {
  try {
    const query = fs.readFileSync('drizzle/0005_fresh_manta.sql', 'utf8');
    const statements = query.split('--> statement-breakpoint');
    
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (trimmed) {
        console.log('Executing:', trimmed.substring(0, 50) + '...');
        // Execute without throwing if column exists (for online_payment_enabled)
        try {
            await sql.unsafe(trimmed);
        } catch (e) {
            console.log('Error (might be expected):', e.message);
        }
      }
    }
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

run();
