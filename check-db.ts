import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);

async function checkUser() {
  const result = await client`SELECT id, email, name, tenant_id FROM users WHERE email = 'zidaneelfasya@gmail.com'`;
  console.log('User check result:', result);
  process.exit(0);
}

checkUser();
