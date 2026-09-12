import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

async function clearDB() {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    const tenants = await sql`SELECT count(*) FROM tenants;`;
    console.log('Tenants count:', tenants[0].count);
    
    if (Number(tenants[0].count) > 0) {
        await sql`SET session_replication_role = replica;`;
        await sql`TRUNCATE TABLE tenants CASCADE;`;
        await sql`SET session_replication_role = DEFAULT;`;
        console.log('Truncated tenants');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

clearDB();
