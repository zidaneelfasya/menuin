import 'server-only';
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { and, eq, sql, gte } from "drizzle-orm";

/**
 * Mendapatkan nomor urutan antrean berikutnya untuk sebuah outlet/tenant.
 * 
 * Strategi:
 * 1. Jika shiftId tersedia: Reset per shift aktif -> Cari MAX(queue_number) pada shift tersebut + 1.
 * 2. Jika shiftId tidak tersedia: Fallback reset harian -> Cari MAX(queue_number) pada hari ini + 1.
 */
export async function getNextQueueNumber(
  tenantId: string, 
  shiftId?: string | null,
  txClient: any = db
): Promise<number> {
  if (shiftId) {
    const [result] = await txClient
      .select({
        maxQueue: sql<number>`COALESCE(MAX(${transactions.queueNumber}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenantId),
          eq(transactions.shiftId, shiftId)
        )
      );

    return (Number(result?.maxQueue) || 0) + 1;
  }

  // Fallback harian jika tidak ada shift aktif
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [result] = await txClient
    .select({
      maxQueue: sql<number>`COALESCE(MAX(${transactions.queueNumber}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.tenantId, tenantId),
        gte(transactions.createdAt, startOfDay)
      )
    );

  return (Number(result?.maxQueue) || 0) + 1;
}
