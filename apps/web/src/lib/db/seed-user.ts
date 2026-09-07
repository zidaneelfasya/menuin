import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
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

async function main() {
  const targetEmail = 'zidaneelfasya@gmail.com';
  console.log(`Mencari tenant untuk email: ${targetEmail}`);

  // Find membership
  const userMemberships = await db.select({
    tenantId: schema.memberships.tenantId
  }).from(schema.memberships)
  .innerJoin(schema.accounts, eq(schema.memberships.accountId, schema.accounts.id))
  .where(eq(schema.accounts.email, targetEmail));
  
  if (userMemberships.length === 0) {
    console.error('User membership tidak ditemukan. Harap login/register terlebih dahulu di aplikasi web.');
    process.exit(1);
  }
  
  const tenantId = userMemberships[0].tenantId;
  const tenant = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId));
  console.log(`Ditemukan tenant: ${tenant[0]?.name} (${tenantId})`);

  // Hapus data lama (opsional)
  await db.delete(schema.products).where(eq(schema.products.tenantId, tenantId));
  await db.delete(schema.categories).where(eq(schema.categories.tenantId, tenantId));

  // Insert Kategori
  console.log('Menambahkan Kategori...');
  const catMinumanId = uuidv4();
  const catMakananId = uuidv4();
  const catSnackId = uuidv4();

  await db.insert(schema.categories).values([
    { id: catMinumanId, tenantId, name: 'Minuman Dingin', slug: 'minuman-dingin', displayOrder: 1 },
    { id: catMakananId, tenantId, name: 'Makanan Utama', slug: 'makanan-utama', displayOrder: 2 },
    { id: catSnackId, tenantId, name: 'Snack & Dessert', slug: 'snack-dessert', displayOrder: 3 },
  ]);

  // Insert Produk
  console.log('Menambahkan Produk...');
  const products = [
    {
      tenantId,
      categoryId: catMinumanId,
      name: 'Es Kopi Susu Aren',
      sku: 'MIN-001',
      price: '25000',
      costPrice: '12000',
      stock: 100,
      minStock: 10,
      isAvailableOnline: true,
      isFeatured: true,
    },
    {
      tenantId,
      categoryId: catMinumanId,
      name: 'Matcha Latte Dingin',
      sku: 'MIN-002',
      price: '28000',
      costPrice: '15000',
      stock: 50,
      minStock: 5,
      isAvailableOnline: true,
      isFeatured: false,
    },
    {
      tenantId,
      categoryId: catMakananId,
      name: 'Nasi Goreng Spesial',
      sku: 'MAK-001',
      price: '35000',
      costPrice: '20000',
      stock: 30,
      minStock: 5,
      isAvailableOnline: true,
      isFeatured: true,
    },
    {
      tenantId,
      categoryId: catMakananId,
      name: 'Mie Ayam Jamur',
      sku: 'MAK-002',
      price: '28000',
      costPrice: '15000',
      stock: 25,
      minStock: 5,
      isAvailableOnline: true,
      isFeatured: false,
    },
    {
      tenantId,
      categoryId: catSnackId,
      name: 'Kentang Goreng',
      sku: 'SNK-001',
      price: '20000',
      costPrice: '10000',
      stock: 40,
      minStock: 10,
      isAvailableOnline: true,
      isFeatured: false,
    },
    {
      tenantId,
      categoryId: catSnackId,
      name: 'Pisang Bakar Coklat Keju',
      sku: 'SNK-002',
      price: '22000',
      costPrice: '12000',
      stock: 30,
      minStock: 5,
      isAvailableOnline: true,
      isFeatured: true,
    }
  ];

  await db.insert(schema.products).values(products);

  console.log('✅ Selesai! Data berhasil di-seed.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
