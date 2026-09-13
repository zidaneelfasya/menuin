'use server';

import { db } from '../db';
import { products, categories } from '../db/schema';
import { getCurrentUser } from './auth';
import * as xlsx from 'xlsx';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function parseNumber(value: any, defaultValue: number = 0): number {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'number') return isNaN(value) ? defaultValue : value;
  
  const cleaned = value.toString().replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseBoolean(value: any, defaultValue: boolean = false): boolean {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  const str = value.toString().trim().toUpperCase();
  if (['YA', 'YES', 'TRUE', '1', 'Y', 'BENAR'].includes(str)) return true;
  if (['TIDAK', 'NO', 'FALSE', '0', 'N', 'SALAH'].includes(str)) return false;
  return defaultValue;
}

/**
 * Import Kategori dari Excel
 */
export async function importCategories(formData: FormData) {
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
    if (!workbook.SheetNames.length) {
      return { success: false, error: 'File Excel tidak memiliki lembar kerja (worksheet)' };
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (!rawData || rawData.length === 0) {
      return { success: false, error: 'File Excel kosong' };
    }

    // Find header row index
    let headerRowIndex = 0;
    let nameColIndex = 0;
    let orderColIndex = 1;

    for (let r = 0; r < Math.min(rawData.length, 5); r++) {
      const row = rawData[r];
      if (!row) continue;
      const rowStr = row.map(cell => (cell || '').toString().toLowerCase());
      
      const foundNameIdx = rowStr.findIndex(c => c.includes('nama') || c.includes('kategori') || c.includes('category'));
      if (foundNameIdx !== -1) {
        headerRowIndex = r;
        nameColIndex = foundNameIdx;
        const foundOrderIdx = rowStr.findIndex(c => c.includes('urutan') || c.includes('order') || c.includes('display'));
        if (foundOrderIdx !== -1) orderColIndex = foundOrderIdx;
        break;
      }
    }

    // Fetch existing categories for tenant
    const existingCats = await db
      .select()
      .from(categories)
      .where(eq(categories.tenantId, tenantId));
    
    const existingSlugMap = new Map(existingCats.map(c => [c.slug, c]));
    const existingNameMap = new Map(existingCats.map(c => [c.name.toLowerCase().trim(), c]));

    const categoriesToInsert: any[] = [];
    const categoriesToUpdate: { id: string; name: string; displayOrder: number }[] = [];
    const processedSlugs = new Set<string>();

    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      const rawName = row[nameColIndex]?.toString().trim();
      if (!rawName) continue;

      const displayOrder = parseNumber(row[orderColIndex], 0);
      let slug = slugify(rawName);
      if (!slug) slug = `kategori-${Date.now()}`;

      if (processedSlugs.has(slug)) continue;
      processedSlugs.add(slug);

      const existingByName = existingNameMap.get(rawName.toLowerCase());
      const existingBySlug = existingSlugMap.get(slug);
      const existing = existingByName || existingBySlug;

      if (existing) {
        categoriesToUpdate.push({
          id: existing.id,
          name: rawName,
          displayOrder,
        });
      } else {
        categoriesToInsert.push({
          id: crypto.randomUUID(),
          tenantId,
          name: rawName,
          slug,
          displayOrder,
        });
      }
    }

    if (categoriesToInsert.length === 0 && categoriesToUpdate.length === 0) {
      return { success: false, error: 'Tidak ada data kategori yang valid untuk diimpor.' };
    }

    // Insert new categories
    if (categoriesToInsert.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < categoriesToInsert.length; i += batchSize) {
        const batch = categoriesToInsert.slice(i, i + batchSize);
        await db.insert(categories).values(batch);
      }
    }

    // Update existing categories if needed
    for (const cat of categoriesToUpdate) {
      await db
        .update(categories)
        .set({ displayOrder: cat.displayOrder, updatedAt: new Date() })
        .where(and(eq(categories.id, cat.id), eq(categories.tenantId, tenantId)));
    }

    if (user.outletKey) {
      revalidatePath(`/outlet/${user.outletKey}`, 'layout');
      revalidatePath(`/outlet/${user.outletKey}/categories`, 'page');
      revalidatePath(`/outlet/${user.outletKey}/items`, 'page');
    }

    return {
      success: true,
      message: `Berhasil mengimpor ${categoriesToInsert.length} kategori baru dan memperbarui ${categoriesToUpdate.length} kategori.`,
    };
  } catch (error: any) {
    console.error('Error importing categories:', error);
    return { success: false, error: error.message || 'Gagal mengimpor data kategori' };
  }
}

/**
 * Import Menu Item / Produk dari Excel (tanpa SKU & Barcode)
 */
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
    if (!workbook.SheetNames.length) {
      return { success: false, error: 'File Excel tidak memiliki lembar kerja (worksheet)' };
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (!rawData || rawData.length === 0) {
      return { success: false, error: 'File kosong atau format tidak sesuai' };
    }

    // Determine header row and column mapping flexibly
    let headerRowIndex = 0;
    let colMap = {
      name: 0,
      category: 1,
      price: 2,
      costPrice: 3,
      stock: 4,
      minStock: 5,
      trackStock: 6,
      isFeatured: 7,
    };

    let foundHeader = false;
    for (let r = 0; r < Math.min(rawData.length, 6); r++) {
      const row = rawData[r];
      if (!row) continue;
      const rowStr = row.map(cell => (cell || '').toString().toLowerCase().trim());
      
      const nameIdx = rowStr.findIndex(c => c.includes('nama item') || c.includes('nama produk') || c.includes('nama') || c === 'item' || c === 'product');
      if (nameIdx !== -1) {
        headerRowIndex = r;
        foundHeader = true;
        colMap.name = nameIdx;

        const catIdx = rowStr.findIndex(c => c.includes('kategori') || c.includes('category'));
        if (catIdx !== -1) colMap.category = catIdx;

        const priceIdx = rowStr.findIndex(c => c.includes('harga jual') || c === 'harga' || c.includes('selling') || c.includes('price'));
        if (priceIdx !== -1) colMap.price = priceIdx;

        const costIdx = rowStr.findIndex(c => c.includes('harga modal') || c.includes('modal') || c.includes('hpp') || c.includes('cost'));
        if (costIdx !== -1) colMap.costPrice = costIdx;

        const stockIdx = rowStr.findIndex(c => (c.includes('stok') && !c.includes('min') && !c.includes('lacak')) || c === 'stock' || c === 'qty');
        if (stockIdx !== -1) colMap.stock = stockIdx;

        const minStockIdx = rowStr.findIndex(c => c.includes('stok min') || c.includes('minimal') || c.includes('min stock'));
        if (minStockIdx !== -1) colMap.minStock = minStockIdx;

        const trackIdx = rowStr.findIndex(c => c.includes('lacak') || c.includes('track'));
        if (trackIdx !== -1) colMap.trackStock = trackIdx;

        const featIdx = rowStr.findIndex(c => c.includes('best seller') || c.includes('unggulan') || c.includes('featured'));
        if (featIdx !== -1) colMap.isFeatured = featIdx;

        break;
      }
    }

    const dataStartRow = foundHeader ? headerRowIndex + 1 : 1;

    // Get existing categories
    const existingCats = await db
      .select()
      .from(categories)
      .where(eq(categories.tenantId, tenantId));
    
    const categoryMap = new Map<string, string>();
    existingCats.forEach(c => {
      categoryMap.set(c.name.toLowerCase().trim(), c.id);
      categoryMap.set(c.slug, c.id);
    });

    const newCategoriesToInsert = new Map<string, any>();

    // Get existing products for tenant to check if item already exists by name
    const existingProducts = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.tenantId, tenantId));

    const existingNameMap = new Map(existingProducts.map(p => [p.name.toLowerCase().trim(), p.id]));

    const productsToInsert = [];
    const productsToUpdate: any[] = [];
    let processedCount = 0;

    for (let i = dataStartRow; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      const name = row[colMap.name]?.toString().trim();
      if (!name) continue;

      const categoryNameRaw = row[colMap.category]?.toString().trim() || 'Umum';
      const categoryKey = categoryNameRaw.toLowerCase();
      let categoryId = categoryMap.get(categoryKey);

      if (!categoryId) {
        if (!newCategoriesToInsert.has(categoryKey)) {
          const newId = crypto.randomUUID();
          let slug = slugify(categoryNameRaw);
          if (!slug) slug = `kategori-${Date.now()}`;

          newCategoriesToInsert.set(categoryKey, {
            id: newId,
            tenantId,
            name: categoryNameRaw,
            slug,
            displayOrder: 0,
          });
          categoryId = newId;
          categoryMap.set(categoryKey, newId);
        } else {
          categoryId = newCategoriesToInsert.get(categoryKey).id;
        }
      }

      const price = parseNumber(row[colMap.price], 0);
      const costPrice = parseNumber(row[colMap.costPrice], 0);
      const stock = Math.floor(parseNumber(row[colMap.stock], 0));
      const minStock = Math.floor(parseNumber(row[colMap.minStock], 5));
      const trackStock = colMap.trackStock !== undefined && row[colMap.trackStock] !== undefined
        ? parseBoolean(row[colMap.trackStock], true)
        : true;
      const isFeatured = colMap.isFeatured !== undefined && row[colMap.isFeatured] !== undefined
        ? parseBoolean(row[colMap.isFeatured], false)
        : false;

      const existingId = existingNameMap.get(name.toLowerCase());

      if (existingId) {
        productsToUpdate.push({
          id: existingId,
          name,
          categoryId,
          price: price.toString(),
          costPrice: costPrice.toString(),
          stock,
          minStock,
          trackStock,
          isFeatured,
          updatedAt: new Date(),
        });
      } else {
        productsToInsert.push({
          tenantId,
          name,
          categoryId,
          price: price.toString(),
          costPrice: costPrice.toString(),
          stock,
          minStock,
          trackStock,
          isFeatured,
        });
      }

      processedCount++;
    }

    if (processedCount === 0) {
      return { success: false, error: 'Tidak ada baris data produk yang valid untuk diimpor.' };
    }

    // Insert new categories if any
    if (newCategoriesToInsert.size > 0) {
      await db.insert(categories).values(Array.from(newCategoriesToInsert.values()));
    }

    // Update existing products
    for (const item of productsToUpdate) {
      await db
        .update(products)
        .set({
          name: item.name,
          categoryId: item.categoryId,
          price: item.price,
          costPrice: item.costPrice,
          stock: item.stock,
          minStock: item.minStock,
          trackStock: item.trackStock,
          isFeatured: item.isFeatured,
          updatedAt: item.updatedAt,
        })
        .where(and(eq(products.id, item.id), eq(products.tenantId, tenantId)));
    }

    // Insert new products in batches of 50
    const batchSize = 50;
    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize);
      await db.insert(products).values(batch);
    }

    if (user.outletKey) {
      revalidatePath(`/outlet/${user.outletKey}`, 'layout');
      revalidatePath(`/outlet/${user.outletKey}/items`, 'page');
      revalidatePath(`/outlet/${user.outletKey}/categories`, 'page');
      revalidatePath(`/outlet/${user.outletKey}/inventory`, 'page');
    }

    return {
      success: true,
      message: `Berhasil mengimpor ${productsToInsert.length} item baru dan memperbarui ${productsToUpdate.length} item.${
        newCategoriesToInsert.size > 0 ? ` (${newCategoriesToInsert.size} kategori baru otomatis dibuat)` : ''
      }`,
    };
  } catch (error: any) {
    console.error('Error importing products:', error);
    return { success: false, error: error.message || 'Gagal mengimpor produk' };
  }
}
