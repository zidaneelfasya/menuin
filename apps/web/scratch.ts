import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({path: '.env.local'});
const sql = postgres(process.env.DATABASE_URL as string);

async function run() {
  try {
    await sql.unsafe('DROP TABLE IF EXISTS "businesses" CASCADE;');
    console.log('businesses table dropped if existed');
  } catch (e) {
    console.error('Error:', e);
  }
  console.log('Done');
  process.exit(0);
}

run().catch(console.error);
