import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import * as xlsx from 'xlsx';
import * as path from 'path';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

function generateBarcode() {
  const prefix = '899'; 
  const randomPart = Math.floor(100000000 + Math.random() * 900000000).toString();
  const code = prefix + randomPart;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit.toString();
}

function generateSku(name: string, index: number) {
  const initials = name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
    .substring(0, 3);
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${initials}-${randomPart}-${index}`; 
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function runSeed() {
  console.log('🔄 Memulai simulasi seeder realistis...');

  try {
    // 1. Bersihkan tabel
    console.log('🧹 Membersihkan tabel transaksi, produk, dan kategori...');
    await db.delete(schema.transactionItems);
    await db.delete(schema.transactions);
    await db.delete(schema.products);
    await db.delete(schema.categories);

    // Ambil cashierId pertama yang ada di db
    const users = await db.select().from(schema.users).limit(1);
    const cashierId = users.length > 0 ? users[0].id : null;

    if (!cashierId) {
      console.log('⚠️ Peringatan: Tidak ada user/cashier ditemukan. Transaksi akan disimpan tanpa cashierId.');
    }

    // 2. Baca Excel dan Import Produk
    console.log('📂 Membaca file Excel...');
    const filePath = path.resolve('src/file_export/Produk.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    const categoryMap = new Map<string, string>();
    const categoriesToInsert = [];
    const productsToInsert = [];

    // Data mulai di index 4
    for (let i = 4; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0 || !row[0]) continue;

      const name = row[0]?.toString().trim();
      const categoryNameRaw = row[1]?.toString().trim() || 'Lainnya';
      const barcodeRaw = row[5]?.toString().trim();
      
      const baseHargaJual = parseFloat(row[6]) || 0;
      const hargaJualRaw = baseHargaJual - (baseHargaJual * 0.3); // Sesuai aturan baru: diskon 30%
      const hargaModalRaw = parseFloat(row[8]) || (hargaJualRaw * 0.5); // Kalau modal kosong, set 50% dari harga jual
      
      // Berikan stok awal agar toko terlihat hidup
      const stokRaw = parseInt(row[9]) || randomInt(50, 300);
      const stokMinRaw = parseInt(row[10]) || 10;

      if (!name) continue;

      const catKey = categoryNameRaw.toLowerCase();
      let catId = categoryMap.get(catKey);
      
      if (!catId) {
        catId = crypto.randomUUID();
        categoryMap.set(catKey, catId);
        categoriesToInsert.push({
          id: catId,
          name: categoryNameRaw,
          slug: slugify(categoryNameRaw)
        });
      }

      productsToInsert.push({
        id: crypto.randomUUID(),
        name,
        categoryId: catId,
        sku: generateSku(name, i),
        barcode: barcodeRaw || generateBarcode(),
        price: hargaJualRaw.toString(),
        costPrice: hargaModalRaw.toString(),
        stock: stokRaw,
        minStock: stokMinRaw,
      });
    }

    if (categoriesToInsert.length > 0) {
      await db.insert(schema.categories).values(categoriesToInsert);
      console.log(`✅ Berhasil menyimpan ${categoriesToInsert.length} Kategori.`);
    }

    if (productsToInsert.length > 0) {
      // Insert in chunks of 50 to avoid any limits
      for(let i=0; i<productsToInsert.length; i+=50) {
        await db.insert(schema.products).values(productsToInsert.slice(i, i+50)).onConflictDoNothing();
      }
      console.log(`✅ Berhasil menyimpan ${productsToInsert.length} Produk.`);
    }

    // 3. Simulasi Transaksi (30 Hari Terakhir)
    console.log('🛒 Memulai simulasi transaksi 30 hari terakhir...');
    
    const transactionsToInsert = [];
    const transactionItemsToInsert = [];
    
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Iterasi per hari
    for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
      // Setiap hari ada 10 - 40 transaksi
      const txCount = randomInt(10, 40);
      
      for (let t = 0; t < txCount; t++) {
        const txId = crypto.randomUUID();
        
        // Waktu transaksi acak di hari tersebut antara jam 08:00 - 21:00
        const txDate = new Date(d);
        txDate.setHours(randomInt(8, 20), randomInt(0, 59), randomInt(0, 59));
        
        // Transaksi berisi 1 - 5 item
        const itemCount = randomInt(1, 5);
        let totalAmount = 0;
        let totalCost = 0;

        // Pilih produk acak
        const selectedProducts: any[] = [];
        for(let j=0; j<itemCount; j++) {
           const p = productsToInsert[randomInt(0, productsToInsert.length - 1)];
           if (!selectedProducts.find(x => x.id === p.id)) {
             selectedProducts.push(p);
           }
        }

        for (const prod of selectedProducts) {
          const qty = randomInt(1, 3);
          const price = parseFloat(prod.price);
          const cost = parseFloat(prod.costPrice);
          const subtotal = price * qty;
          
          totalAmount += subtotal;
          totalCost += (cost * qty);

          transactionItemsToInsert.push({
            id: crypto.randomUUID(),
            transactionId: txId,
            productId: prod.id,
            quantity: qty,
            price: price.toString(),
            subtotal: subtotal.toString(),
            costPrice: cost.toString(), // Optional, tapi kita simpan di sistem untuk history akurat jika ada fieldnya (belum ada di schema asli, kita asumsikan dihitung realtime dari produk)
            createdAt: txDate
          });
        }

        const isQris = Math.random() > 0.5;
        const paymentMethod = isQris ? 'qris' : 'cash';

        transactionsToInsert.push({
          id: txId,
          userId: cashierId,
          totalAmount: totalAmount.toString(),
          discount: '0',
          tax: '0',
          grandTotal: totalAmount.toString(),
          paymentMethod,
          status: 'COMPLETED',
          createdAt: txDate
        });
      }
    }

    // Insert transaksi in chunks
    console.log(`Menyimpan ${transactionsToInsert.length} riwayat transaksi...`);
    for(let i=0; i<transactionsToInsert.length; i+=500) {
      await db.insert(schema.transactions).values(transactionsToInsert.slice(i, i+500));
    }

    console.log(`Menyimpan ${transactionItemsToInsert.length} riwayat item terjual...`);
    // transactionItems schema tidak memiliki field costPrice, jadi kita hapus dari obyek sebelum insert
    const cleanedItems = transactionItemsToInsert.map(item => {
      const { costPrice, ...rest } = item;
      return rest;
    });

    for(let i=0; i<cleanedItems.length; i+=500) {
      await db.insert(schema.transactionItems).values(cleanedItems.slice(i, i+500));
    }

    console.log('🎉 Selesai! Data simulasi realistis berhasil ditanam.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Terjadi kesalahan saat seeding:', error);
    process.exit(1);
  }
}

runSeed();
