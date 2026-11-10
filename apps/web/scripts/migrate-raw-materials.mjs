import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is missing!');
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

async function run() {
  console.log('Connecting to database...');

  await sql`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'raw_material_movement_type') THEN
        CREATE TYPE raw_material_movement_type AS ENUM ('IN', 'OUT', 'ADJUSTMENT');
      END IF;
    END $$;
  `;
  console.log('Enum raw_material_movement_type ensured.');

  await sql`
    CREATE TABLE IF NOT EXISTS raw_materials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sku TEXT,
      category TEXT,
      unit TEXT NOT NULL DEFAULT 'pcs',
      stock DECIMAL(12, 2) NOT NULL DEFAULT 0,
      min_stock DECIMAL(12, 2) NOT NULL DEFAULT 5,
      cost_per_unit DECIMAL(12, 2) DEFAULT 0,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  console.log('Table raw_materials ensured.');

  await sql`CREATE INDEX IF NOT EXISTS raw_materials_tenant_idx ON raw_materials(tenant_id);`;
  await sql`CREATE INDEX IF NOT EXISTS raw_materials_category_idx ON raw_materials(category);`;
  await sql`CREATE INDEX IF NOT EXISTS raw_materials_created_idx ON raw_materials(created_at);`;

  await sql`
    CREATE TABLE IF NOT EXISTS raw_material_movements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
      type raw_material_movement_type NOT NULL,
      quantity DECIMAL(12, 2) NOT NULL,
      previous_stock DECIMAL(12, 2) NOT NULL,
      current_stock DECIMAL(12, 2) NOT NULL,
      reason_category TEXT,
      reason TEXT,
      actor_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  console.log('Table raw_material_movements ensured.');

  await sql`CREATE INDEX IF NOT EXISTS raw_material_movements_tenant_idx ON raw_material_movements(tenant_id);`;
  await sql`CREATE INDEX IF NOT EXISTS raw_material_movements_material_idx ON raw_material_movements(raw_material_id);`;
  await sql`CREATE INDEX IF NOT EXISTS raw_material_movements_created_idx ON raw_material_movements(created_at);`;

  console.log('Checking all tenants for seed materials...');
  const tenantRows = await sql`SELECT id, name FROM tenants;`;
  for (const tenant of tenantRows) {
    const existing = await sql`SELECT COUNT(*)::int as count FROM raw_materials WHERE tenant_id = ${tenant.id};`;
    if (existing[0].count === 0) {
      console.log(`Seeding initial raw materials for tenant ${tenant.name} (${tenant.id})...`);
      const materialsToSeed = [
        { name: 'Susu UHT Full Cream', sku: 'RM-SUSU-01', category: 'Dairy & Cairan', unit: 'Liter', stock: 18.5, min_stock: 5, cost_per_unit: 18000 },
        { name: 'Biji Kopi Arabika Gayo', sku: 'RM-KOPI-01', category: 'Biji & Bubuk', unit: 'Kg', stock: 3.2, min_stock: 5, cost_per_unit: 140000 },
        { name: 'Sirup Karamel Monin', sku: 'RM-SYR-01', category: 'Sirup & Pemanis', unit: 'Botol', stock: 4, min_stock: 2, cost_per_unit: 125000 },
        { name: 'Paper Cup Hot 8oz', sku: 'RM-CUP-08', category: 'Packaging', unit: 'Pcs', stock: 450, min_stock: 100, cost_per_unit: 650 },
        { name: 'Lid Cup Hot 8oz', sku: 'RM-LID-08', category: 'Packaging', unit: 'Pcs', stock: 520, min_stock: 100, cost_per_unit: 250 },
        { name: 'Sedotan Kertas Steril', sku: 'RM-SDT-01', category: 'Packaging', unit: 'Pack', stock: 12, min_stock: 3, cost_per_unit: 15000 },
        { name: 'Matcha Powder Premium', sku: 'RM-TEA-01', category: 'Biji & Bubuk', unit: 'Kg', stock: 0.8, min_stock: 2, cost_per_unit: 280000 },
        { name: 'Kain Serbet Barista', sku: 'RM-KAI-01', category: 'Operasional', unit: 'Pcs', stock: 0, min_stock: 4, cost_per_unit: 12000 },
      ];

      for (const m of materialsToSeed) {
        const [inserted] = await sql`
          INSERT INTO raw_materials (tenant_id, name, sku, category, unit, stock, min_stock, cost_per_unit)
          VALUES (${tenant.id}, ${m.name}, ${m.sku}, ${m.category}, ${m.unit}, ${m.stock}, ${m.min_stock}, ${m.cost_per_unit})
          RETURNING id;
        `;

        if (m.stock > 0) {
          await sql`
            INSERT INTO raw_material_movements (tenant_id, raw_material_id, type, quantity, previous_stock, current_stock, reason_category, reason, actor_name)
            VALUES (${tenant.id}, ${inserted.id}, 'IN', ${m.stock}, 0, ${m.stock}, 'RESTOCK_BATCH', 'Stok Awal Inventaris', 'System');
          `;
        }
      }
      console.log(`Seeded materials for ${tenant.name}.`);
    } else {
      console.log(`Tenant ${tenant.name} already has ${existing[0].count} raw materials.`);
    }
  }

  await sql.end();
  console.log('Migration finished successfully!');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
