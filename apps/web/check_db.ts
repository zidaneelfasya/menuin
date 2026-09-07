import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

async function checkDB() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

  try {
    const tenants = await sqlSELECT count(*) FROM tenants;;
    console.log('Tenants count:', tenants[0].count);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkDB();
