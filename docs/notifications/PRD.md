# PRD: Menuin Notification System

**Product:** Menuin SaaS POS & Retail Ecosystem  
**Module:** Store & Account Notification Center  
**Status:** Approved for Implementation Planning  
**Target Platform:** Web Dashboard (`apps/web`)  
**Design Standard:** Menuin Pure-White Borderless Tactile Soft-UI (Anti-Slop & Strict Typography)

---

## 1. Overview & Business Context

Menuin membutuhkan sistem notifikasi manajemen terpusat pada header kanan atas website untuk mengelola komunikasi sistem, verifikasi merchant, kepatuhan penagihan (billing), promosi, dan audit operasional toko.

### Prinsip Pemisahan Arsitektur (Zero-Interference Principle)
Dalam ekosistem Menuin, terdapat dua aliran peristiwa (*event streams*) yang sengaja dipisahkan secara ketat untuk mencegah kelebihan kognitif (*cognitive overload*) pada staf toko:

1. **Aliran Notifikasi Operasional Kasir & Dapur (Real-Time Order Stream):**
   - Menangani pesanan masuk, perubahan status antrean meja, dan cetak struk dapur.
   - Ditangani oleh modul khusus: Modal Pesanan Masuk (`IncomingOrderModal`), lonceng audio dapur/kasir (`/notification.mp3`), dan papan kanban pesanan (`/outlet/[outletKey]/orders`).
   - **TIDAK DICAMPUR** ke dalam lonceng notifikasi kanan atas.

2. **Aliran Notifikasi Manajemen & Akun Toko (Store & Account Management Stream):**
   - Menangani audit administratif, verifikasi akun pembayaran (KYC/DOKU), peringatan jatuh tempo invoice langganan, masa berlaku promosi, dan rekonsiliasi kas shift.
   - Ditangani oleh ikon lonceng kanan atas melalui **Floating Popover** dan **Dedicated Notification Page** (`/outlet/[outletKey]/notifications`).

---

## 2. Problem Statement & Goals

### Problem Statement
- Pengguna (Owner & Manager) saat ini harus membuka modul yang berbeda-beda secara manual untuk memeriksa apakah verifikasi dokumen telah disetujui, apakah tagihan langganan mendekati jatuh tempo, atau apakah kuota kupon promo telah habis.
- Ketiadaan kanal notifikasi terpusat meningkatkan risiko penonaktifan fitur pembayaran online secara tiba-tiba akibat dokumen belum lengkap atau invoice langganan terlewat.

### Goals
1. Menyediakan titik akses tunggal (*single point of reference*) bagi manajemen toko untuk seluruh informasi penting terkait akun, kepatuhan, dan promosi.
2. Menyediakan mekanisme antarmuka ganda:
   - **Floating Popover:** Akses cepat 5–7 notifikasi terbaru tanpa berpindah halaman.
   - **Dedicated Notification Page:** Halaman lengkap dengan kemampuan filter kategori, filter rentang waktu, dan riwayat terstruktur.
3. Menjamin konsistensi visual dengan standar Menuin: *borderless*, kartu berlatar putih murni, bayangan *slate-periwinkle multi-stop*, dan tipografi bebas *slop* (tanpa *uppercase* sembarangan, tanpa *letter-tracking* artifisial).

---

## 3. Scope & Out of Scope

### In-Scope
- Skema basis data notifikasi multi-tenant (`notifications` table) dengan relasi ke tenant dan akun pengguna.
- Komponen *Floating Popover* interaktif pada top bar `header.tsx` dengan indikator *badge* belum dibaca (*unread count*).
- Halaman penuh `/outlet/[outletKey]/notifications` bergaya **Log Notifikasi** bersih (ala DOKU) tanpa tab kategori.
- Filter Rentang Tanggal Standar Menuin (*Date Range Picker*) dengan preset cepat (*Semua*, *Hari Ini*, *7 Hari*, *Bulan Ini*, *Bulan Lalu*) dan kalender interaktif.
- Fokus konten log bisnis esensial: Verifikasi Bisnis, Status & Pembayaran Langganan, dan Pembuatan/Manajemen Outlet.
- Tampilan kartu log: Sub-label metadata konteks & tanggal, judul tebal, deskripsi ringkas, dan tautan langsung `Lihat Detail ↗`.
- Aksi notifikasi: Tandai satu dibaca, tandai semua dibaca, navigasi aksi langsung (*Direct CTA*), filter belum dibaca, dan hapus riwayat.
- Pembaruan status *real-time* menggunakan Supabase Realtime WebSocket channel yang terisolasi.

### Out of Scope
- Notifikasi push browser native (Web Push API) untuk perangkat yang sedang tertutup / background service worker (direncanakan pada fase lanjutan).
- Pengiriman SMS/WhatsApp gateway (fitur ini ditangani terpisah oleh layanan perpesanan transaksional).
- Menampilkan pesanan meja atau pesanan kasir di dalam lonceng kanan atas.

---

## 4. User Personas & Matriks Akses Peran

| Peran (Role) | Kebutuhan Utama | Akses Popover | Akses Halaman Penuh | Cakupan Kategori yang Terlihat |
| :--- | :--- | :---: | :---: | :--- |
| **Owner** | Pengambilan keputusan bisnis, legalitas merchant, pembayaran langganan, dan pengawasan finansial toko. | Ya | Ya | **Semua Kategori:**<br>• Verifikasi<br>• Langganan<br>• Promosi<br>• Akun & Tim |
| **Manager** | Operasional harian outlet, efektivitas promosi, dan audit shift kasir. | Ya | Ya | • Verifikasi (operasional dokumen)<br>• Promosi<br>• Akun & Tim |
| **Cashier / Staff** | Pelayanan transaksi langsung dan kesesuaian shift pribadi. | Ya (Terbatas) | Ya (Terbatas) | • Akun & Tim (hanya terkait pergantian shift atau PIN pribadi) |

---

## 5. Taksonomi & Kategori Notifikasi

Sistem mendefinisikan 4 kategori bisnis utama dengan tingkat kepentingan (*severity*):

### 5.1. Kategori 1: Verifikasi & Rekening (`VERIFICATION`)
- **Tujuan:** Menjaga kelancaran operasional gerbang pembayaran (Payment Gateway DOKU & QRIS Dinamis).
- **Contoh Notifikasi & Tindakan:**
  - *Pengajuan Disetujui:* "Verifikasi profil bisnis Anda telah disetujui. Fitur pembayaran QRIS dan transfer bank kini aktif." → CTA: *"Lihat Status"*
  - *Dokumen Perlu Perbaikan:* "KTP penanggung jawab tidak terbaca jelas. Mohon unggah ulang foto identitas asli." → CTA: *"Perbarui Dokumen"*
  - *Rekening Pencairan Berhasil Didaftarkan:* "Rekening BCA atas nama PT Kuliner Jaya telah terverifikasi sebagai rekening pencairan dana otomatis." → CTA: *"Kelola Rekening"*

### 5.2. Kategori 2: Langganan & Tagihan (`BILLING`)
- **Tujuan:** Mencegah gangguan operasional akibat terputusnya paket langganan toko.
- **Contoh Notifikasi & Tindakan:**
  - *Pengingat Jatuh Tempo (H-7 & H-3):* "Langganan paket Pro untuk outlet Kopi Jotos akan berakhir pada 15 November 2026. Perpanjang sekarang untuk menjaga fitur tetap aktif." → CTA: *"Bayar Sekarang"*
  - *Konfirmasi Pembayaran:* "Pembayaran langganan tahunan berhasil dikonfirmasi. Masa aktif diperpanjang hingga November 2027." → CTA: *"Lihat Invoice"*
  - *Peringatan Masa Tenggang (Grace Period):* "Invoice paket langganan melewati batas tempo. Selesaikan pembayaran dalam 48 jam agar akses kasir tidak dibatasi." → CTA: *"Selesaikan Tagihan"*

### 5.3. Kategori 3: Promosi & Diskon (`PROMOTION`)
- **Tujuan:** Memberikan wawasan performa pemasaran kepada pemilik outlet.
- **Contoh Notifikasi & Tindakan:**
  - *Kupon Diaktifkan:* "Promo diskon 20% 'Menuin Anniversary' telah aktif dan dapat digunakan pelanggan." → CTA: *"Kelola Promo"*
  - *Kuota Kupon Menipis:* "Kupon diskon 'Kopi Santai' telah terpakai 90 dari 100 kuota yang tersedia." → CTA: *"Sesuaikan Kuota"*
  - *Promo Berakhir:* "Masa berlaku promosi 'Payday Deals' telah berakhir malam ini." → CTA: *"Lihat Rekap Promo"*

### 5.4. Kategori 4: Akun, Keamanan & Tim (`ACCOUNT_TEAM`)
- **Tujuan:** Audit jejak aktivitas administratif dan keamanan staf.
- **Contoh Notifikasi & Tindakan:**
  - *Staf Baru Bergabung:* "Budi Santoso telah menerima undangan dan terdaftar sebagai kasir di outlet Kopi Jotos." → CTA: *"Lihat Tim"*
  - *Perubahan PIN Kasir:* "PIN akses mesin POS utama telah diperbarui oleh Manajer Toko." → CTA: *"Kelola Akses"*
  - *Selisih Uang Laci Kasir (Cash Discrepancy):* "Sesi shift siang ditutup dengan selisih tunai sebesar -Rp15.000 dari hitungan sistem." → CTA: *"Cek Detail Shift"*

---

## 6. Spesifikasi Interaksi & Desain Antarmuka

### 6.1. Popover Mengambang (Floating Flyout di Header)
1. **Trigger & Anchor:** Terletak persis di bawah tombol lonceng pada top bar (`header.tsx`).
2. **Dimensi:** Lebar optimal 380px, tinggi maksimal 480px dengan area gulir internal (*custom scrollbar*).
3. **Komponen Header Popover:**
   - Judul: "Notifikasi" (Sentence case, teks slate-800, `font-semibold`, 14px).
   - Label unread: "3 belum dibaca" (Teks slate-400, 12px, spasi natural).
   - Tombol cepat: "Tandai semua dibaca" (Teks biru primer `#0e59f9`, `text-xs`, tanpa garis batas).
4. **Item Notifikasi:**
   - Ikon Kategori: Wadah bulat lembut (`w-8 h-8 rounded-full`) dengan warna pastel bertekstur tenang (bukan neon).
   - Judul Notifikasi: Maksimal 1 baris, terpotong elipsis jika panjang, `font-medium`, 13px.
   - Pesan Ringkas: Maksimal 2 baris, warna slate-500, 12px.
   - Waktu: Keterangan waktu relatif ("10 menit yang lalu", "Kemarin"), teks slate-400, 11px.
   - Status Belum Dibaca: Titik biru lembut (`w-2 h-2 rounded-full bg-[#0e59f9]`) di sisi kanan.
5. **Footer Popover:**
   - Tautan teks: "Lihat semua notifikasi →" yang mengarahkan pengguna ke halaman `/outlet/[outletKey]/notifications`.

### 6.2. Halaman Penuh (/outlet/[outletKey]/notifications)
1. **Header Halaman:**
   - Judul Halaman: "Pusat Notifikasi" (Sentence case, `font-semibold`, 22px).
   - Subjudul: "Pantau verifikasi, pembayaran langganan, kuota promo, dan aktivitas toko Anda." (Slate-500, 14px).
2. **Toolbar Filter & Kontrol:**
   - **Filter Kategori (Pill Selector):**
     - Opsi: `Semua`, `Verifikasi`, `Langganan`, `Promosi`, `Akun & Tim`.
     - Styling: Kapsul putih *raised* tanpa border, saat aktif berwarna biru primer `#0e59f9` dengan teks putih murni.
   - **Filter Waktu (Dropdown / Segmented):**
     - Opsi: `Semua Waktu`, `Hari Ini`, `7 Hari Terakhir`, `30 Hari Terakhir`.
   - **Aksi Massal:**
     - Tombol "Tandai semua dibaca".
     - Tombol "Bersihkan yang sudah dibaca".
3. **Pengelompokan Waktu (Timeline Grouping):**
   - Daftar notifikasi otomatis dikelompokkan ke dalam header: *Hari ini*, *Kemarin*, *Minggu ini*, *Lebih lama*.
4. **Kartu Notifikasi Penuh:**
   - Latar belakang putih bersih (`bg-white`), radius sudut melengkung halus (`rounded-2xl`), tanpa border (`border-none`), bayangan fisik lembut (`shadow-neu-raised-sm`).
   - Dilengkapi tombol aksi langsung (*Direct CTA Button*) seperti "Perbarui dokumen", "Bayar tagihan", atau "Buka shift".
5. **Kondisi Kosong (Empty State):**
   - Pesan ramah dan tenang: "Semua sudah teratasi."
   - Keterangan: "Tidak ada notifikasi yang memerlukan perhatian Anda saat ini."

---

## 7. Standar Tipografi & Anti-Slop (Menuin Design Rules)

Sistem antarmuka notifikasi Menuin tunduk pada aturan ketat anti-slop berikut:

1. **Dilarang Menggunakan Uppercase Sembarangan:**
   - **Salah:** `TANDAI SEMUA DIBACA`, `NOTIFIKASI HARI INI`, `PERBARUI SEKARANG`.
   - **Benar:** `Tandai semua dibaca`, `Notifikasi hari ini`, `Perbarui sekarang`.
   - *Pengecualian:* Singkatan standar industri seperti PIN, QRIS, KTP, NIB, DOKU, dan ID.
2. **Dilarang Menggunakan Letter-Tracking Lebar Artifisial:**
   - Dilarang menambahkan kelas `tracking-wider` atau `tracking-widest` pada teks deskripsi, judul kartu, atau tombol. Seluruh teks menggunakan spasi alami bawaan font Poppins (`tracking-normal`).
3. **Plafon Ketebalan Font (Font Ceiling):**
   - Bobot teks tertinggi yang diizinkan adalah `font-semibold` (600). Dilarang menggunakan `font-bold` (700) atau lebih tebal.
4. **Copywriting Bahasa Indonesia Alami & Kontekstual:**
   - Menggunakan bahasa Indonesia yang ringkas, jelas, dan ramah bisnis ritel/F&B. Hindari istilah jargon mesin yang kaku atau hiperbola pemasaran AI.

---

## 8. Persyaratan Non-Fungsional (Non-Functional Requirements)

1. **Latensi Real-Time:** Notifikasi baru yang diterbitkan server harus muncul di klien dalam waktu < 500 milidetik melalui Supabase WebSocket.
2. **Efisiensi Koneksi (Single-Channel):** Berbagi satu saluran WebSocket terpusat per tenant untuk mencegah overhead koneksi ganda pada browser kasir/manajer.
3. **Retensi Data:** Notifikasi disimpan secara permanen di database, dengan pembersihan otomatis hanya untuk notifikasi informasional yang sudah dibaca lebih dari 90 hari.
4. **Keamanan Multi-Tenant (RLS):** Notifikasi dilindungi oleh Row-Level Security (RLS) PostgreSQL untuk menjamin bahwa data notifikasi suatu tenant tidak pernah dapat diakses oleh tenant lain.
