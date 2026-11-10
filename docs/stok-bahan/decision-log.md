# Decision Log: Stok Bahan

Dokumen ini mencatat keputusan arsitektur, pemilihan nama, dan masukan pengguna selama pengembangan fitur **Stok Bahan**.

---

## Log Riwayat

### [2026-11-09] - Inisialisasi Desain & Arsitektur Fitur
1. **Pemilihan Nama Fitur:**
   * Pengguna mengusulkan antara *"Stok Bahan"* dan *"Kelola Bahan"*.
   * Diputuskan menggunakan nama **"Stok Bahan"** di sidebar navigasi karena konsisten dengan pola kata benda Menuin (*Daftar Produk*, *Kategori*, *Modifier*, *Shift Kasir*) dan langsung mengomunikasikan fungsi pengecekan sisa fisik dan mutasi bahan.
2. **Eliminasi Kartu Ringkasan (Data-First Approach):**
   * Pengguna secara spesifik menginstruksikan: *"tidak perlu ada kartu ringkasan. saya ingin untuk tampilannya mirip dengan yang ada di daftar produk karena secara konsep hampir mirip."*
   * Kartu metrik di atas dihilangkan untuk menghemat ruang vertikal dan memberikan visibilitas instan ke tabel bahan.
3. **Adaptasi Penuh Tampilan "Daftar Produk":**
   * Menggunakan satu baris universal:
     - Kiri: Underline Status Filter Tabs (`Semua`, `Stok Aman`, `Stok Menipis`, `Habis`) dengan hitungan kuantitas.
     - Kanan: Pencarian cepat, Filter Kategori Popover, View Switcher `[Tabel] [Kartu]`, dan tombol utama `+ Tambah Bahan`.
   * Mendukung Dual-View: Mode Tabel (TanStack Data Table) dan Mode Kartu (Grid Cards).
   * Aksi Cepat: Tombol `[ + ]` dan `[ - ]` langsung pada setiap baris untuk memicu modal mutasi cepat (*Quick Stock Dialog*).
4. **Standar Desain Menuin:**
   * 100% borderless (`border-none`), pure-white cards, bayangan Menuin `shadow-sm-md` dan `shadow-md`, plafon `font-semibold`, angka `tabular-nums font-numeric`, dan tombol biru `#0e59f9`.

### [2026-11-10] - Harmonisasi & Standarisasi UI Konsistensi Menuin
1. **Penetapan Riwayat Transaksi sebagai Acuan Emas (Gold Standard):**
   * Tampilan Riwayat Transaksi (`/outlet/[outletKey]/transactions`) ditetapkan sebagai standar kerapihan antarmuka tabel Menuin.
2. **Perubahan & Standardisasi pada Stok Bahan:**
   * Tab status dinetralkan: Counter badge tab non-aktif menjadi `bg-slate-100 text-slate-400`.
   * Menghilangkan kolom *Satuan* dan *Batas Min* yang terpisah menjadi format **2-Baris Vertikal** di kolom *Sisa Stok*.
   * Menambahkan kolom *Harga Beli* dengan format mata uang rupiah dan subteks satuan.
   * Kolom *Status* dipisahkan menjadi kolom tersendiri dengan standard badge soft pastel borderless (`bg-emerald-100/80`, `bg-amber-100/80`, `bg-rose-100/70`).
   * Mengganti tombol aksi cepat `+` dan `-` yang mencolok dengan icon button compact netral `h-7 w-7` serta menu 3-titik.
   * Menyesuaikan card container ke `rounded-2xl` dan header tabel `bg-slate-50/70 text-slate-500 text-xs font-semibold`.
3. **Penyelarasan pada Halaman Daftar Produk:**
   * Menyamakan underline tab aktif ke `#0e59f9`, netralisasi counter badge di tab, dan standarisasi badge status ketersediaan.
   * Pedoman lengkap dicatat pada [`docs/design/MENUIN_TABLE_UI_STANDARDS.md`](../design/MENUIN_TABLE_UI_STANDARDS.md).

### [2026-11-10] - Alokasi Tier Paket Langganan & Pembaruan Kartu Harga
1. **Alokasi Manajemen Stok ke Tier Pro:**
   * Fitur **Stok Bahan** (`INVENTORY`) dialokasikan ke Tier **Pro** (Rp 99.900/bln) dan **Promax** (Rp 149.900/bln).
   * Pada kartu paket Pro, butir *"Akses staf kasir terpisah dengan PIN keamanan"* digantikan menjadi *"Terbukanya fitur manajemen stok bahan & gudang"*.
   * Guard halaman `materials/page.tsx` diperketat menggunakan `requireFeature('INVENTORY')` yang hanya aktif pada langganan berstatus `PRO`.
2. **Ketersediaan QRIS Dinamis di Tier Basic:**
   * Fitur pembayaran QRIS dinamis langsung di kasir kini telah terbuka di Tier **Basic** (Rp 49.900/bln), tidak lagi terkunci hanya di Promax.
3. **Proporsi Visual Card Promax:**
   * Daftar fitur paket Promax diperkaya hingga 18 butir fitur menyeluruh (termasuk penegasan stok bahan, audit trail, kustomisasi katalog, KDS, dan prioritas onboarding) untuk memastikan susunan card Promax tetap menjadi kartu paling tinggi (*tallest focal card*) sesuai rancangan desain berundak landing page.

### [2026-11-10] - Penyesuaian Naming, Checklist Style, Tiering Ekspor & Batas Perangkat
1. **Penyelarasan Tampilan Checklist QRIS Dinamis di Basic:**
   * Styling `isNew: true` pada bullet QRIS dinamis di Basic dihilangkan agar warna dan bentuk ceklist sama persis dengan checklist fitur Basic lainnya (lingkaran putih dengan centang biru `#0E59F9`, bukan lingkaran biru pejal).
2. **Standardisasi Naming Fitur:**
   * Paket Basic: *"Kelola katalog produk dan kategori"* diubah menjadi **"Kelola produk dan kategori"**.
   * Paket Pro: Nama fitur stok diubah menjadi persis **"Kelola Stok Bahan dan Gudang"**.
3. **Penyederhanaan Fitur Promax:**
   * Menghapus 3 butir fitur dari paket Promax:
     - *Checklist item pesanan operasional sinkron secara realtime*
     - *Prioritas dukungan teknis & pendampingan onboarding*
     - *Hak akses multi-peran lengkap (Owner, Manajer, Kasir, Dapur)*
4. **Pemindahan Ekspor PDF & Excel ke Paket Basic:**
   * Fitur *"Ekspor laporan ke PDF & Excel"* kini tersedia mulai dari paket **Basic**, dan diwarisi oleh Pro serta Promax. Nilai pada tabel komparasi diubah menjadi `[true, true, true, true]`.
5. **Peningkatan Batas Perangkat Kasir Paket Pro:**
   * Batas perangkat kasir aktif paket Pro dinaikkan menjadi **5 perangkat kasir aktif** (`"Tambah hingga 5 perangkat kasir aktif"` dan pada tabel komparasi `"Hingga 5"`).
6. **Optimasi Proporsi Ketinggian Card Promax:**
   * Memasukkan butir operasional (manajemen tata letak meja, notifikasi otomatis ke dapur & kasir, rekapitulasi omset, penambahan menu tanpa batas) sehingga kartu Promax memiliki 20 butir fitur dan konsisten menjadi kartu paling tinggi di desktop grid.
7. **Peningkatan Ketinggian & Kelengkapan Fitur Paket Pro:**
   * Sebelumnya paket Pro hanya memiliki 9 butir fitur (sama banyaknya dengan Basic), sehingga tingginya tampak setara dengan Basic dan menyisakan celah kosong besar pada teaser card di bawahnya.
   * Daftar fitur Pro diperkaya menjadi **14 butir fitur** (termasuk *Peringatan otomatis stok bahan menipis*, *Riwayat mutasi & audit stok keluar-masuk*, *Akses cepat PIN staf kasir*, serta *Impor & ekspor massal via Excel*).
   * Teaser card di bawah Basic diperbarui teksnya menjadi *"Ingin Scan AI, Kelola Stok Bahan & Modifier?"*.
   * Hasilnya, layout grid kartu harga kini menampilkan undakan ketinggian yang sangat proporsional: **Basic (9 fitur)** ➔ **Pro (14 fitur, lebih panjang)** ➔ **Promax (20 fitur, full-height tertinggi)**.
8. **Harmonisasi Warna Avatar Inisial (Tema Spektrum Biru Menuin):**
   * Avatar inisial bahan baku di Stok Bahan (`material-list.tsx`) dan pelanggan di Riwayat Transaksi (`transaction-history.tsx`) menggunakan variasi **Spektrum Biru Menuin** yang memadukan warna biru pejal bertulisan putih (`bg-[#0e59f9] text-white`, `bg-blue-700 text-white`, `bg-blue-500 text-white`, `bg-sky-600 text-white`, `bg-indigo-600 text-white`) dan variasi biru pastel lembut (`bg-blue-100 text-[#0e59f9]`, `bg-sky-100 text-sky-800`, `bg-blue-50 text-blue-700`).
   * Avatar inisial juga disematkan pada Card View Stok Bahan agar identitas visual bahan seragam di semua mode tampilan.
   * Perubahan ini memastikan tampilan inisial lebih berbobot, kontras tinggi, bervariasi dinamis, dan tetap dalam range warna biru Menuin yang padu.
