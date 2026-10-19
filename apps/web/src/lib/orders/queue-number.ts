/**
 * Utility murni untuk format nomor antrean dan nomor meja (Aman untuk Client Component & Server Component).
 * JANGAN mengimpor driver database (db/postgres) di file ini.
 */

/**
 * Format nomor antrean untuk tampilan UI/Nota/Ticket:
 * Contoh:
 *  - 1 -> "#01" (default 2 digit) atau 3 digit jika diperlukan
 */
export function formatQueueNumber(queueNumber: number | null | undefined, padDigits = 3): string {
  if (queueNumber === null || queueNumber === undefined || isNaN(queueNumber)) return "#---";
  return `#${String(queueNumber).padStart(padDigits, "0")}`;
}

/**
 * Format nomor meja standar Menuin ("meja 000"):
 * Contoh:
 *  - "4" / "Meja 4" -> "Meja 004"
 *  - "12" -> "Meja 012"
 *  - Takeaway tanpa meja -> "Takeaway"
 *  - Online tanpa meja -> "Online"
 */
export function formatTableDisplay(
  tableNumber: string | null | undefined, 
  orderType?: string | null
): string {
  const cleanTable = tableNumber ? String(tableNumber).trim() : "";
  if (cleanTable && cleanTable !== "null" && cleanTable !== "undefined") {
    const digits = cleanTable.replace(/\D/g, "");
    if (digits) {
      return `Meja ${digits.padStart(3, "0")}`;
    }
    // Jika non-angka (misal VIP)
    return `Meja ${cleanTable.toUpperCase()}`;
  }

  // Jika meja kosong, gunakan ordertype sebagai pengganti
  const normType = String(orderType || "").toUpperCase();
  if (normType === "TAKE_AWAY" || normType === "TAKEAWAY") return "Takeaway";
  if (normType === "ONLINE") return "Online";
  if (normType === "DINE_IN" || normType === "DINEIN") return "Dine In";
  return normType ? normType : "Dine In";
}
