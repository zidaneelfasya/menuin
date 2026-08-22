'use server';

import { db } from '../db';
import { products, categories } from '../db/schema';
import { getCurrentUser } from './auth';
import * as xlsx from 'xlsx';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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

function generateSku(name: string, index: number) {
  // e.g. "Bolu Keju" -> "BK-001"
  const initials = name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
    .substring(0, 3);
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${initials}-${randomPart}-${index}`; // ensuring uniqueness
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

export async function importProducts(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Sesi tidak ditemukan. Silakan login kembali.' };
    }
    const dashboardId = user.dashboardId;

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'File tidak ditemukan' };
    }

    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Read raw data
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    // Data starts at row 4 (index 3)
    // Row index 3 is headers, Row index 4 is the first data row
    if (rawData.length <= 4) {
      return { success: false, error: 'File kosong atau format tidak sesuai' };
    }

    // Get existing categories to map
    const existingCats = await db.select().from(categories);
    const categoryMap = new Map(existingCats.map(c => [c.name.toLowerCase(), c.id]));
    
    const newCategoriesToInsert = new Map<string, any>(); // Map to store new categories to insert

    const productsToInsert = [];
    
    for (let i = 4; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0 || !row[0]) continue; // Skip empty rows

      const name = row[0]?.toString().trim();
      const categoryNameRaw = row[1]?.toString().trim() || 'Uncategorized';
      // const merek = row[2] - ignored
      // const keterangan = row[3] - ignored
      // const variasi = row[4] - ignored
      const barcodeRaw = row[5]?.toString().trim();
      const baseHargaJual = parseFloat(row[6]) || 0;
      const hargaJualRaw = baseHargaJual - (baseHargaJual * 0.3); // Kurangi 30%
      // const hargaKhusus = row[7] - ignored
      const hargaModalRaw = parseFloat(row[8]) || 0;
      const stokRaw = parseInt(row[9]) || 0;
      const stokMinRaw = parseInt(row[10]) || 0;

      if (!name) continue;

      // Handle Category Map
      const categoryKey = categoryNameRaw.toLowerCase();
      let categoryId = categoryMap.get(categoryKey);

      if (!categoryId) {
        // Prepare to insert new category
        if (!newCategoriesToInsert.has(categoryKey)) {
          const newId = crypto.randomUUID();
          newCategoriesToInsert.set(categoryKey, {
            id: newId,
            dashboardId,
            name: categoryNameRaw,
            slug: slugify(categoryNameRaw)
          });
          categoryId = newId;
          categoryMap.set(categoryKey, newId); // add to map so subsequent rows use it
        } else {
          categoryId = newCategoriesToInsert.get(categoryKey).id;
        }
      }

      // Handle Barcode & SKU
      const barcode = barcodeRaw || generateBarcode();
      const sku = generateSku(name, i);

      productsToInsert.push({
        dashboardId,
        name,
        categoryId,
        sku,
        barcode,
        price: hargaJualRaw.toString(),
        costPrice: hargaModalRaw.toString(),
        stock: stokRaw,
        minStock: stokMinRaw,
      });
    }

    // Insert new categories if any
    if (newCategoriesToInsert.size > 0) {
      await db.insert(categories).values(Array.from(newCategoriesToInsert.values()));
    }

    // Insert products in batches of 50
    const batchSize = 50;
    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize);
      await db.insert(products).values(batch).onConflictDoNothing(); // prevent crashing on duplicate SKU/barcode if any clash
    }

    revalidatePath('/products');
    revalidatePath('/inventory');
    revalidatePath('/pos');
    
    return { 
      success: true, 
      message: `Berhasil mengimpor ${productsToInsert.length} produk.` 
    };

  } catch (error: any) {
    console.error('Error importing products:', error);
    return { success: false, error: error.message || 'Gagal mengimpor produk' };
  }
}
