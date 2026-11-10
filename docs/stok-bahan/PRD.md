# Product Requirements Document (PRD): Stok Bahan

## 1. Ringkasan Eksekutif (Executive Summary)
Fitur **Stok Bahan** dirancang untuk memberikan visibilitas penuh dan kontrol persediaan bahan mentah/baku (*raw materials / supplies*) bagi merchant Menuin di berbagai sektor (makanan & minuman, konveksi & pakaian, perkayuan, kerajinan, hingga kemasan & bahan operasional). Fitur ini mengadopsi standar antarmuka **Daftar Produk** Menuin yang *data-first*, bersih, borderless, dan memiliki kurva belajar nol (*zero learning curve*).

---

## 2. Tujuan & Sasaran (Objectives & Goals)
1. **Pencatatan Persediaan Universal:** Mendukung berbagai jenis bahan dengan satuan fleksibel (kg, liter, gram, ml, pcs, roll, meter, lembar, pack, box, porsi).
2. **Kemudahan & Kecepatan Mutasi (One-Click Quick Adjust):** Pengguna dapat menambah (restok) atau mengurangi (terpakai/rusak) stok bahan langsung dari baris tabel atau kartu tanpa berpindah halaman.
3. **Peringatan Dini Stok Menipis (Low Stock Prevention):** Status stok terintegrasi dengan batas minimum stok (*minimum threshold*) untuk mencegah kehabisan bahan produksi secara mendadak.
4. **Riwayat Keluar-Masuk Tercatat (Audit Trail):** Setiap perubahan stok terdokumentasi dengan jumlah mutasi, stok sebelum/sesudah, kategori alasan, dan nama staf/owner pencatat.
5. **Standar Desain Menuin:** 100% borderless, pure-white cards, dual-view (Tabel TanStack & Kartu), dan bayangan standar `shadow-sm-md` serta `shadow-md`.

---

## 3. Profil Pengguna & Kasus Penggunaan (User Personas & Use Cases)
* **Owner Toko F&B:** Ingin mencatat stok susu, sirup, biji kopi, daging, dan paper cup agar tahu kapan harus belanja mingguan.
* **Owner Ritel & Konveksi:** Ingin mencatat stok kain, benang, kancing, zipper, atau plastik kemasan.
* **Staf Dapur / Gudang:** Melakukan penerimaan barang dari kurir/supplier (Stok Masuk) atau mencatat bahan rusak/basi (Stok Keluar) secara instan via HP atau tablet kasir.

---

## 4. Spesifikasi Fungsional (Functional Specifications)

### 4.1. Manajemen Master Bahan
* **Atribut Bahan:**
  * Nama Bahan (Wajib, cth: *Susu UHT Full Cream*, *Kain Katun Rayon*)
  * SKU / Kode Bahan (Opsional, cth: *MAT-001*)
  * Kategori Bahan (Opsional, cth: *Dairy & Susu*, *Bahan Kering*, *Packaging*)
  * Satuan Ukuran (Wajib, pilihan preset + input bebas: *kg, liter, gram, ml, pcs, roll, meter, lembar, pack, box*)
  * Stok Saat Ini (Desimal 2 angka di belakang koma untuk presisi bahan)
  * Batas Minimum Stok (Opsional, default: 5)
  * Estimasi Harga Modal per Satuan (Opsional, cth: Rp 18.000 / Liter)
  * Catatan / Keterangan (Opsional)
  * Status Aktif (Boolean)

### 4.2. Status Tab Filter (Persis Daftar Produk)
* **Semua Bahan:** Menampilkan semua bahan aktif dengan total counter.
* **Stok Aman:** Bahan dengan stok saat ini $>$ batas minimum stok.
* **Stok Menipis:** Bahan dengan stok saat ini $\le$ batas minimum stok (aksen warna amber).
* **Habis:** Bahan dengan stok saat ini $= 0$ (aksen warna rose).

### 4.3. Dual-View Mode (Tabel & Kartu)
* **Mode Tabel (TanStack Data Table):**
  * Kolom: Checkbox Seleksi Massal, Nama Bahan & SKU, Kategori, Satuan, Sisa Stok (dengan badge status), Batas Minimum, Tombol Aksi Cepat `[ - ]` dan `[ + ]`, serta Menu 3 Titik.
* **Mode Kartu (Grid View):**
  * Grid 3–4 kolom kartu putih `shadow-sm-md hover:shadow-md border-none rounded-2xl/rounded-3xl` dengan nama, satuan, stok besar, dan tombol cepat.

### 4.4. Modal Mutasi Keluar-Masuk Cepat (*Quick Stock Dialog*)
* Pilihan Tipe Mutasi: `[+ Stok Masuk]` dan `[- Stok Keluar]`
* Input Kuantitas dengan label satuan otomatis
* Kategori Alasan:
  * **Masuk:** *Pembelian Vendor / Supplier*, *Koreksi Lebih (+ Opname)*, *Retur*, *Lainnya*.
  * **Keluar:** *Terpakai Produksi / Operasional*, *Basi / Kedaluwarsa*, *Rusak / Tumpah*, *Koreksi Kurang (- Opname)*, *Lainnya*.
* Pratinjau Kalkulasi Real-time: *"Stok Saat Ini $\rightarrow$ Perubahan $\rightarrow$ Stok Proyeksi"*.
* Catatan opsional & tombol simpan.

### 4.5. Log Riwayat Mutasi (*Movement History Modal*)
* Menampilkan daftar linimasa mutasi bahan dengan filter waktu (*Date Range Picker*), filter tipe (*Masuk/Keluar*), dan keterangan rinci.

---

## 5. Standar Desain UI & Token Menuin
* **100% Borderless (`border-none`):** Tidak ada border kaku antar baris atau sekeliling kartu.
* **Pure White Surfaces (`bg-white`):** Kontainer dan kartu menggunakan latar putih murni di atas kanvas abu lembut `#f8fafc`.
* **Standard Shadows:** Menggunakan `shadow-sm-md` dan `shadow-md` sesuai aturan sistem.
* **Tipografi:** Plafon font `font-semibold`, angka menggunakan `tabular-nums font-numeric`, dan kalimat berformat *sentence case* bersih.
* **Warna Aksen:** Biru brand `#0e59f9` untuk tombol utama dan interaksi aktif.
