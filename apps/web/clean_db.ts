import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

async function cleanDB() {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    await sql.begin(async (sql) => {
      // Disable triggers to avoid foreign key constraints during truncation
      await sql`SET session_replication_role = replica;`;
      
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
        await sql.unsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      }

      await sql`SET session_replication_role = DEFAULT;`;
      console.log('Database cleaned successfully.');
    });
  } catch (error) {
    console.error('Error cleaning database:', error);
  } finally {
    await sql.end();
  }
}

cleanDB();
