require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function cleanDB() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Disable triggers to avoid foreign key constraints during truncation
    await client.query('SET session_replication_role = replica;');
    
    // Truncate all custom tables
    const tables = [
      'accounts',
      'tenants',
      'subscriptions',
      'memberships',
      'invitations',
      'audit_logs',
      'categories',
      'items',
      'modifier_groups',
      'modifiers',
      'item_modifiers',
      'orders',
      'order_items',
      'order_item_modifiers',
      'transactions',
      'cash_movements',
      'pos_devices',
      'pos_sessions',
      'device_pairing_codes'
    ];

    for (const table of tables) {
      console.log(`Truncating table: ${table}...`);
      await client.query(`TRUNCATE TABLE "${table}" CASCADE;`);
    }

    await client.query('SET session_replication_role = DEFAULT;');
    await client.query('COMMIT');
    console.log('Database cleaned successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cleaning database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanDB();
