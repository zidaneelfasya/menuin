import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({path:'.env.local'});
const sql = postgres(process.env.DATABASE_URL);
sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'PENDING';`
  .then(() => {
    console.log('Column added');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
