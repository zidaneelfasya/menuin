"use server";

import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export async function getTenantCatalogSettings() {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) {
    throw new Error("Unauthorized");
  }

  const result = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
  if (result.length === 0) {
    throw new Error("Tenant not found");
  }

  return result[0];
}

export async function updateCatalogStatus(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) {
    throw new Error("Unauthorized");
  }

  const storefrontEnabled = formData.get("storefrontEnabled") === "true";
  const slug = formData.get("slug") as string;

  // Basic slug validation
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    return { error: "URL Katalog hanya boleh berisi huruf kecil, angka, dan strip (-)." };
  }

  try {
    await db.update(tenants)
      .set({ 
        storefrontEnabled,
        slug: slug || null 
      })
      .where(eq(tenants.id, user.tenantId));
    
    revalidatePath("/tenants/catalog");
    return { success: true };
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return { error: "URL Katalog ini sudah digunakan oleh tenant lain." };
    }
    console.error("Failed to update catalog status:", error);
    return { error: "Gagal menyimpan perubahan." };
  }
}

export async function updateCatalogAppearance(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) {
    throw new Error("Unauthorized");
  }

  const storeDescription = formData.get("storeDescription") as string;
  const storeLogoUrl = formData.get("storeLogoUrl") as string;
  const storeBannerUrl = formData.get("storeBannerUrl") as string;
  const primaryColor = formData.get("primaryColor") as string;

  try {
    await db.update(tenants)
      .set({ 
        storeDescription,
        storeLogoUrl,
        storeBannerUrl,
        primaryColor
      })
      .where(eq(tenants.id, user.tenantId));
    
    revalidatePath("/tenants/catalog/appearance");
    return { success: true };
  } catch (error) {
    console.error("Failed to update appearance:", error);
    return { error: "Gagal menyimpan tampilan." };
  }
}

export async function updateCatalogOrdering(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) {
    throw new Error("Unauthorized");
  }

  const dineInEnabled = formData.get("dineInEnabled") === "true";
  const takeAwayEnabled = formData.get("takeAwayEnabled") === "true";
  const deliveryEnabled = formData.get("deliveryEnabled") === "true";
  const customerNameRequired = formData.get("customerNameRequired") === "true";
  const customerPhoneRequired = formData.get("customerPhoneRequired") === "true";
  const tableNumberRequired = formData.get("tableNumberRequired") === "true";
  
  const orderProcessType = formData.get("orderProcessType") as string || "MANUAL";
  
  const midtransServerKey = formData.get("midtransServerKey") as string;
  const midtransClientKey = formData.get("midtransClientKey") as string;
  const midtransEnvironment = formData.get("midtransEnvironment") as string;

  try {
    await db.update(tenants)
      .set({ 
        dineInEnabled,
        takeAwayEnabled,
        deliveryEnabled,
        customerNameRequired,
        customerPhoneRequired,
        tableNumberRequired,
        orderProcessType,
        midtransServerKey,
        midtransClientKey,
        midtransEnvironment
      })
      .where(eq(tenants.id, user.tenantId));
    
    revalidatePath("/tenants/catalog/ordering");
    return { success: true };
  } catch (error) {
    console.error("Failed to update ordering settings:", error);
    return { error: "Gagal menyimpan pengaturan." };
  }
}

import { products, tables } from "@/lib/db/schema";
import { and, desc } from "drizzle-orm";

export async function toggleProductVisibility(productId: string, field: 'isAvailableOnline' | 'isFeatured', value: boolean) {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) throw new Error("Unauthorized");

  try {
    await db.update(products)
      .set({ [field]: value })
      .where(and(eq(products.id, productId), eq(products.tenantId, user.tenantId)));
    
    revalidatePath("/tenants/catalog/visibility");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle visibility:", error);
    return { error: "Gagal memperbarui produk." };
  }
}

export async function getTenantTables() {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) throw new Error("Unauthorized");

  return await db.select().from(tables).where(eq(tables.tenantId, user.tenantId)).orderBy(desc(tables.createdAt));
}

export async function addTenantTable(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  if (!name) return { error: "Nama/Nomor meja harus diisi" };

  try {
    await db.insert(tables).values({
      tenantId: user.tenantId,
      name
    });
    revalidatePath("/tenants/catalog/tables");
    return { success: true };
  } catch (error) {
    console.error("Failed to add table:", error);
    return { error: "Gagal menambahkan meja." };
  }
}

export async function deleteTenantTable(tableId: string) {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) throw new Error("Unauthorized");

  try {
    await db.delete(tables).where(and(eq(tables.id, tableId), eq(tables.tenantId, user.tenantId)));
    revalidatePath("/tenants/catalog/tables");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete table:", error);
    return { error: "Gagal menghapus meja." };
  }
}
