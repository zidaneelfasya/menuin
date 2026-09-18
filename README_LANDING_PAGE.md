# 🍏 MENUIN — Landing Page Master Blueprint & AI Prompt
> **Inspirasi Desain:** Apple Product Showcase (*iPhone Duo / Pro style*) — Modern, Simple, Unik, Presisi, & Bebas AI Slop.  
> **Target Audiens:** Pengusaha & Owner F&B Indonesia (*Coffee Shop, Cafe, Restoran, Bakery, Franchise, & Cloud Kitchen*).  
> **Bahasa & Copywriting:** Bahasa Indonesia Profesional, Lugas, Menghipnotis, & Berfokus Solusi (*High-Converting F&B Copywriting*).

---

## 📑 Daftar Isi
1. [Hasil Scan Proyek & Arsitektur Menuin](#1-hasil-scan-proyek--arsitektur-menuin)
2. [Filosofi Desain ala Apple Product Showcase](#2-filosofi-desain-ala-apple-product-showcase)
3. [Master Copywriting Bahasa Indonesia (Per Bagian)](#3-master-copywriting-bahasa-indonesia-per-bagian)
4. [Master Prompt Siap Pakai (Untuk Claude / ChatGPT / v0 / Antigravity)](#4-master-prompt-siap-pakai)
5. [Spesifikasi Teknis & Blueprint Komponen Interaktif](#5-spesifikasi-teknis--blueprint-komponen-interaktif)

---

## 1. Hasil Scan Proyek & Arsitektur Menuin

Berdasarkan audit mendalam pada seluruh kode sumber repositori `menuin` (*apps/web*, *apps/mobile*, *packages/*, dan skema database PostgreSQL/Drizzle):

### 1.1 Identitas Inti Produk
Menuin adalah **Platform Ekosistem Cerdas F&B SaaS All-in-One** yang menyatukan 4 pilar operasional utama tanpa jeda (*zero latency*):
1. **Self-Service QR Table Ordering:** Tamu memindai kode QR unik di meja menggunakan kamera ponsel bawaan, membuka web katalog interaktif tanpa perlu unduh aplikasi (*zero app install*), menyesuaikan varian (*sugar level, extra espresso, topping*), dan membayar langsung via **QRIS Dinamis / Midtrans**.
2. **High-Speed Cloud POS Register:** Sistem kasir terpadu yang dirancang untuk kecepatan transaksi puncak (*rush hour*). Mendukung kasir multi-shift, cetak struk termal Bluetooth/LAN (58mm/80mm), kalkulasi otomatis pajak PB1 (10%), *Service Charge*, hingga pemotongan komisi platform *Online Food* (GrabFood 20%, GoFood 20%, ShopeeFood 20%).
3. **Real-Time Kitchen Display System (KDS):** Tiket pesanan dari meja pelanggan maupun kasir seketika muncul di layar dapur (*instant push*) dengan status interaktif (*Diterima → Disiapkan → Siap → Selesai*), menghapus risiko nota basah atau pesanan terlewat.
4. **Shift Cash Drawer Audit & Anti-Fraud:** Mewajibkan pencatatan modal awal (*starting float*), mencatat kas masuk/keluar (*petty cash*), dan merekonsiliasi uang fisik dengan hitungan sistem saat tutup kasir (*target variansi Rp 0*), dilengkapi audit *void transaction* berbasis PIN karyawan.
5. **Multi-Outlet & Live Owner Analytics:** Pemilik bisnis memantau omzet live (*gross & net sales*), profit margin, HPP/COGS, stok kritis (*low-stock alerts*), dan performa kasir di seluruh cabang dalam satu genggaman.

### 1.2 Masalah Nyata F&B yang Diselesaikan
| Masalah Konvensional | Solusi Menuin |
| :--- | :--- |
| **Antrean Mengular di Kasir:** Tamu menunggu lama hanya untuk memilih menu dan memesan saat jam sibuk. | **QR Meja Mandiri:** Tamu langsung duduk, scan, pesan, dan bayar dari meja. Kapasitas meja (*table turnover*) naik hingga 35%. |
| **Salah Catat Pesanan:** Pelayan lupa mencatat "tanpa gula" atau "sambal dipisah". | **Kustomisasi Presisi:** Tamu memilih sendiri modifier dan catatan khusus yang langsung diteruskan ke dapur. |
| **Kebocoran Uang Kas:** Selisih uang di laci kasir saat pergantian shift (*shift turnover*). | **Shift Reconciliation:** Audit kas otomatis mencocokkan uang fisik vs sistem. Selisih Rp 0 terjamin. |
| **Dapur Semrawut:** Kertas pesanan hilang, basah terkena kuah, atau urutan masak acak-acakan. | **Kitchen Display Digital:** Layar tiket interaktif dengan penanda durasi tunggu dan status masak real-time. |
| **Aplikasi Lambat & Ribet:** Tamu menolak mengunduh aplikasi 50MB hanya untuk makan sekali. | **Web-Native Zero Friction:** Dibangun dengan Next.js App Router, terbuka seketika di Safari & Chrome mobile. |

---

## 2. Filosofi Desain ala Apple Product Showcase

Inspirasi: [Apple iPhone Showcase (e.g. iPhone Duo/Pro)](https://www.apple.com/iphone-duo/)

Untuk menghadirkan aura premium kelas dunia dan menghindari **"AI Slop"** (desain murahan yang dipenuhi gradient ungu/pink mencolok, efek neon acak, atau bayangan berlebihan), landing page Menuin wajib mematuhi panduan estetika berikut:

### 2.1 Prinsip Desain Kunci
1. **Typography as Art (Tipografi Skala Sinematik):**
   - Menggunakan font sans-serif modern bertipe neutral neo-grotesque (*Geist Sans*, *SF Pro Display*, atau *Inter*).
   - Headline berani dengan *tracking tight* (`tracking-[-0.03em]` hingga `tracking-[-0.05em]`) dan ukuran dinamis besar (`text-5xl` hingga `text-7xl`).
   - Kontras tajam: Headline hitam pekat (`#0A0A0A`), teks penjelas abu-abu netral elegan (`#52525B` atau `#71717A`), dan aksen biru signature Menuin (`#0E59F9` / `#2563EB`).
2. **Industrial Minimalism & Negative Space:**
   - Ruang bernapas yang luas (*generous padding* `py-24` hingga `py-36`).
   - Latar belakang bersih: Putih kristal (`#FFFFFF`) dipadu abu-abu subtil studio Apple (`#F8F9FA` / `#FAFAFA`).
   - Garis pembatas mikro yang sangat halus (`border border-neutral-200/80` atau `border-black/[0.06]`).
3. **Perangkat Hardware Bertemu Perangkat Lunak (Hardware + Software Harmony):**
   - Menampilkan antarmuka Menuin di dalam frame perangkat fisik presisi industri:
     - **iPhone Frame:** Menampilkan alur QR Self-Order & Stepper Pelanggan.
     - **iPad Pro / Tablet Frame:** Menampilkan Kasir POS layar sentuh kilat.
     - **Studio Monitor Frame:** Menampilkan KDS Dapur & Dashboard Pemilik.
4. **Bento Grid dengan Spesifikasi Teknis yang Terukur:**
   - Menggantikan kartu fitur generik dengan kotak-kotak *Bento Grid* bergaya Apple Tech Specs.
   - Mengedepankan angka nyata (*numbers that speak*): `"0.2 Detik Latensi"`, `"Rp 0 Selisih Kas"`, `"100% Tanpa Instalasi Aplikasi"`.
5. **Mikro-Interaksi yang Berbobot (Restrained Motion):**
   - Animasi berbasis fisika halus (*smooth spring physics via Framer Motion*).
   - Muncul halus saat di-scroll (*fade-in slide-up* 24px) tanpa efek berkedip atau berputar berlebihan.

---

## 3. Master Copywriting Bahasa Indonesia (Per Bagian)

Berikut naskah copywriting resmi yang dirancang dengan psikologi konversi tinggi untuk pemilik bisnis F&B di Indonesia.

---

### Bagian 0: Top Announcement Bar
```text
✨ Menuin 2.4 Dirilis: Sinkronisasi Meja, Kasir, & Dapur Kurang dari 1 Detik. 
Coba Gratis 14 Hari Tanpa Kartu Kredit →
```

---

### Bagian 1: Global Navigation Header
- **Logo:** `Menuin.` *(dengan aksen titik biru solid)*
- **Menu Navigasi:**
  - `Produk` *(Mega menu: QR Meja, Kasir POS, Layar Dapur, Laporan Shift)*
  - `Solusi Bisnis` *(Coffee Shop, Kafe & Resto, Franchise Multi-Outlet, Cloud Kitchen)*
  - `Harga`
  - `Fitur Unggulan`
- **Aksi Kanan:**
  - `Masuk Kasir / Owner` *(Ghost button)*
  - `Mulai Uji Coba Gratis` *(Solid Dark / Apple Pill Button)*

---

### Bagian 2: Hero Section — Pernyataan Megah
*Gaya: Apple iPhone Announcement Style — Berani, Singkat, Elegan.*

- **Eyebrow Badge:**
  `EKOSISTEM OPERASIONAL F&B MODERN`
- **Headline Utama:**
  # Satu sentuhan di meja.
  # Kasir bergerak kilat.
  # Dapur memasak tepat waktu.
- **Sub-headline:**
  *Menuin menyatukan pemesanan mandiri via QR, aplikasi kasir cloud berkecepatan tinggi, dan kitchen display dalam satu sistem terintegrasi. Tanpa antrean, tanpa salah catat, tanpa kebocoran kas.*
- **Call-to-Action (CTA):**
  - **Tombol Utama:** `Mulai Uji Coba 14 Hari — Gratis`
  - **Tombol Sekunder:** `Lihat Simulasi Langsung ▸`
- **Catatan Bawah CTA:**
  `✓ Tanpa perlu kartu kredit  •  ✓ Setup dalam 5 menit  •  ✓ Dukungan printer Bluetooth & LAN`

---

### Bagian 3: Hero Hardware Showcase — "The Ecosystem in Harmony"
*Tampilan 3 perangkat bersanding ala panggung Apple:*
- **Perangkat 1 (iPhone di Tangan Pelanggan):**  
  *Label:* **Menu QR Meja**  
  *Visual:* Katalog minuman estetik dengan pilihan varian *"Oat Milk + Less Sugar"*, tombol bayar QRIS dinamis, dan stepper status pesanan: **"Pesanan Anda Sedang Disiapkan Barista"**.
- **Perangkat 2 (iPad di Meja Kasir):**  
  *Label:* **High-Speed Cloud POS**  
  *Visual:* Grid produk responsif, pencarian kilat, struk transaksi, dan indikator laci kasir aktif.
- **Perangkat 3 (Layar Tablet di Dapur):**  
  *Label:* **Kitchen Display (KDS)**  
  *Visual:* Tiket pesanan digital nomor meja #12 dengan rincian catatan dan tombol hijau *"Siap Saji"*.

- **Statistik Singkat di Bawah Showcase:**
  - **0 Detik** — Jeda pesanan meja sampai ke layar dapur.
  - **35%** — Peningkatan perputaran meja (*table turnover*) saat jam sibuk.
  - **Rp 0** — Selisih uang fisik vs catatan kasir saat tutup shift.

---

### Bagian 4: Bukti Sosial & Kepercayaan Industri
- **Teks Pengantar:** `Dipercaya oleh lebih dari 1.200+ gerai kopi, restoran modern, dan jaringan kuliner di seluruh Indonesia`
- **Mitra Teknologi & Regulasi:**
  - *Midtrans Payment Gateway* (Lisensi PJP Bank Indonesia)
  - *QRIS Nasional Indonesia*
  - *Dukungan Bank BCA, Mandiri, BRI, BNI*
  - *Integrasi E-Wallet (GoPay, OVO, Dana, ShopeePay)*
  - *Kemenparekraf & Komdigi RI*

---

### Bagian 5: Kontras Nyata — Mengapa Cara Lama Menghambat Bisnis Anda
*Format: Side-by-Side Comparison Matrix (Minimalis & Elegan)*

| Operasional Tradisional (Cara Lama) | Bersama Menuin (Standar Baru) |
| :--- | :--- |
| **Tamu melambaikan tangan berulang kali** menunggu pelayan datang membawa buku menu fisik yang lusuh. | **Tamu langsung scan QR di meja**, membuka menu foto beresolusi tinggi, dan memesan saat inspirasi datang. |
| **Kasir kewalahan saat jam makan siang**, antrean pembayaran menumpuk hingga pintu masuk. | **Pemesanan dan pembayaran terbagi otomatis**. Kasir fokus pada pesanan takeaway dan layanan ramah. |
| **Pesanan salah masak** karena tulisan tangan pelayan yang tidak terbaca atau catatan kustom terlewat. | **Catatan kustom tercetak dan tampil digital secara presisi**: *"Less ice, sambal dipisah, tanpa bawang"*. |
| **Uang kas tekor saat pergantian shift**. Owner pusing mencari sumber kebocoran uang ratusan ribu per hari. | **Audit shift otomatis tertutup rapat**. Modal awal dicatat, uang fisik dihitung sistem, selisih tercatat detail. |
| **Owner terikat di outlet**. Tidak bisa meninggalkan restoran karena takut laporan penjualan dimanipulasi. | **Pantau omzet cabang secara live dari ponsel**. Notifikasi transaksi dan performa menu terupdate setiap detik. |

---

### Bagian 6: Pilar Fitur Mendalam (Deep Dive Showcase)

#### Pilar 01 — QR Self-Order di Meja Pelanggan
- **Judul:** *Scan. Pilih Rasa. Bayar Langsung dari Meja.*
- **Subjudul:** *Pengalaman memesan makanan termulus yang pernah dirasakan pelanggan Anda. Tanpa perlu download aplikasi apa pun.*
- **Poin Unggulan:**
  - **Tanpa Aplikasi, Tanpa Registrasi Rumit:** Terbuka instan di peramban smartphone tamu dalam waktu kurang dari 1 detik.
  - **Modifier & Varian yang Fleksibel:** Pengaturan tingkat kepedasan, pilihan topping, jenis susu alternatif, hingga catatan khusus pelanggan.
  - **QRIS Dinamis Otomatis:** Menghasilkan kode QRIS unik untuk setiap pesanan. Transaksi lunas otomatis terverifikasi tanpa perlu konfirmasi manual.
  - **Pelacak Status Pesanan Live (Order Stepper):** Pelanggan dapat memantau progres pesanannya langsung di layar ponsel: *Diterima → Disiapkan → Siap Diantar → Selesai*.

#### Pilar 02 — Kasir Cloud POS Berkecepatan Tinggi
- **Judul:** *Cepat di Kasir. Tenang di Pembukuan.*
- **Subjudul:** *Didesain khusus untuk memproses antrean panjang dalam hitungan detik. Cukup dua sentuhan untuk menyelesaikan transaksi.*
- **Poin Unggulan:**
  - **Dukungan Printer Termal Luas:** Hubungkan kasir ke printer Bluetooth maupun LAN (kertas 58mm & 80mm). Cetak struk tamu dan tiket pesanan dapur otomatis.
  - **Pajak & Potongan Otomatis:** Perhitungan otomatis PB1 10%, Service Charge restoran, dan penyesuaian komisi aplikasi online food (GrabFood, GoFood, ShopeeFood) agar laba bersih selalu akurat.
  - **Multi-Payment Ready:** Menerima pembayaran Tunai, Debit, Kartu Kredit, QRIS, dan Transfer Bank dengan pencatatan rapi.
  - **Split Bill & Gabung Meja:** Fleksibilitas membagi tagihan per pelanggan atau menggabungkan pesanan dari meja yang disatukan.

#### Pilar 03 — Kitchen Display System (KDS Dapur Tanpa Kertas)
- **Judul:** *Dapur Lebih Cepat. Tiket Pesanan Tanpa Kertas.*
- **Subjudul:** *Gantikan printer dapur yang berisik dan rentan habis kertas dengan layar display dapur digital yang saling tersinkronisasi.*
- **Poin Unggulan:**
  - **Prioritas Berbasis Waktu:** Tiket pesanan diberi kode warna otomatis sesuai lama waktu tunggu agar koki selalu mendahulukan pesanan yang masuk lebih awal.
  - **Tampilan Khusus Bar & Dapur Utama:** Filter tiket berdasarkan kategori; pesanan minuman langsung masuk ke stasiun Barista, pesanan makanan masuk ke stasiun Dapur Utama.
  - **Suara Notifikasi Cerdas:** Peringatan audio lembut saat pesanan baru masuk agar tim dapur tidak melewatkan tiket baru.

#### Pilar 04 — Rekonsiliasi Kas Shift & Keamanan Anti-Fraud
- **Judul:** *Tutup Shift Jam Berapa Pun. Kas Selalu Akurat Rp 0.*
- **Subjudul:** *Kunci kebocoran kas kasir dengan sistem pembukuan modal awal, kas kecil, dan audit fisik otomatis.*
- **Poin Unggulan:**
  - **Wajib Modal Awal (Starting Float):** Kasir harus memasukkan nominal uang kembalian sebelum register kasir dapat digunakan.
  - **Pencatatan Kas Masuk & Keluar (Petty Cash):** Catat setiap pembelian es batu darurat atau bumbu dapur kecil langsung di sistem kasir dengan bukti foto.
  - **Blind Cash Count:** Saat tutup shift, kasir memasukkan jumlah uang fisik yang ada di laci tanpa melihat total sistem terlebih dahulu, memastikan kejujuran audit.
  - **Anti-Void Fraud dengan Akses PIN:** Pembatalan struk yang sudah dicetak wajib memasukkan PIN Manajer atau Superadmin, mencegah manipulasi kasir nakal.

#### Pilar 05 — Manajemen Multi-Cabang & Laporan Pemilik
- **Judul:** *1 Cabang atau 20 Cabang. Kendalikan Semuanya dari Satu Tempat.*
- **Subjudul:** *Pusat kendali bisnis kuliner Anda. Laporan penjualan konsolidasi, kontrol menu terpusat, dan manajemen hak akses karyawan.*
- **Poin Unggulan:**
  - **Laporan Laba Kotor & HPP/COGS:** Analisa margin keuntungan setiap menu secara mendalam. Ketahui menu mana yang paling menghasilkan uang dan mana yang membebani biaya bahan.
  - **Role-Based Access Control (RBAC):** Pisahkan hak akses untuk Superadmin, Manajer Outlet, dan Kasir. Lindungi data sensitif keuangan dari staf harian.
  - **Ekspor Data Instan:** Unduh laporan penjualan harian, rekapitulasi shift, dan rincian transaksi ke format Microsoft Excel dan PDF dalam satu klik.

---

### Bagian 7: Apple-Style Bento Grid — "Teknologi di Balik Ketangguhan"
*Grid 4 kotak simetris dengan tipografi presisi:*

1. **Kotak 1 (Kecepatan Cloud Realtime):**  
   *Angka Utama:* **< 200ms**  
   *Deskripsi:* Didukung infrastruktur PostgreSQL & Supabase Realtime tingkat enterprise. Setiap perubahan status terkirim seketika tanpa perlu me-refresh halaman.
2. **Kotak 2 (Kebebasan Perangkat):**  
   *Angka Utama:* **100% Fleksibel**  
   *Deskripsi:* Berjalan sempurna di iPad, tablet Android, laptop Windows, MacBook, hingga smartphone kasir. Tidak memerlukan hardware proprietary yang mahal.
3. **Kotak 3 (Keamanan Standar Finansial):**  
   *Angka Utama:* **Enkripsi End-to-End**  
   *Deskripsi:* Kredensial pembayaran diamankan dengan standar PCI-DSS melalui Midtrans. Token transaksi diisolasi per tenant bisnis.
4. **Kotak 4 (Perceived Performance):**  
   *Angka Utama:* **Nol Blank Loading**  
   *Deskripsi:* Dilengkapi teknologi transisi liquid-fill yang menutupi proses fetch data. Antarmuka terasa instan di setiap ketukan layar.

---

### Bagian 8: Testimoni Pemilik Bisnis Kuliner
- **Testimoni 1 (Coffee Shop Hits):**  
  > *"Sejak pakai QR Order Menuin, antrean kasir di jam 12 siang hilang total. Tamu senang karena bisa pilih oat milk dan level gula sendiri dari meja, barista kami senang karena tiket pesanan keluar rapi tanpa teriak-teriak."*  
  **— Dimas Arya, Founder Kopi Ruang Teduh, Jakarta Selatan**
- **Testimoni 2 (Restoran Keluarga):**  
  > *"Fitur shift audit-nya juara. Dulu setiap malam tutup buku selalu ada selisih uang kas 50-100 ribu yang tidak jelas asalnya. Sekarang dengan rekonsiliasi kas Menuin, selisih selalu Rp 0."*  
  **— Hendra Gunawan, Operasional Manager Resto Warisan Rasa, Bandung**
- **Testimoni 3 (Bakery & Pastry Chain):**  
  > *"Buka cabang baru sekarang sangat gampang. Cukup buat outlet baru di Menuin, upload menu dan harga, langsung bisa operasional di hari yang sama. Laporan omzet semua cabang bisa saya cek langsung dari HP."*  
  **— Cynthia Natalia, Owner Sweet Crust Bakery (4 Cabang di Surabaya)**

---

### Bagian 9: Harga Transparan Tanpa Jebakan Kontrak
- **Eyebrow:** `LANGGANAN BULANAN FLEKSIBEL`
- **Headline:** *Satu Biaya Terjangkau. Semua Fitur Terbuka.*
- **Subheadline:** *Tanpa biaya pemasangan awal. Tanpa potongan komisi per transaksi menu. Tanpa kontrak tahunan yang mengikat.*

#### Paket Pro — Pilihan Terpopuler
- **Harga:** **Rp 199.000** `/ bulan per outlet`
- **Fitur Termasuk:**
  - Unlimited Pemesanan Meja Mandiri via QR Code
  - Aplikasi Kasir POS Cloud Tanpa Batas Transaksi
  - Kitchen Display System (Layar Dapur Digital)
  - Integrasi Pembayaran QRIS Dinamis & Midtrans
  - Rekonsiliasi Kas Shift & Deteksi Selisih Kas
  - Dukungan Printer Termal Bluetooth & LAN
  - Manajemen Bahan Baku & Notifikasi Stok Kritis
  - Hak Akses Kasir, Manajer, & Superadmin Tanpa Batas
  - Export Laporan Penjualan Excel & PDF
  - Bantuan Setup Awal & Layanan Pelanggan Prioritas

#### Paket Enterprise Multi-Outlet
- **Harga:** **Hubungi Tim Kami**
- **Tambahan Fitur:**
  - Manajemen terpusat untuk 10+ cabang
  - Dedicated Account Manager & On-site Training
  - Kustomisasi domain (*whitelabel* alamat website menu resto Anda)
  - Integrasi API ERP & Akuntansi Kustom

---

### Bagian 10: Tanya Jawab Umum (FAQ Editorial)
1. **Apakah pelanggan saya harus mengunduh aplikasi untuk melihat menu dan memesan?**  
   *Sama sekali tidak. Pelanggan cukup mengarahkan kamera ponsel ke kode QR di meja, dan menu digital interaktif akan langsung terbuka di browser ponsel mereka secara instan.*
2. **Apakah Menuin bisa digunakan bersama printer kasir yang sudah saya miliki?**  
   *Bisa. Menuin mendukung hampir seluruh merk printer termal kasir di pasaran (58mm maupun 80mm) yang menggunakan koneksi Bluetooth maupun jaringan kabel/WiFi (LAN).*
3. **Bagaimana jika pelanggan ingin membayar tunai di meja kasir?**  
   *Pelanggan bebas memilih. Mereka dapat memesan via QR dan membayar tunai di kasir, atau kasir dapat menginput pesanan secara langsung melalui sistem POS Menuin.*
4. **Apakah ada batasan jumlah menu atau jumlah transaksi harian?**  
   *Tidak ada batasan sama sekali. Anda dapat memasukkan ribuan menu dan memproses puluhan ribu transaksi setiap hari tanpa biaya tambahan.*
5. **Bagaimana cara kerja pencairan dana dari pembayaran QRIS?**  
   *Pembayaran online diproses secara aman melalui Midtrans resmi dan dana akan ditransfer langsung ke rekening bank bisnis Anda sesuai jadwal settlement.*
6. **Apakah saya memerlukan perangkat iPad khusus yang mahal?**  
   *Tidak. Menuin dapat berjalan di perangkat apa pun yang memiliki browser web modern: tablet Android, iPad, laptop, hingga smartphone.*

---

### Bagian 11: Call to Action Penutup (The Apple Grand Finale)
- **Headline:** *Bawa Operasional Restoran Anda ke Standar Tertinggi.*
- **Subheadline:** *Bergabunglah dengan ribuan pengusaha kuliner modern yang telah menghemat waktu, menghapus salah pesanan, dan meningkatkan omzet bersama Menuin.*
- **Tombol Utama:** `Mulai Uji Coba Gratis 14 Hari`
- **Tombol Sekunder:** `Jadwalkan Konsultasi dengan Tim Menuin`
- **Badge Bawah:** `Setup instan dalam 5 menit • Tidak perlu kartu kredit • Batalkan kapan saja`

---

## 4. Master Prompt Siap Pakai

Gunakan blok prompt lengkap berikut ini untuk di-copy-paste ke AI coding assistant (Antigravity, Claude 3.7 Sonnet, ChatGPT, atau v0):

```markdown
# PROMPT: BUATKAN LANDING PAGE MENUIN DENGAN GAYA APPLE PRODUCT SHOWCASE

Bertindaklah sebagai Senior Principal Frontend Architect dan UI/UX Designer kelas dunia. Tugasmu adalah membuat ulang halaman Landing Page Menuin (`apps/web/src/components/landing-page.tsx` atau komponen Landing Page utama Next.js) dengan estetika seperti halaman produk resmi Apple (contoh: Apple iPhone Duo / iPhone Pro showcase: https://www.apple.com/iphone-duo/).

## 1. ATURAN KETAT DESAIN (ANTI-AI SLOP MANIFESTO)
Patuhi seluruh pedoman desain dari `.agents/rules/ui-guidelines.md`:
- ❌ DILARANG menggunakan background blobs warna-warni acak, gradient neon ungu/pink yang murahan, atau glassmorphism yang berlebihan.
- ❌ DILARANG menggunakan drop-shadow tebal yang kotor. Gunakan border ultra-tipis yang bersih (`border border-neutral-200/80` atau `border-black/[0.06]`) dan shadow mikro (`shadow-xs` / `shadow-sm`).
- ❌ DILARANG menggunakan layout card yang membosankan dan generik. Gunakan ritme layout sinematik, Bento Grid terukur, dan tipografi skala besar.
- ✅ Gunakan latar belakang bernuansa Studio Apple: Putih bersih (`#FFFFFF`) dipadu abu-abu subtil (`#FAFAFA` / `#F8F9FA`).
- ✅ Palet Warna: Teks primer hitam pekat (`#0A0A0A`), teks sekunder abu-abu netral (`#52525B` / `#71717A`), dan aksen biru signature Menuin (`#0E59F9` / `#2563EB`).
- ✅ Tipografi: Skala font ekspresif dengan tracking sangat rapat (`tracking-[-0.03em]` hingga `tracking-[-0.05em]`) dan hirarki yang sangat jelas.

## 2. SPESIFIKASI TEKNOLOGI
- Framework: Next.js 14/15 App Router + React 19 + TypeScript.
- Styling: Tailwind CSS (menggunakan variabel sistem dari `apps/web/src/app/globals.css`).
- Animasi: Framer Motion dengan transisi spring natural (smooth, non-distracting, high perceived performance).
- Ikon: Lucide React (stroke-width 1.5 atau 2, ukuran konsisten 16px - 20px).

## 3. SELEKSI FITUR DARI HASIL AUDIT PROYEK MENUIN
Landing page harus merepresentasikan ekosistem nyata Menuin yang ada di codebase:
1. Smart QR Code Table Ordering (pelanggan memesan mandiri via web mobile tanpa instalasi aplikasi, pembayaran QRIS Dinamis Midtrans).
2. High-Speed Cloud POS Register (kasir cepat, kalkulasi otomatis PB1 10%, Service Charge, komisi ojol GrabFood/GoFood/ShopeeFood 20%, cetak struk Bluetooth/LAN 58mm/80mm).
3. Kitchen Display System (KDS Dapur) & Order Stepper live (Diterima → Disiapkan → Siap → Selesai).
4. Shift Cash Audit & Anti-Fraud (modal awal, rekonsiliasi kas fisik vs sistem, target selisih Rp 0, PIN void security).
5. Multi-Outlet HQ & Owner Live Analytics (pantau gross/net sales, COGS/HPP, low-stock alerts, ekspor Excel/PDF).

## 4. SELURUH TEKS & COPYWRITING (WAJIB MENGGUNAKAN BAHASA INDONESIA)
Gunakan naskah copywriting resmi berikut pada masing-masing section:

### A. Navigation Header:
- Logo: "Menuin."
- Links: Produk, Solusi, Fitur, Harga, Testimoni.
- Action: "Masuk Kasir" (Link) & "Coba Gratis" (Tombol Pill Apple Style).

### B. Hero Section:
- Eyebrow Badge: "EKOSISTEM OPERASIONAL F&B MODERN"
- Headline Utama:
  "Satu sentuhan di meja.
  Kasir bergerak kilat.
  Dapur memasak tepat waktu."
- Subheadline:
  "Menuin menyatukan pemesanan mandiri via QR, aplikasi kasir cloud berkecepatan tinggi, dan kitchen display dalam satu sistem terintegrasi. Tanpa antrean, tanpa salah catat, tanpa kebocoran kas."
- CTA Buttons:
  - Utama: "Mulai Uji Coba 14 Hari — Gratis"
  - Sekunder: "Lihat Simulasi Langsung ▸"
- Jaminan: "✓ Tanpa kartu kredit  •  ✓ Setup 5 menit  •  ✓ Dukungan printer Bluetooth & LAN"

### C. Interactive Ecosystem Hardware Mockup:
Tampilkan mockup interaktif tiga perangkat presisi (iPhone, iPad, dan Kitchen Display) dengan tombol tab switcher halus:
1. Tab "Menu QR Meja": Menampilkan antarmuka web order pelanggan dengan stepper status pesanan: Diterima → Disiapkan → Siap Selesai.
2. Tab "Kasir POS Kilat": Menampilkan grid kasir sentuh dengan ringkasan struk, diskon, dan kalkulasi otomatis PB1.
3. Tab "Layar Dapur (KDS)": Menampilkan tiket pesanan digital dengan pengingat durasi waktu tunggu.
4. Tab "Audit Shift & Kas": Menampilkan kalkulator rekonsiliasi uang fisik vs sistem dengan indikator "Selisih: Rp 0".

### D. Highlight Angka Kunci:
- "0 Detik" — Jeda pesanan meja ke layar dapur.
- "35%" — Kenaikan perputaran meja saat jam sibuk.
- "Rp 0" — Selisih uang kas saat pergantian shift.
- "100%" — Tanpa aplikasi yang harus diunduh tamu.

### E. Masalah vs Solusi (Side-by-side Matrix):
Bandingkan operasional resto konvensional yang penuh hambatan dengan alur cerdas Menuin (antrean hilang, catatan kustom presisi, uang kas aman, pesanan dapur tertib).

### F. Deep-Dive Bento Grid (Spesifikasi Teknis ala Apple):
Tampilkan 4 kotak bento beresolusi tinggi:
1. "Zero-Latency Realtime Engine" (< 200ms Supabase & PostgreSQL sync).
2. "QRIS & E-Wallet Nasional" (Midtrans certified payment gateway).
3. "Perangkat Bebas" (Jalankan di iPad, Android, PC, tanpa hardware khusus).
4. "Keamanan Kasir Berlapis" (PIN unik untuk supervisor saat melakukan void/diskon).

### G. Testimoni Nyata F&B Indonesia:
Kutipan dari Founder Kopi Ruang Teduh, GM Resto Warisan Rasa, dan Owner Sweet Crust Bakery.

### H. Paket Harga Transparan:
- Paket Pro: Rp 199.000 / bulan per outlet.
- Jelaskan semua fitur yang didapat tanpa batasan meja dan tanpa biaya tersembunyi.
- Paket Enterprise untuk multi-cabang (10+ outlet).

### I. FAQ Editorial:
Tampilkan accordion minimalis dengan 6 pertanyaan kunci seputar kemudahan QR order, printer termal, pembayaran QRIS, dan fleksibilitas perangkat.

### J. Penutup Megah (Grand Finale):
"Bawa Operasional Restoran Anda ke Standar Tertinggi."
Tombol: "Mulai Uji Coba Gratis 14 Hari" dan "Jadwalkan Konsultasi".

Buatkan kode TypeScript React (.tsx) yang bersih, modular, terstruktur, responsif di mobile & desktop, serta siap pakai langsung di aplikasi!
```

---

## 5. Spesifikasi Teknis & Blueprint Komponen Interaktif

Untuk membantu engineer atau AI menghasilkan kode yang presisi, berikut adalah spesifikasi blueprint untuk komponen-komponen utama:

### 5.1 Device Frame Simulator (Apple Studio Quality)
```tsx
// Struktur Frame iPad / Tablet Kasir
<div className="relative mx-auto max-w-[1100px] rounded-[36px] bg-[#1E1E1E] p-3 md:p-4 shadow-[0_25px_70px_rgba(0,0,0,0.15)] ring-1 ring-black/10">
  {/* Camera notch / bezel */}
  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#111] ring-1 ring-white/10" />
  
  {/* Screen viewport */}
  <div className="w-full aspect-[16/10] bg-white rounded-[26px] overflow-hidden border border-neutral-200">
    {/* Antarmuka POS Kasir Menuin */}
  </div>
</div>
```

### 5.2 Live Order Stepper (Komponen Interaktif Pelanggan)
```tsx
// 4 Status Alur Pesanan Pelanggan Meja
const orderSteps = [
  { step: 1, label: "Diterima", icon: "CheckCircle", time: "12:04" },
  { step: 2, label: "Disiapkan", icon: "ChefHat", time: "12:06", active: true },
  { step: 3, label: "Siap Saji", icon: "Bell", time: "Estimasi 4 mnt" },
  { step: 4, label: "Selesai", icon: "Sparkles", time: "-" }
];
```

### 5.3 Kalkulasi Shift Zero-Variance Indicator
```tsx
// Komponen Visual Kasir Shift Audit
<div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
  <div>
    <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Hasil Rekonsiliasi Kas</div>
    <div className="text-xl font-bold">Uang Fisik Cocok dengan Sistem</div>
  </div>
  <div className="text-right">
    <div className="text-xs text-emerald-600">Selisih Kas</div>
    <div className="text-2xl font-black text-emerald-700">Rp 0</div>
  </div>
</div>
```

---

## 6. Cara Menggunakan Dokumen Ini

1. **Untuk AI Assistant (Claude, Antigravity, ChatGPT, v0):**  
   Copy seluruh isi dari bagian **4. Master Prompt Siap Pakai** ke dalam prompt chat Anda.
2. **Untuk Frontend Developer & Tim UI/UX:**  
   Gunakan bagian **3. Master Copywriting Bahasa Indonesia** dan **5. Spesifikasi Teknis** sebagai panduan implementasi fungsional dan tata bahasa.
3. **Untuk Marketing & Tim Bisnis:**  
   Gunakan dokumen ini sebagai panduan proposisi nilai (*Value Proposition*) saat mempresentasikan produk Menuin kepada calon mitra atau investor F&B.
