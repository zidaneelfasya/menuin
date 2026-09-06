"use server";

import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export async function updatePosSettings(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) {
    throw new Error("Unauthorized");
  }

  const posKitchenSync = formData.get("posKitchenSync") === "true";
  const posOrderTypeSelection = formData.get("posOrderTypeSelection") as string || "MANUAL";
  const posTaxRateStr = formData.get("posTaxRate") as string;
  const posTaxRate = parseFloat(posTaxRateStr) || 0;
  const taxName = (formData.get("taxName") as string) || "Pajak (PB1)";
  const serviceChargeRate = parseFloat(formData.get("serviceChargeRate") as string) || 0;
  const grabFoodFeeRate = parseFloat(formData.get("grabFoodFeeRate") as string) || 0;
  const shopeeFoodFeeRate = parseFloat(formData.get("shopeeFoodFeeRate") as string) || 0;
  const goFoodFeeRate = parseFloat(formData.get("goFoodFeeRate") as string) || 0;
  const posPinBestSellers = formData.get("posPinBestSellers") === "true";

  try {
    await db.update(tenants)
      .set({ 
        posKitchenSync,
        posOrderTypeSelection,
        posTaxRate: posTaxRate.toString(),
        taxName,
        serviceChargeRate: serviceChargeRate.toString(),
        grabFoodFeeRate: grabFoodFeeRate.toString(),
        shopeeFoodFeeRate: shopeeFoodFeeRate.toString(),
        goFoodFeeRate: goFoodFeeRate.toString(),
        posPinBestSellers,
        updatedAt: new Date()
      })
      .where(eq(tenants.id, user.tenantId));
    
    revalidatePath("/tenants/settings");
    revalidatePath("/tenants/settings");
    revalidatePath("/tenants/pos");
    return { success: true };
  } catch (error) {
    console.error("Failed to update POS settings:", error);
    return { error: "Gagal menyimpan pengaturan kasir." };
  }
}
