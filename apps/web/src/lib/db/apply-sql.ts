import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function run() {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    try {
      const envPath = path.resolve(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
        if (match) dbUrl = match[1];
      }
    } catch (e) {
      console.error('Failed reading .env.local:', e);
    }
  }

  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set and could not be loaded from .env.local');
  }

  const sql = postgres(dbUrl, { max: 1, prepare: false });
  try {
    console.log('Migrating schema: Adding gateway_fee and net_amount to transactions...');
    await sql.unsafe('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS gateway_fee numeric(12, 2) DEFAULT 0 NOT NULL;');
    await sql.unsafe('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS net_amount numeric(12, 2);');

    console.log('Migrating schema: Adding DOKU payment settings to tenants...');
    await sql.unsafe('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS doku_client_id text;');
    await sql.unsafe('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS doku_secret_key text;');
    await sql.unsafe('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS doku_sub_account_id text;');
    await sql.unsafe("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS doku_environment text DEFAULT 'sandbox';");

    console.log('Migrating schema: Adding pos_rounding to tenants and rounding to transactions...');
    await sql.unsafe('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pos_rounding boolean DEFAULT false NOT NULL;');
    await sql.unsafe('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS rounding numeric(12, 2) DEFAULT 0;');

    console.log('Backfilling net_amount and gateway_fee for existing transactions...');
    // Cash transactions: gateway_fee = 0, net_amount = grand_total
    await sql.unsafe(`
      UPDATE transactions 
      SET gateway_fee = 0, net_amount = grand_total 
      WHERE (payment_method ILIKE 'CASH' OR payment_method ILIKE 'TUNAI') AND (net_amount IS NULL OR net_amount = 0);
    `);

    // Non-cash (QRIS, ONLINE, etc.): gateway_fee = 0.7% MDR (or platform_fee if set), net_amount = grand_total - gateway_fee
    await sql.unsafe(`
      UPDATE transactions 
      SET 
        gateway_fee = CASE 
          WHEN COALESCE(platform_fee, 0) > 0 THEN platform_fee 
          ELSE ROUND(grand_total * 0.007, 2) 
        END,
        net_amount = grand_total - CASE 
          WHEN COALESCE(platform_fee, 0) > 0 THEN platform_fee 
          ELSE ROUND(grand_total * 0.007, 2) 
        END
      WHERE (payment_method NOT ILIKE 'CASH' AND payment_method NOT ILIKE 'TUNAI') AND (net_amount IS NULL OR net_amount = 0);
    `);

    // Any remaining nulls fallback to grand_total
    await sql.unsafe(`
      UPDATE transactions 
      SET gateway_fee = 0, net_amount = grand_total 
      WHERE net_amount IS NULL;
    `);

    console.log('All migrations and backfill applied successfully!');
  } catch (e) {
    console.error('Failed to execute statement:', e);
    process.exit(1);
  } finally {
    await sql.end();
  }
  process.exit(0);
}

run();
