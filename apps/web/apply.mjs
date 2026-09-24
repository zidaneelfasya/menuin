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
    const query = fs.readFileSync('0006_custom.sql', 'utf8');
    console.log('Executing custom migration...');
    await sql.unsafe(query);
    console.log('Done migrating!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

run();
