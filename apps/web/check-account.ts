import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';
import { accounts } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const connectionString = process.env.DATABASE_URL!.replace(':6543/', ':5432/');
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);

  const res = await db.select().from(accounts).where(eq(accounts.email, 'zidaneelfasya@gmail.com'));
  
  console.log('Account:');
  console.log(res);
  
  process.exit(0);
}

main().catch(console.error);
