# Implementation Plan: Stok Bahan

Rencana implementasi teknis fitur **Stok Bahan** di Menuin.

---

## 1. Tahapan Pengerjaan

### Tahap 1: Skema Database & Migrasi (Backend Database)
- [x] Rancang tabel `raw_materials` dan `raw_material_movements` di `apps/web/src/lib/db/schema.ts`.
- [x] Terapkan migrasi skema tabel langsung ke database PostgreSQL via script migrasi Node.js.
- [x] Pastikan indeks (`tenant_id`, `created_at`, `raw_material_id`) aktif.

### Tahap 2: Server Actions & Logika Mutasi Stok
- [x] Buat berkas server actions `apps/web/src/lib/actions/materials.ts`:
  - `getRawMaterials`: Mendapatkan daftar bahan dengan filter status (ALL, SAFE, LOW_STOCK, OUT_OF_STOCK) dan pencarian.
  - `createRawMaterial`: Menambahkan master bahan baru beserta pencatatan stok awal.
  - `updateRawMaterial`: Memperbarui data master bahan (nama, satuan, batas minimum, harga modal).
  - `deleteRawMaterial`: Menghapus bahan secara aman (soft delete atau cascade).
  - `adjustRawMaterialStock`: Logika penambahan/pengurangan stok dengan verifikasi dan pencatatan audit log mutasi atomik.
  - `getRawMaterialMovements`: Mengambil daftar log mutasi bahan (bisa per bahan atau global tenant).
  - `bulkDeleteRawMaterials`: Penghapusan massal bahan terpilih.

### Tahap 3: Komponen Antarmuka Pengguna (UI Layer)
- [x] Buat komponen utama `apps/web/src/features/materials/components/material-list.tsx`:
  - Header & Toolbar (Search bar, Kategori Popover, View Switcher Tabel/Kartu, Tombol Tambah).
  - Underline Filter Tabs (`Semua`, `Stok Aman`, `Stok Menipis`, `Habis`).
  - Table View (TanStack Table dengan checkbox dan inline quick action `+`/`-`).
  - Grid Card View (Pure-white borderless cards `shadow-sm-md hover:shadow-md`).
- [x] Buat modal mutasi cepat `material-quick-stock-dialog.tsx`:
  - Toggle `+ Masuk` & `- Keluar`, input kuantitas, pemilihan alasan, pratinjau kalkulasi langsung.
- [x] Buat modal formulir bahan `material-form-dialog.tsx`:
  - Input nama, satuan, batas minimum stok, harga modal, deskripsi.
- [x] Buat dialog riwayat log mutasi `material-movements-dialog.tsx`:
  - Linimasa catatan keluar-masuk dengan filter tanggal dan ringkasan mutasi.

### Tahap 4: Halaman Rute Next.js 15 & Navigasi Sidebar
- [x] Buat halaman rute `apps/web/src/app/outlet/[outletKey]/materials/page.tsx` dengan streaming suspense.
- [x] Buat loading skeleton `apps/web/src/app/outlet/[outletKey]/materials/loading.tsx` berstandar Menuin.
- [x] Daftarkan menu **Stok Bahan** pada sidebar `apps/web/src/components/layout/sidebar.tsx` setelah `Modifier` dan sebelum `Shift Kasir`.

### Tahap 5: Verifikasi & Audit Kualitas
- [x] Verifikasi tipe data via `npx tsc --noEmit` di `apps/web` (0 error).
- [x] Uji skenario mutasi stok (Stok Masuk, Stok Keluar, deteksi Stok Menipis).
