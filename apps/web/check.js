import 'dotenv/config';
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const res = await sql`select slug, online_payment_enabled, midtrans_client_key from tenants`;
  console.log(res);
  process.exit(0);
}
run();
