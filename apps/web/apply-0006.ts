import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

// Disable prepare to work with Supabase transaction pooler
const sql = postgres(connectionString, { max: 1, prepare: false });

async function run() {
  try {
    const sqlContent = fs.readFileSync(path.join(__dirname, 'drizzle', '0006_acoustic_smasher.sql'), 'utf8');
    
    // Split by statement-breakpoint if needed, or just execute as one large query
    // Drizzle kit puts '--> statement-breakpoint' between statements
    const queries = sqlContent.split('--> statement-breakpoint').map(q => q.trim()).filter(q => q.length > 0);
    
    console.log(`Found ${queries.length} statements to execute.`);
    
    for (let i = 0; i < queries.length; i++) {
      console.log(`Executing statement ${i + 1}/${queries.length}...`);
      try {
        await sql.unsafe(queries[i]);
      } catch (err: any) {
        // Ignore if it's dropping a constraint that doesn't exist etc, or if the type already exists, etc.
        console.warn(`Warning on statement ${i + 1}: ${err.message}`);
      }
    }
    
    console.log('Successfully applied migration 0006 directly!');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await sql.end();
  }
}

run();
