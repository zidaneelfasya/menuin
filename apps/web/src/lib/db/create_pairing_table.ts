import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const query = 
    CREATE TABLE IF NOT EXISTS device_pairing_codes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id),
      code text UNIQUE NOT NULL,
      status text NOT NULL DEFAULT 'PENDING',
      expires_at timestamp with time zone NOT NULL,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );
  ;
  try {
    await pool.query(query);
    console.log('Table created successfully');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    pool.end();
  }
}
run();
