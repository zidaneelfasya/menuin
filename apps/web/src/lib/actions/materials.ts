'use server';

import { db } from '@/lib/db';
import { rawMaterials, rawMaterialMovements } from '@/lib/db/schema';
import { eq, and, sql, desc, inArray, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { getCurrentUser } from './auth';

export type RawMaterialItem = {
  id: string;
  tenantId: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string;
  stock: number;
  minStock: number;
  costPerUnit: number;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RawMaterialMovementItem = {
  id: string;
  tenantId: string;
  rawMaterialId: string;
  materialName?: string;
  materialUnit?: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  previousStock: number;
  currentStock: number;
  reasonCategory: string | null;
  reason: string | null;
  actorName: string | null;
  createdAt: Date;
};

export type MaterialStatusFilter = 'ALL' | 'SAFE' | 'LOW_STOCK' | 'OUT_OF_STOCK';

const createMaterialSchema = z.object({
  name: z.string().min(1, 'Nama bahan wajib diisi'),
  sku: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unit: z.string().min(1, 'Satuan bahan wajib diisi').default('pcs'),
  stock: z.coerce.number().min(0, 'Stok minimal 0').default(0),
  minStock: z.coerce.number().min(0, 'Batas minimum minimal 0').default(5),
  costPerUnit: z.coerce.number().min(0).default(0),
  description: z.string().optional().nullable(),
});

const updateMaterialSchema = z.object({
  name: z.string().min(1, 'Nama bahan wajib diisi'),
  sku: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unit: z.string().min(1, 'Satuan bahan wajib diisi'),
  minStock: z.coerce.number().min(0, 'Batas minimum minimal 0').default(5),
  costPerUnit: z.coerce.number().min(0).default(0),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

const adjustStockSchema = z.object({
  rawMaterialId: z.string().uuid(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.coerce.number().min(0.01, 'Kuantitas harus lebih dari 0'),
  reasonCategory: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
});

// ============================================================================
// 1. GET RAW MATERIALS (With Status Counts & Filters)
// ============================================================================
export async function getRawMaterials(params?: {
  search?: string;
  status?: MaterialStatusFilter;
  category?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized', data: [], counts: { total: 0, safe: 0, lowStock: 0, outOfStock: 0 } };
    }

    const rows = await db
      .select()
      .from(rawMaterials)
      .where(and(eq(rawMaterials.tenantId, user.tenantId), eq(rawMaterials.isActive, true)))
      .orderBy(desc(rawMaterials.createdAt));

    // Convert decimal strings to numbers
    const items: RawMaterialItem[] = rows.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      name: r.name,
      sku: r.sku,
      category: r.category,
      unit: r.unit,
      stock: Number(r.stock) || 0,
      minStock: Number(r.minStock) || 0,
      costPerUnit: Number(r.costPerUnit) || 0,
      description: r.description,
      isActive: r.isActive,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    // Calculate status counts
    let totalCount = items.length;
    let safeCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    items.forEach((m) => {
      if (m.stock <= 0) {
        outOfStockCount++;
      } else if (m.stock <= m.minStock) {
        lowStockCount++;
      } else {
        safeCount++;
      }
    });

    // Apply Client/Query Filters
    let filtered = items;

    if (params?.status && params.status !== 'ALL') {
      if (params.status === 'SAFE') {
        filtered = filtered.filter((m) => m.stock > m.minStock);
      } else if (params.status === 'LOW_STOCK') {
        filtered = filtered.filter((m) => m.stock > 0 && m.stock <= m.minStock);
      } else if (params.status === 'OUT_OF_STOCK') {
        filtered = filtered.filter((m) => m.stock <= 0);
      }
    }

    if (params?.category && params.category !== 'ALL') {
      filtered = filtered.filter((m) => m.category === params.category);
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.sku && m.sku.toLowerCase().includes(q)) ||
          (m.category && m.category.toLowerCase().includes(q))
      );
    }

    return {
      success: true,
      data: filtered,
      counts: {
        total: totalCount,
        safe: safeCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
      },
    };
  } catch (error) {
    console.error('getRawMaterials error:', error);
    return {
      success: false,
      error: 'Gagal memuat daftar stok bahan',
      data: [],
      counts: { total: 0, safe: 0, lowStock: 0, outOfStock: 0 },
    };
  }
}

// ============================================================================
// 2. GET RAW MATERIAL CATEGORIES
// ============================================================================
export async function getRawMaterialCategories(): Promise<{ success: boolean; data: string[] }> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, data: [] };
    }

    const rows = await db
      .selectDistinct({ category: rawMaterials.category })
      .from(rawMaterials)
      .where(and(eq(rawMaterials.tenantId, user.tenantId), eq(rawMaterials.isActive, true)));

    const categories = rows
      .map((r) => r.category)
      .filter((c): c is string => Boolean(c && c.trim()))
      .sort((a, b) => a.localeCompare(b));

    return { success: true, data: categories };
  } catch (e) {
    console.error('getRawMaterialCategories error:', e);
    return { success: false, data: [] };
  }
}

// ============================================================================
// 3. CREATE RAW MATERIAL
// ============================================================================
export async function createRawMaterial(input: z.infer<typeof createMaterialSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    const parsed = createMaterialSchema.parse(input);

    const [created] = await db
      .insert(rawMaterials)
      .values({
        tenantId: user.tenantId,
        name: parsed.name.trim(),
        sku: parsed.sku?.trim() || null,
        category: parsed.category?.trim() || null,
        unit: parsed.unit.trim(),
        stock: parsed.stock.toString(),
        minStock: parsed.minStock.toString(),
        costPerUnit: parsed.costPerUnit.toString(),
        description: parsed.description?.trim() || null,
        isActive: true,
      })
      .returning();

    // If initial stock was provided, record initial movement
    if (parsed.stock > 0) {
      await db.insert(rawMaterialMovements).values({
        tenantId: user.tenantId,
        rawMaterialId: created.id,
        type: 'IN',
        quantity: parsed.stock.toString(),
        previousStock: '0',
        currentStock: parsed.stock.toString(),
        reasonCategory: 'RESTOCK_BATCH',
        reason: 'Stok Awal Penambahan Bahan',
        actorName: user.name || user.email || 'Owner',
      });
    }

    return { success: true, data: created };
  } catch (e: any) {
    console.error('createRawMaterial error:', e);
    return { success: false, error: e?.message || 'Gagal menambahkan bahan baru' };
  }
}

// ============================================================================
// 4. UPDATE RAW MATERIAL
// ============================================================================
export async function updateRawMaterial(id: string, input: z.infer<typeof updateMaterialSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    const parsed = updateMaterialSchema.parse(input);

    const [updated] = await db
      .update(rawMaterials)
      .set({
        name: parsed.name.trim(),
        sku: parsed.sku?.trim() || null,
        category: parsed.category?.trim() || null,
        unit: parsed.unit.trim(),
        minStock: parsed.minStock.toString(),
        costPerUnit: parsed.costPerUnit.toString(),
        description: parsed.description?.trim() || null,
        ...(parsed.isActive !== undefined ? { isActive: parsed.isActive } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(rawMaterials.id, id), eq(rawMaterials.tenantId, user.tenantId)))
      .returning();

    if (!updated) {
      return { success: false, error: 'Bahan tidak ditemukan' };
    }

    return { success: true, data: updated };
  } catch (e: any) {
    console.error('updateRawMaterial error:', e);
    return { success: false, error: e?.message || 'Gagal memperbarui bahan' };
  }
}

// ============================================================================
// 5. DELETE RAW MATERIAL
// ============================================================================
export async function deleteRawMaterial(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    const [deleted] = await db
      .delete(rawMaterials)
      .where(and(eq(rawMaterials.id, id), eq(rawMaterials.tenantId, user.tenantId)))
      .returning();

    if (!deleted) {
      return { success: false, error: 'Bahan tidak ditemukan atau sudah dihapus' };
    }

    return { success: true };
  } catch (e: any) {
    console.error('deleteRawMaterial error:', e);
    return { success: false, error: e?.message || 'Gagal menghapus bahan' };
  }
}

// ============================================================================
// 6. BULK DELETE RAW MATERIALS
// ============================================================================
export async function bulkDeleteRawMaterials(ids: string[]) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!ids.length) {
      return { success: true, count: 0 };
    }

    const deleted = await db
      .delete(rawMaterials)
      .where(and(inArray(rawMaterials.id, ids), eq(rawMaterials.tenantId, user.tenantId)))
      .returning({ id: rawMaterials.id });

    return { success: true, count: deleted.length };
  } catch (e: any) {
    console.error('bulkDeleteRawMaterials error:', e);
    return { success: false, error: e?.message || 'Gagal menghapus bahan terpilih' };
  }
}

// ============================================================================
// 7. ADJUST RAW MATERIAL STOCK (Stock In / Stock Out / Opname)
// ============================================================================
export async function adjustRawMaterialStock(input: z.infer<typeof adjustStockSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { rawMaterialId, type, quantity, reasonCategory, reason } = adjustStockSchema.parse(input);

    const existingList = await db
      .select()
      .from(rawMaterials)
      .where(and(eq(rawMaterials.id, rawMaterialId), eq(rawMaterials.tenantId, user.tenantId)))
      .limit(1);

    if (existingList.length === 0) {
      return { success: false, error: 'Bahan tidak ditemukan' };
    }

    const material = existingList[0];
    const oldStock = Number(material.stock) || 0;
    let newStock = oldStock;

    if (type === 'IN') {
      newStock = oldStock + quantity;
    } else if (type === 'OUT') {
      newStock = Math.max(0, oldStock - quantity);
    } else if (type === 'ADJUSTMENT') {
      newStock = Math.max(0, quantity);
    }

    // Atomic update
    const [updated] = await db
      .update(rawMaterials)
      .set({
        stock: newStock.toString(),
        updatedAt: new Date(),
      })
      .where(and(eq(rawMaterials.id, rawMaterialId), eq(rawMaterials.tenantId, user.tenantId)))
      .returning();

    // Record movement
    await db.insert(rawMaterialMovements).values({
      tenantId: user.tenantId,
      rawMaterialId,
      type,
      quantity: quantity.toString(),
      previousStock: oldStock.toString(),
      currentStock: newStock.toString(),
      reasonCategory: reasonCategory || 'OTHER',
      reason: reason?.trim() || null,
      actorName: user.name || user.email || 'Staf Gudang',
    });

    return {
      success: true,
      data: {
        rawMaterialId,
        previousStock: oldStock,
        currentStock: newStock,
        unit: material.unit,
      },
    };
  } catch (e: any) {
    console.error('adjustRawMaterialStock error:', e);
    return { success: false, error: e?.message || 'Gagal memperbarui stok bahan' };
  }
}

// ============================================================================
// 8. GET RAW MATERIAL MOVEMENTS (Audit Trail Log)
// ============================================================================
export async function getRawMaterialMovements(params?: {
  rawMaterialId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized', data: [] };
    }

    const conditions = [eq(rawMaterialMovements.tenantId, user.tenantId)];

    if (params?.rawMaterialId) {
      conditions.push(eq(rawMaterialMovements.rawMaterialId, params.rawMaterialId));
    }

    if (params?.startDate) {
      const start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);
      conditions.push(gte(rawMaterialMovements.createdAt, start));
    }

    if (params?.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(rawMaterialMovements.createdAt, end));
    }

    const rows = await db
      .select({
        id: rawMaterialMovements.id,
        tenantId: rawMaterialMovements.tenantId,
        rawMaterialId: rawMaterialMovements.rawMaterialId,
        type: rawMaterialMovements.type,
        quantity: rawMaterialMovements.quantity,
        previousStock: rawMaterialMovements.previousStock,
        currentStock: rawMaterialMovements.currentStock,
        reasonCategory: rawMaterialMovements.reasonCategory,
        reason: rawMaterialMovements.reason,
        actorName: rawMaterialMovements.actorName,
        createdAt: rawMaterialMovements.createdAt,
        materialName: rawMaterials.name,
        materialUnit: rawMaterials.unit,
      })
      .from(rawMaterialMovements)
      .leftJoin(rawMaterials, eq(rawMaterialMovements.rawMaterialId, rawMaterials.id))
      .where(and(...conditions))
      .orderBy(desc(rawMaterialMovements.createdAt))
      .limit(params?.limit || 100);

    const items: RawMaterialMovementItem[] = rows.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      rawMaterialId: r.rawMaterialId,
      materialName: r.materialName || 'Bahan',
      materialUnit: r.materialUnit || '',
      type: r.type,
      quantity: Number(r.quantity) || 0,
      previousStock: Number(r.previousStock) || 0,
      currentStock: Number(r.currentStock) || 0,
      reasonCategory: r.reasonCategory,
      reason: r.reason,
      actorName: r.actorName,
      createdAt: r.createdAt,
    }));

    return { success: true, data: items };
  } catch (e: any) {
    console.error('getRawMaterialMovements error:', e);
    return { success: false, error: e?.message || 'Gagal memuat riwayat mutasi bahan', data: [] };
  }
}
