import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  console.log('Updating DB schema for promotions...');
  await sql`
    ALTER TABLE promotions 
    ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'ALL' NOT NULL,
    ADD COLUMN IF NOT EXISTS applicable_product_ids jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS min_product_qty integer DEFAULT 1 NOT NULL;
  `;
  await sql`
    ALTER TABLE transactions 
    ADD COLUMN IF NOT EXISTS promotion_id uuid REFERENCES promotions(id) ON DELETE SET NULL;
  `;
  console.log('Database columns added successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
