# MENUIN — Panduan Operasional & SOP Tim Verifikasi Kepatuhan (Compliance Runbook)

Dokumen ini adalah Standar Operasional Prosedur (SOP) resmi bagi Reviewer Kepatuhan, Verification Admin, Superadmin, dan Tim MENUIN Care dalam memproses verifikasi bisnis merchant, kepatuhan outlet, serta integrasi gateway pembayaran DOKU.

---

## 1. Prinsip Dasar & Arsitektur 1:N:M

1. **Struktur Relasi 1:N:M:**
   - Satu akun MENUIN dapat memiliki satu atau lebih Profil Badan Usaha (Tier 1).
   - Satu Profil Badan Usaha dapat terhubung ke beberapa cabang Outlet (Tier 2).
   - Dokumen legalitas (KTP Direktur, NPWP Badan Usaha, NIB, Akta Pendirian, Rekening Pencairan) diverifikasi **satu kali** di tingkat Profil Bisnis dan dapat digunakan kembali untuk cabang outlet di bawah badan usaha yang sama.
2. **Kepatuhan Outlet Independen (Tier 2):**
   - Setiap outlet cabang **wajib** memverifikasi alamat fisik, titik koordinat, dan foto tampak depan storefront (plang nama) masing-masing.
   - Persetujuan Tier 1 **tidak otomatis** meloloskan seluruh cabang outlet.
3. **Decoupled 4-State Engine:**
   - Kesiapan pembayaran online (`evaluatePaymentReadiness`) berstatus `READY` hanya jika:
     1. `business_profiles.verification_status` = `verified`
     2. `tenants.outlet_compliance_status` = `verified`
     3. `tenants.doku_sub_account_status` = `ACTIVE`
     4. `tenants.online_payment_enabled` = `true`
     5. Kredensial gateway platform terkonfigurasi.

---

## 2. Service Level Agreement (SLA) & Prioritas Antrean

| Jenis Pengajuan | SLA Pemeriksaan | Jam Operasional | Prioritas Antrean |
| :--- | :--- | :--- | :--- |
| **Tier 1: Profil Legal Badan Usaha** | Maks. 1 × 24 Jam Kerja | Senin – Jumat (08:00 – 18:00 WIB) | P0 (Pengajuan Baru) / P1 (Perbaikan) |
| **Tier 2: Kepatuhan Lokasi Outlet** | Maks. 1 × 24 Jam Kerja | Senin – Jumat (08:00 – 18:00 WIB) | P1 |
| **Resubmission (Perbaikan Dokumen)** | Maks. 12 Jam Kerja | Senin – Sabtu (08:00 – 20:00 WIB) | Prioritas Tinggi |

---

## 3. Checklist Pemeriksaan Dokumen (Reviewer Checklist)

### 3.1 Tier 1: Profil Badan Usaha (Legal Identity)

| Dokumen | Jenis Badan Usaha | Kriteria Validitas | Alasan Permintaan Perbaikan (`REQUEST_CHANGES`) |
| :--- | :--- | :--- | :--- |
| **KTP Penanggung Jawab** | Semua (Wajib) | • NIK 16 digit terdaftar.<br>• Nama sesuai data pemilik/direktur.<br>• Foto e-KTP terbaca jelas (tidak blur/terpotong). | Foto silau, blur, NIK tertutup jari, atau masa berlaku e-KTP tidak sah. |
| **NPWP Badan Usaha** | Wajib untuk PT/CV; Opsional untuk Perorangan | • 15 atau 16 digit.<br>• Nama NPWP sesuai badan usaha / pemilik. | Nomor NPWP buram atau nama berbeda tanpa bukti kuasa. |
| **NIB (Nomor Induk Berusaha)** | Wajib untuk PT/CV; Disarankan untuk Perorangan | • NIB aktif dari sistem OSS.<br>• KBLI relevan dengan industri F&B / Restoran / Kafe. | NIB kedaluwarsa atau bukan atas nama badan usaha yang didaftarkan. |
| **Akta Pendirian & SK Kemenkumham** | Wajib untuk PT, CV, Yayasan, Koperasi | • Memuat nama direktur yang mengajukan.<br>• Memuat cap dan tanda tangan notaris & pengesahan Kemenkumham. | Halaman susunan pengurus/direksi tidak terlampir. |
| **Buku Tabungan / Rekening Koran** | Semua (Wajib) | • Nama pemilik rekening sama dengan nama badan usaha (PT/CV) atau nama penanggung jawab (Perorangan).<br>• Nomor rekening dan nama bank terbaca jelas. | Rekening atas nama pihak ketiga tanpa surat kuasa resmi. |

### 3.2 Tier 2: Kepatuhan Lokasi Outlet (Physical Compliance)

| Komponen | Kriteria Validitas | Alasan Permintaan Perbaikan |
| :--- | :--- | :--- |
| **Alamat & Titik Koordinat** | • Alamat lengkap (Jalan, nomor, kelurahan, kecamatan, kota, kode pos 5 digit).<br>• Koordinat GPS sesuai lokasi resto/kafe di peta. | Alamat fiktif, hanya nama kota tanpa jalan, atau titik GPS berada di laut/lokasi tidak wajar. |
| **Foto Tampak Depan (Storefront)** | • Menampilkan plang nama / banner outlet yang sama dengan nama merek yang didaftarkan.<br>• Menampilkan fisik toko/gerobak/kafe asli. | Foto download dari Google Image, foto produk makanan saja (bukan storefront), atau plang nama toko berbeda. |
| **Foto Area Kasir / Tampak Dalam** | • Menampilkan meja kasir, perangkat POS, atau area pelayanan pesanan. | Foto buram atau tidak relevan. |

---

## 4. Alur Penanganan Keputusan (Decision Flow)

### 4.1 Persetujuan (`APPROVE`)
- Reviewer memverifikasi seluruh berkas valid.
- Klik **"Setujui Verifikasi"**.
- Sistem secara otomatis:
  1. Mengubah status menjadi `verified`.
  2. Menerbitkan log audit dengan ID reviewer dan timestamp.
  3. Mengizinkan aktivasi DOKU Sub Account untuk outlet terkait.

### 4.2 Permintaan Perbaikan (`REQUEST_CHANGES`)
- Digunakan jika dokumen buram, terpotong, atau membutuhkan klarifikasi minor.
- Berikan catatan per dokumen (misal: `"KTP buram pada bagian NIK"`) dan catatan umum keputusan.
- Status berubah menjadi `action_required`.
- Merchant menerima notifikasi dan banner perbaikan di dashboard outlet `/outlet/[outletKey]/verification`.

### 4.3 Penolakan (`REJECT`)
- Digunakan hanya untuk indikasi **fraud**, dokumen palsu, atau bisnis ilegal.
- Wajib menyertakan alasan detail di catatan keputusan dan eskalasi ke Compliance Lead.

---

## 5. Batasan Kewenangan & Privasi Data (RBAC & PII Protection)

1. **Role Compliance Reviewer (`VERIFICATION_ADMIN` & `SYSTEM_ADMIN`):**
   - Memiliki wewenang penuh memeriksa antrean, membuka pratinjau dokumen bertanda tangan (TTL 60 detik), dan memutuskan approval/rejection.
2. **Role Customer Service (`CARE_AGENT`):**
   - **DILARANG KERAS** mengubah status verifikasi atau menyetujui pengajuan.
   - Hanya memiliki izin baca ringkasan publik (`verification:view_summary`) dengan PII tersensor (NIK, NPWP, dan No. Rekening disamarkan).
   - Bertugas mengarahkan merchant yang bertanya di tiket bantuan untuk mengunggah ulang dokumen di menu Verifikasi Bisnis.
3. **Penyimpanan Dokumen:**
   - Seluruh dokumen disimpan dalam private bucket Supabase (`verification-documents`).
   - Tidak ada tautan publik permanen. Setiap akses dokumen menggunakan Signed URL dengan masa berlaku maksimal **60 detik**.
