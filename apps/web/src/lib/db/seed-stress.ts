import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

// GS1 style Barcode generator (EAN-13)
function generateBarcode() {
  const prefix = '899'; // Indonesia
  const randomPart = Math.floor(100000000 + Math.random() * 900000000).toString();
  const code = prefix + randomPart;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit.toString();
}

async function main() {
  console.log('Stress Testing Seeder: Injecting 250 Products...');

  try {
    // 1. Clear existing data
    console.log('Clearing existing data...');
    // Delete all data first
    await db.delete(schema.transactionItems);
    await db.delete(schema.transactions);
    await db.delete(schema.shifts);
    await db.delete(schema.cashMovements);
    await db.delete(schema.memberships);
    await db.delete(schema.productModifierGroups);
    await db.delete(schema.products);
    await db.delete(schema.categories);
    await db.delete(schema.tenants);

    // 2. Insert Dashboard (tenant) + Memberships
    console.log('Inserting dashboard and memberships...');
    const [tenant] = await db.insert(schema.tenants).values({
      name: 'Stress Test Tenant',
      subscriptionTier: 'PRO',
      slug: 'stresstest',
    }).returning();
    const tenantId = tenant.id;

    const authUserId = uuidv4();
    
    // Insert into auth.users manually to satisfy the foreign key constraint
    await client`
      INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at) 
      VALUES (${authUserId}, 'tester@example.com', '{"name": "Stress Tester"}', now(), now())
      ON CONFLICT (id) DO NOTHING
    `;

    const [account] = await db.insert(schema.accounts).values({
      authUserId: authUserId,
      email: 'tester@example.com',
      name: 'Stress Tester',
    }).returning();

    const [membership] = await db.insert(schema.memberships).values({
      tenantId,
      accountId: account.id,
      displayName: 'Stress Tester',
      role: 'OWNER',
    }).returning();

    // 3. Insert Dummy Category
    console.log('Inserting category...');
    const catId = uuidv4();
    await db.insert(schema.categories).values([
      { id: catId, tenantId, name: 'Stress Test Category', slug: 'stress-test' }
    ]);

    // 4. Insert 250 Products
    console.log('Generating 250 products...');
    const productsToInsert = [];
    
    for (let i = 1; i <= 250; i++) {
      // Simulate authentic bakery names but random
      productsToInsert.push({
        name: `Bolu Varian Spesial #${i}`,
        sku: `BLV-${i.toString().padStart(4, '0')}`,
        categoryId: catId,
        price: (Math.floor(Math.random() * 50) + 10) * 1000 + '', // 10k to 60k
        costPrice: '5000',
        stock: Math.floor(Math.random() * 100) + 5,
        minStock: 10,
        imageUrl: null, // intentionally null to test fallback performance
        barcode: generateBarcode()
      });
    }

      // Insert in batches of 50 to avoid Postgres parameter limits
      const batchSize = 50;
      for (let i = 0; i < productsToInsert.length; i += batchSize) {
        const batch = productsToInsert.slice(i, i + batchSize).map((p) => ({ ...p, tenantId }));
        await db.insert(schema.products).values(batch);
        console.log(`Inserted batch ${i / batchSize + 1}...`);
      }

    console.log('Stress Test Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

main();
