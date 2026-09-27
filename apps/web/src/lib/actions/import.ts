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
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 4) || 'MNU';
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `${initials}-${randomPart}-${index + 1}`;
}

function slugify(text: string) {
  const base = text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  return base || `cat-${Math.floor(1000 + Math.random() * 9000)}`;
}

function parseNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') return defaultValue;
  if (typeof value === 'number') return isNaN(value) ? defaultValue : value;
  
  // Bersihkan teks: "Rp 25.000", "25,000.00", "25.000"
  let cleanStr = value.toString().trim().replace(/^(Rp|rp|IDR)\s*/i, '');
  
  // Jika mengandung titik ribuan Indonesia misal 25.000 -> 25000
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(cleanStr)) {
    cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(cleanStr)) {
    // Format US 25,000.00
    cleanStr = cleanStr.replace(/,/g, '');
  } else {
    // Bersihkan karakter selain angka, titik, minus
    cleanStr = cleanStr.replace(/[^0-9.-]/g, '');
  }

  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseBoolean(value: any, defaultValue: boolean = true): boolean {
  if (value === null || value === undefined || value === '') return defaultValue;
  const str = value.toString().trim().toLowerCase();
  if (['ya', 'yes', 'true', '1', 'y', 'aktif', 'active'].includes(str)) return true;
  if (['tidak', 'no', 'false', '0', 't', 'nonaktif', 'inactive'].includes(str)) return false;
  return defaultValue;
}

export async function importProducts(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Sesi tidak ditemukan atau dashboard tidak valid.' };
    }
    const tenantId = user.tenantId;

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'File tidak ditemukan' };
    }

    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to raw 2D array
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (!rawData || rawData.length === 0) {
      return { success: false, error: 'File Excel kosong.' };
    }

    // Smart Header Finder: Deteksi baris mana yang merupakan header
    let headerRowIndex = -1;
    let colMap: Record<string, number> = {};

    for (let r = 0; r < Math.min(rawData.length, 10); r++) {
      const row = rawData[r];
      if (!row || !Array.isArray(row)) continue;

      const rowNormalized = row.map((cell) => (cell ? cell.toString().trim().toLowerCase() : ''));
      
      const hasNameCol = rowNormalized.some((c) => c.includes('nama') || c.includes('name') || c.includes('produk') || c.includes('menu'));
      const hasPriceCol = rowNormalized.some((c) => c.includes('harga') || c.includes('price') || c.includes('jual'));

      if (hasNameCol || hasPriceCol) {
        headerRowIndex = r;
        rowNormalized.forEach((cellText, colIdx) => {
          if (!cellText) return;
          if (cellText.includes('nama') || cellText.includes('name') || cellText.includes('item') || cellText.includes('produk') || cellText.includes('menu')) {
            if (colMap.name === undefined) colMap.name = colIdx;
          }
          if (cellText.includes('kategori') || cellText.includes('category')) {
            if (colMap.category === undefined) colMap.category = colIdx;
          }
          if (cellText.includes('harga jual') || cellText.includes('harga') || cellText.includes('price') || cellText.includes('jual')) {
            if (colMap.price === undefined) colMap.price = colIdx;
          }
          if (cellText.includes('modal') || cellText.includes('cost') || cellText.includes('hpp') || cellText.includes('beli')) {
            if (colMap.costPrice === undefined) colMap.costPrice = colIdx;
          }
          if (cellText.includes('stok min') || cellText.includes('min stock') || cellText.includes('minimum')) {
            if (colMap.minStock === undefined) colMap.minStock = colIdx;
          } else if (cellText.includes('stok') || cellText.includes('stock') || cellText.includes('qty')) {
            if (colMap.stock === undefined) colMap.stock = colIdx;
          }
          if (cellText.includes('lacak') || cellText.includes('track')) {
            if (colMap.trackStock === undefined) colMap.trackStock = colIdx;
          }
          if (cellText.includes('sku') || cellText.includes('kode')) {
            if (colMap.sku === undefined) colMap.sku = colIdx;
          }
          if (cellText.includes('barcode')) {
            if (colMap.barcode === undefined) colMap.barcode = colIdx;
          }
          if (cellText.includes('unggulan') || cellText.includes('best seller') || cellText.includes('featured')) {
            if (colMap.isFeatured === undefined) colMap.isFeatured = colIdx;
          }
          if (cellText.includes('deskripsi') || cellText.includes('keterangan') || cellText.includes('desc')) {
            if (colMap.description === undefined) colMap.description = colIdx;
          }
        });
        break;
      }
    }

    // Jika header tidak terdeteksi otomatis, gunakan fallback index standar template
    if (headerRowIndex === -1) {
      headerRowIndex = 0; // Mulai dari baris pertama
      colMap = {
        name: 0,
        category: 1,
        price: 2,
        costPrice: 3,
        stock: 4,
        minStock: 5,
        trackStock: 6,
        sku: 7,
        barcode: 8,
        isFeatured: 9,
        description: 10,
      };
    } else {
      // Pastikan kolom wajib terpetakan
      if (colMap.name === undefined) colMap.name = 0;
      if (colMap.price === undefined) colMap.price = colMap.category === 1 ? 2 : 1;
    }

    // Ambil data kategori yang sudah ada untuk tenant ini saja (Tenant Isolation)
    const existingCats = await db
      .select()
      .from(categories)
      .where(eq(categories.tenantId, tenantId));
    
    const categoryMap = new Map<string, string>();
    existingCats.forEach(c => {
      categoryMap.set(c.name.trim().toLowerCase(), c.id);
    });
    
    const newCategoriesToInsert = new Map<string, { id: string; tenantId: string; name: string; slug: string }>();

    const productsToInsert = [];
    let skippedRows = 0;

    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || !Array.isArray(row) || row.length === 0) continue;

      const rawName = colMap.name !== undefined ? row[colMap.name] : null;
      if (!rawName || rawName.toString().trim() === '') {
        skippedRows++;
        continue;
      }

      const name = rawName.toString().trim();
      const rawCategory = colMap.category !== undefined && row[colMap.category] ? row[colMap.category].toString().trim() : 'Lainnya';
      const categoryName = rawCategory || 'Lainnya';

      const price = parseNumber(colMap.price !== undefined ? row[colMap.price] : null, 0);
      const costPrice = parseNumber(colMap.costPrice !== undefined ? row[colMap.costPrice] : null, 0);
      const stock = Math.max(0, Math.floor(parseNumber(colMap.stock !== undefined ? row[colMap.stock] : null, 0)));
      const minStock = Math.max(0, Math.floor(parseNumber(colMap.minStock !== undefined ? row[colMap.minStock] : null, 5)));
      const trackStock = colMap.trackStock !== undefined ? parseBoolean(row[colMap.trackStock], true) : true;
      const isFeatured = colMap.isFeatured !== undefined ? parseBoolean(row[colMap.isFeatured], false) : false;
      const description = colMap.description !== undefined && row[colMap.description] ? row[colMap.description].toString().trim() : null;

      const rawBarcode = colMap.barcode !== undefined && row[colMap.barcode] ? row[colMap.barcode].toString().trim() : null;
      const rawSku = colMap.sku !== undefined && row[colMap.sku] ? row[colMap.sku].toString().trim() : null;

      // Handle Category Mapping & Auto Create
      const categoryKey = categoryName.toLowerCase();
      let categoryId = categoryMap.get(categoryKey);

      if (!categoryId) {
        if (!newCategoriesToInsert.has(categoryKey)) {
          const newId = crypto.randomUUID();
          const baseSlug = slugify(categoryName);
          newCategoriesToInsert.set(categoryKey, {
            id: newId,
            tenantId,
            name: categoryName,
            slug: `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`
          });
          categoryId = newId;
          categoryMap.set(categoryKey, newId);
        } else {
          categoryId = newCategoriesToInsert.get(categoryKey)!.id;
        }
      }

      // SKU & Barcode Generation
      const barcode = rawBarcode || generateBarcode();
      const sku = rawSku || generateSku(name, i);

      productsToInsert.push({
        tenantId,
        name,
        categoryId,
        sku,
        barcode,
        price: price.toString(),
        costPrice: costPrice.toString(),
        stock,
        minStock,
        trackStock,
        isFeatured,
        description,
        isAvailableOnline: true,
        isActive: true,
      });
    }

    if (productsToInsert.length === 0) {
      return { 
        success: false, 
        error: 'Tidak ditemukan baris menu yang valid dalam file Excel. Pastikan kolom Nama Menu dan Harga Jual terisi.' 
      };
    }

    // Insert kategori baru jika ada
    if (newCategoriesToInsert.size > 0) {
      const catList = Array.from(newCategoriesToInsert.values());
      await db.insert(categories).values(catList);
    }

    // Insert produk dalam batch
    const batchSize = 50;
    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize);
      await db.insert(products).values(batch);
    }

    if (user && typeof user === 'object' && 'outletKey' in user) {
      revalidatePath(`/outlet/${user.outletKey}`, 'layout');
    }

    const catCount = newCategoriesToInsert.size;
    let message = `Berhasil mengimpor ${productsToInsert.length} item menu.`;
    if (catCount > 0) {
      message += ` (${catCount} kategori baru otomatis dibuat)`;
    }

    return { 
      success: true, 
      message,
      importedCount: productsToInsert.length,
      categoriesCreated: catCount
    };

  } catch (error: any) {
    console.error('Error importing products:', error);
    return { 
      success: false, 
      error: error.message || 'Gagal mengimpor produk. Pastikan format file sesuai.' 
    };
  }
}
