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

  try {
    await db.update(tenants)
      .set({ 
        posKitchenSync,
        posOrderTypeSelection,
        posTaxRate: posTaxRate.toString()
      })
      .where(eq(tenants.id, user.tenantId));
    
    revalidatePath("/tenants/pos/settings");
    revalidatePath("/tenants/pos");
    return { success: true };
  } catch (error) {
    console.error("Failed to update POS settings:", error);
    return { error: "Gagal menyimpan pengaturan kasir." };
  }
}
