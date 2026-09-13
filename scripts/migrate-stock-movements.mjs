import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not defined in apps/web/.env.local!');
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function migrate() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL DEFAULT 0,
        current_stock INTEGER NOT NULL DEFAULT 0,
        reason TEXT,
        reference_id TEXT,
        actor_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS stock_movements_tenant_idx ON stock_movements(tenant_id, created_at DESC);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS stock_movements_product_idx ON stock_movements(product_id);
    `;

    console.log('Stock movements table migration successful!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await sql.end();
  }
}

migrate();
