# Source of Truth: Arsitektur Backend & Optimasi Fitur Pesanan Masuk (Menuin)

> File Source of Truth utama berada di: [`apps/web/src/features/orders/README.md`](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/features/orders/README.md)

Laporan dan blueprint arsitektur backend fitur **Pesanan Masuk** (*Incoming Orders / KDS / Kanban Board*) telah dirangkum secara lengkap di direktori fitur:
👉 **[Buka Laporan Lengkap: apps/web/src/features/orders/README.md](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/features/orders/README.md)**

---

### Ringkasan Eksekutif Analisis:
1. **Status Metode Saat Ini**: Menggunakan Supabase Realtime CDC (`postgres_changes` pada tabel `transactions`) dengan pemicu `router.refresh()`.
2. **Kelemahan Kritis yang Ditemukan**:
   - **SSR Thundering Herd**: Tiap 1 pesanan baru memicu N request SSR penuh ke server Next.js pada semua tablet yang terbuka (18+ query database per pesanan).
   - **Double Subscription**: Kanal ganda terbuka bersamaan (`RealtimeOrderProvider` di layout dan `KanbanBoard` di halaman).
   - **Race Condition 500ms**: `setTimeout(500)` digunakan untuk menunggu item selesai disimpan, beresiko menampilkan pesanan kosong saat jam sibuk.
   - **Item Desync**: Centang menu selesai oleh koki tidak tersinkronisasi secara realtime ke tablet lain karena hanya mendengarkan tabel `transactions`.
   - **Missing Index**: Belum ada compound index pada `(tenant_id, status, created_at)`.
3. **Solusi Terbaik (Paling Rendah Beban Server, Paling Memudahkan Pengguna)**:
   - **Hybrid Event-Driven Architecture (Single-Channel Optimistic Delta Realtime + Resilient Watermark)**.
   - **0 Full SSR Refresh**: Delta pesanan baru langsung digabungkan ke memori React (`setOrders`).
   - **Item-Level Sync**: Mendengarkan pembaruan `transaction_items`.
   - **Ketahanan Lapangan**: Sinkronisasi hening otomatis saat tablet menyala dari sleep mode (`visibilitychange` / focus) dan pengaman heartbeat berkala.
   - **Compound Index Database**: Penambahan indeks compound untuk kecepatan kueri <2ms.
