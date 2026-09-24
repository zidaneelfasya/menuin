import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

async function clearData() {
  console.log('Menghapus semua data tabel (kecuali users)...');

  try {
    await db.delete(schema.transactionItems);
    await db.delete(schema.transactions);
    await db.delete(schema.products);
    await db.delete(schema.categories);
    // Tidak menghapus users agar login tetap bisa dilakukan

    console.log('✅ Semua data produk, kategori, dan transaksi berhasil dihapus!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat menghapus data:', error);
    process.exit(1);
  }
}

clearData();
