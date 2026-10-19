# PRD: MENUIN Business Verification & Admin Verification

**Product:** MENUIN  
**Module:** Merchant Business Verification, Admin Verification, DOKU Payment Onboarding  
**Priority:** High — Payment Gateway Readiness  
**Status:** Ready for Technical Discovery & Implementation

## 1. Overview

MENUIN membutuhkan sistem verifikasi bisnis yang terintegrasi untuk memastikan merchant yang menggunakan fitur pembayaran melalui DOKU dapat diperiksa sebelum fitur pembayaran diaktifkan.

Sistem terdiri dari dua antarmuka utama:

1. **Merchant Business Verification:** merchant mengirim data bisnis, melengkapi dokumen yang diperlukan, dan memantau status pengajuan.
2. **Admin Verification:** tim internal MENUIN memeriksa pengajuan, memvalidasi kelengkapan data, meminta perbaikan, membuat keputusan internal, dan memantau status onboarding DOKU.

Kedua antarmuka harus menggunakan sumber data dan alur status yang konsisten. MENUIN Care tetap menjadi modul dukungan pelanggan terpisah, bukan tempat utama untuk memutuskan verifikasi.

### Product principles

- Minimal friction: merchant hanya diminta memberikan data yang benar-benar diperlukan.
- Progressive verification: data atau dokumen tambahan diminta jika diperlukan oleh aturan DOKU, jenis usaha, atau hasil pemeriksaan risiko.
- Clear status: merchant selalu mengetahui langkah berikutnya.
- Separation of responsibilities: keputusan internal MENUIN berbeda dari persetujuan DOKU.
- Secure by design: dokumen dan data pribadi hanya dapat diakses oleh pihak yang berwenang.
- Reuse existing architecture: gunakan autentikasi, account, membership, outlet, database, dan komponen UI yang sudah ada.

## 2. Goals

1. Menyediakan alur pengajuan verifikasi yang mudah bagi merchant.
2. Menyediakan halaman Admin Verification untuk memproses pengajuan tanpa pemeriksaan manual melalui database.
3. Menghubungkan hasil pemeriksaan internal dengan proses onboarding sub-account DOKU.
4. Mencegah fitur pembayaran aktif sebelum persyaratan yang berlaku terpenuhi.
5. Menyimpan riwayat keputusan, perubahan status, dan tindakan admin.
6. Mengurangi pengumpulan dokumen berulang untuk pemilik usaha yang memiliki beberapa outlet, jika kebijakan DOKU memungkinkan.

## 3. Out of Scope

- Mengganti seluruh sistem autentikasi atau multi-tenant MENUIN.
- Membangun ulang Admin Panel atau MENUIN Care yang sudah tersedia.
- Mengimplementasikan KYC biometrik, face recognition, atau OCR sebagai persyaratan awal.
- Menganggap dokumen atau data tertentu wajib untuk seluruh merchant tanpa konfirmasi aturan DOKU.
- Membuat endpoint, status, atau API DOKU berdasarkan asumsi.
- Menyimpan dana merchant, membangun wallet, atau mengubah model settlement yang telah disepakati dengan DOKU.

## 4. User Roles

### 4.1 Merchant / Business Owner

Dapat:
- Membuka halaman verifikasi.
- Melihat persyaratan yang berlaku untuk bisnisnya.
- Mengisi dan menyimpan draft.
- Mengunggah dokumen yang diminta.
- Mengirim pengajuan.
- Memperbaiki pengajuan yang dikembalikan.
- Melihat status, catatan yang dapat dibagikan, dan tindakan berikutnya.

Tidak dapat:
- Menyetujui verifikasi sendiri.
- Mengubah keputusan admin.
- Melihat dokumen atau catatan internal milik merchant lain.
- Mengubah status onboarding DOKU secara manual.

### 4.2 Verification Admin

Dapat:
- Melihat antrean pengajuan sesuai kewenangannya.
- Membuka detail pengajuan.
- Memeriksa data dan dokumen.
- Meminta perubahan atau dokumen tambahan.
- Menyetujui atau menolak verifikasi internal dengan alasan.
- Menandai kasus untuk eskalasi.
- Melihat status DOKU dan riwayat aktivitas sesuai izin akses.

### 4.3 Support / MENUIN Care Agent

Dapat:
- Membantu merchant memahami persyaratan.
- Melihat status tingkat tinggi dan pesan yang dapat dibagikan kepada merchant.
- Membuat atau menautkan tiket dukungan ke pengajuan verifikasi.

Tidak otomatis dapat:
- Menyetujui atau menolak pengajuan.
- Mengakses seluruh dokumen identitas atau catatan risiko internal.
- Mengubah status pembayaran atau onboarding DOKU.

Jika satu orang menjalankan lebih dari satu fungsi operasional, akses dan kewenangannya tetap harus dibatasi berdasarkan permission.

### 4.4 Super Admin

Memiliki akses administratif sesuai kebijakan internal, termasuk pengelolaan permission dan audit. Hak akses sensitif tetap harus eksplisit, tidak sekadar diberikan karena pengguna memiliki akun admin.

## 5. Information Architecture

### Merchant Dashboard

- Business Verification
  - Status overview
  - Business information
  - Responsible person
  - Required documents
  - Submission history
  - Next steps
- Payments
  - Payment activation status
  - DOKU onboarding status jika tersedia

### Admin Panel

- Overview
- Merchants
- Verification
- Payments
- MENUIN Care
- Audit Logs

Prioritas implementasi awal adalah **Merchants, Verification, dan Payments**. Integrasikan dengan navigasi Admin Panel yang sudah ada; jangan membuat Admin Panel kedua jika modul tersebut sudah tersedia.

## 6. Merchant Verification Flow

### Step 1 — Entry Point

Merchant membuka menu Business Verification dari dashboard atau halaman aktivasi pembayaran.

Tampilkan status terkini dan alasan mengapa verifikasi diperlukan untuk mengaktifkan pembayaran.

Jika belum ada pengajuan, tampilkan CTA untuk mulai verifikasi.

### Step 2 — Business Information

Form awal dibuat singkat dan menggunakan data yang sudah tersedia bila memungkinkan.

Data awal yang direkomendasikan:

- Nama usaha.
- Kategori usaha.
- Alamat usaha.
- Nama penanggung jawab.
- Kontak penanggung jawab, menggunakan profil yang tersedia jika sesuai.
- Deskripsi singkat produk atau layanan.
- Satu foto usaha atau bukti kegiatan usaha yang relevan, apabila diperlukan untuk pemeriksaan.

Dokumen tambahan seperti KTP, NIB, NPWP, dokumen badan usaha, surat kuasa, bukti kepemilikan rekening, atau izin khusus hanya diminta ketika diperlukan berdasarkan persyaratan DOKU, jenis merchant, atau hasil pemeriksaan.

Jangan meminta merchant mengunggah dokumen yang sama berulang kali jika dokumen tersebut masih valid, dapat digunakan kembali, dan kebijakan DOKU memperbolehkannya.

### Step 3 — Review & Consent

Sebelum mengirim pengajuan, merchant:
- Memeriksa kembali informasi.
- Mengonfirmasi bahwa informasi yang diberikan benar.
- Mendapat penjelasan mengenai penggunaan dan pemrosesan data pribadi.

Persetujuan pemrosesan data harus mengikuti kebijakan privasi MENUIN dan dasar pemrosesan yang berlaku.

### Step 4 — Submission

Ketika dikirim:
- Validasi dilakukan di server.
- Draft berubah menjadi pengajuan aktif.
- Sistem menyimpan waktu pengajuan dan versi data yang dikirim.
- Merchant menerima nomor atau identitas pengajuan yang dapat digunakan untuk pelacakan.
- Pengajuan muncul pada antrean Admin Verification.
- Merchant tidak dapat mengubah snapshot pengajuan yang sedang diperiksa secara langsung; perubahan dilakukan melalui mekanisme perbaikan atau versi pengajuan baru.

### Step 5 — Admin Review

Admin memeriksa data dan dokumen. Admin dapat:
- Menyetujui verifikasi internal.
- Meminta perbaikan.
- Menolak pengajuan dengan alasan yang sesuai.
- Mengeskalasi kasus untuk pemeriksaan lebih lanjut.

### Step 6 — DOKU Onboarding

Setelah pemeriksaan internal memenuhi syarat, proses DOKU dilanjutkan sesuai integrasi dan ketentuan yang benar-benar tersedia.

Jika DOKU menyediakan API, webhook, atau dashboard untuk status sub-account, gunakan mekanisme resmi tersebut setelah dikonfirmasi. Jika sebagian proses masih manual, tampilkan status manual yang jelas dan simpan catatan operasional.

Jangan menganggap persetujuan internal sebagai persetujuan DOKU.

### Step 7 — Payment Activation

Fitur pembayaran hanya boleh diaktifkan jika seluruh persyaratan internal dan persyaratan provider yang berlaku sudah terpenuhi.

Pemeriksaan harus dilakukan di backend pada setiap operasi yang relevan. Menyembunyikan tombol di frontend saja tidak cukup.

## 7. Merchant Verification Statuses

Status internal yang direkomendasikan:

- `not_started`: belum memulai pengajuan.
- `draft`: sedang mengisi formulir.
- `submitted`: pengajuan berhasil dikirim.
- `under_review`: sedang diperiksa oleh admin.
- `action_required`: merchant harus memperbaiki atau melengkapi data.
- `verified`: verifikasi internal MENUIN disetujui.
- `rejected`: pengajuan ditolak.
- `suspended`: verifikasi atau akses pembayaran ditangguhkan setelah proses yang berwenang.

Aturan transisi harus divalidasi di backend. Jangan memperbolehkan perubahan status sembarang hanya dengan mengirim nilai status dari frontend.

Status DOKU harus disimpan secara terpisah. Gunakan status aktual yang dikembalikan oleh DOKU atau status operasional yang benar-benar tersedia. Jangan mengarang daftar status provider.

Status pembayaran aktif harus ditentukan dari kombinasi syarat yang berlaku, bukan dari satu status verifikasi internal saja.

## 8. Admin Verification Page

### 8.1 Verification Overview

Tampilkan ringkasan:
- Total pengajuan.
- Menunggu pemeriksaan.
- Membutuhkan tindakan merchant.
- Disetujui secara internal.
- Ditolak.
- Menunggu atau mengalami kendala onboarding provider, jika statusnya tersedia.

Angka harus berasal dari data aktual database, bukan data mock.

### 8.2 Review Queue

Tabel atau daftar pengajuan memuat:
- Nama usaha.
- Pemilik atau penanggung jawab.
- Kategori usaha.
- Tanggal pengajuan.
- Status internal.
- Status DOKU jika tersedia.
- Indikator kelengkapan.
- Reviewer, jika sistem mendukung penugasan.
- Aksi membuka detail.

Fitur:
- Pencarian nama usaha atau identitas pengajuan.
- Filter status.
- Filter tanggal.
- Pengurutan berdasarkan waktu pengajuan atau prioritas.
- Pagination sesuai pola aplikasi.
- Empty state, loading state, dan error state.

### 8.3 Verification Detail

Halaman detail dibagi menjadi beberapa bagian.

**A. Business Profile**
- Informasi bisnis yang diajukan.
- Kategori dan alamat.
- Deskripsi usaha.
- Foto atau bukti usaha yang relevan.

**B. Responsible Person**
- Informasi penanggung jawab yang diperlukan.
- Dokumen identitas hanya jika diwajibkan atau diminta secara sah.

**C. Document Checklist**
- Daftar persyaratan yang berlaku untuk pengajuan tersebut.
- Status setiap dokumen: belum ada, diterima untuk pemeriksaan, perlu diperbaiki, atau ditandai tidak memenuhi syarat.
- Catatan admin yang relevan.
- Akses dokumen melalui mekanisme penyimpanan privat yang aman.

Status “diterima untuk pemeriksaan” tidak boleh ditampilkan sebagai bukti bahwa dokumen tersebut telah divalidasi secara hukum jika belum dilakukan.

**D. Internal Review**
- Keputusan dan catatan pemeriksaan.
- Alasan permintaan perubahan atau penolakan.
- Reviewer dan waktu tindakan.
- Riwayat status.

**E. DOKU Onboarding**
- Status provider yang aktual.
- Identitas referensi sub-account jika tersedia.
- Waktu pembaruan terakhir.
- Catatan kegagalan atau tindak lanjut operasional yang aman untuk ditampilkan kepada role terkait.

**F. Payment Readiness**
- Ringkasan persyaratan yang sudah terpenuhi.
- Persyaratan yang masih tertunda.
- Hasil pemeriksaan backend atas kelayakan aktivasi pembayaran.

### 8.4 Admin Actions

Sediakan tindakan:
- Approve Internal Verification.
- Request Changes.
- Reject Application.
- Escalate / Flag for Further Review.

Semua tindakan harus:
- Memerlukan konfirmasi sebelum keputusan final.
- Menyimpan actor, timestamp, alasan, dan perubahan status.
- Menggunakan server-side authorization.
- Mencegah keputusan ganda atau transisi status yang tidak valid.
- Mengirim notifikasi kepada merchant jika mekanisme notifikasi tersedia.

Tindakan internal approve tidak boleh langsung mengubah status DOKU menjadi approved atau mengaktifkan pembayaran tanpa bukti status provider yang valid.

## 9. MENUIN Care Integration

MENUIN Care merupakan sistem tiket bantuan pelanggan, bukan mesin keputusan verifikasi.

Kategori tiket dapat mencakup:
- Account & Access.
- POS & Orders.
- Payments.
- Subscription & Billing.
- Storefront & QR.
- Business Verification.
- General Inquiry.

Status tiket dapat mengikuti sistem Care yang sudah ada. Jika belum tersedia, usulan awal: `open`, `in_progress`, `waiting_for_user`, `waiting_internal`, `resolved`, `closed`.

Tiket Business Verification dapat ditautkan ke ID pengajuan verifikasi. Agen Care dapat membantu komunikasi, tetapi tindakan persetujuan tetap memerlukan permission Verification Admin.

Jangan membuat ulang ticketing system apabila MENUIN Care sudah tersedia.

## 10. Data Model Proposal

Lakukan audit schema yang sudah ada sebelum membuat tabel baru. Sesuaikan nama tabel dan relasi dengan implementasi aktual.

Entitas yang mungkin diperlukan:

### Business Profile
Menyimpan identitas bisnis yang dapat digunakan bersama beberapa outlet jika sesuai model bisnis dan kebijakan provider.

Contoh atribut:
- `id`
- `account_id` atau relasi owner yang sesuai dengan schema saat ini
- `business_name`
- `business_category`
- `business_address`
- `responsible_person_name`
- `responsible_person_contact`
- `business_description`
- `created_at`
- `updated_at`

### Verification Submission
Menyimpan setiap versi pengajuan dan statusnya.

Contoh atribut:
- `id`
- `business_profile_id`
- `submitted_by`
- `status`
- `submitted_at`
- `reviewed_by`
- `reviewed_at`
- `decision_reason`
- `created_at`
- `updated_at`

### Verification Documents
Menyimpan metadata dokumen dan referensi penyimpanan privat, bukan isi dokumen sensitif di kolom biasa.

Contoh atribut:
- `id`
- `submission_id`
- `document_type`
- `storage_key`
- `review_status`
- `review_note`
- `uploaded_at`
- `reviewed_at`

### Provider Onboarding
Menyimpan status onboarding DOKU secara terpisah dari status internal MENUIN.

Contoh atribut:
- `id`
- `business_profile_id` atau relasi merchant yang sesuai
- `provider`
- `provider_reference`
- `provider_status`
- `last_synced_at`
- `last_error_code` jika aman dan tersedia
- `created_at`
- `updated_at`

### Verification Audit Log
Mencatat tindakan penting.

Contoh atribut:
- `id`
- `submission_id`
- `actor_id`
- `action`
- `previous_status`
- `new_status`
- `reason`
- `created_at`

Semua atribut di atas merupakan rancangan konseptual, bukan instruksi untuk membuat duplikasi tabel yang sudah ada. Gunakan foreign key, unique constraint, index, dan kebijakan penghapusan sesuai kebutuhan.

## 11. Security & Privacy Requirements

- Gunakan session dan sistem autentikasi MENUIN yang sudah berjalan.
- Validasi permission di server pada setiap operasi baca dan tulis.
- Terapkan isolasi tenant agar merchant hanya dapat mengakses pengajuan miliknya.
- Batasi akses Admin Verification berdasarkan role dan permission.
- Simpan dokumen dalam private storage; gunakan signed URL berumur pendek atau mekanisme aman setara.
- Validasi tipe file, ukuran, dan ekstensi di server.
- Jangan mengekspos storage key privat atau dokumen sensitif ke pengguna yang tidak berwenang.
- Jangan menulis KTP, nomor rekening, token, atau isi dokumen ke application log.
- Catat tindakan administratif yang sensitif.
- Terapkan retensi dan penghapusan data sesuai kebutuhan operasional, kebijakan DOKU, dan peraturan yang berlaku.
- Verifikasi signature webhook dan lakukan idempotency handling jika integrasi provider mendukung webhook.
- Lindungi endpoint aktivasi pembayaran agar status tidak dapat dimanipulasi dari frontend.
- Jangan melakukan auto-approval berbasis kategori risiko sebelum aturan dan kewenangannya disepakati.

## 12. Technical Requirements

Ikuti teknologi yang benar-benar digunakan repository. Berdasarkan arsitektur MENUIN yang diketahui, kandidat teknologi mencakup:

- Next.js.
- TypeScript.
- Supabase Auth / SSR jika masih digunakan oleh implementasi aktif.
- Drizzle ORM.
- PostgreSQL / Supabase Database sesuai konfigurasi aktif.
- Tailwind CSS.
- shadcn/ui.

Jangan mengganti authentication provider, ORM, struktur routing, atau pola API sebagai bagian dari fitur ini kecuali ada kebutuhan nyata dan disetujui.

Semua perubahan schema harus melalui mekanisme migration yang sudah digunakan repository.

## 13. Acceptance Criteria

### Merchant Side
- [ ] Merchant dapat membuka halaman verifikasi dari navigasi yang relevan.
- [ ] Data yang sudah tersedia dapat diisi otomatis jika sumber datanya tepercaya.
- [ ] Merchant dapat menyimpan draft dan melanjutkan kembali.
- [ ] Merchant dapat mengirim pengajuan valid.
- [ ] Merchant dapat melihat status dan tindakan berikutnya.
- [ ] Merchant dapat memperbaiki pengajuan berstatus `action_required`.
- [ ] Merchant tidak dapat membaca atau mengubah pengajuan merchant lain.
- [ ] Dokumen sensitif tidak dapat diakses tanpa otorisasi.

### Admin Side
- [ ] Admin berwenang dapat membuka antrean verifikasi.
- [ ] Daftar pengajuan berasal dari database aktual.
- [ ] Admin dapat mencari, memfilter, dan membuka detail pengajuan.
- [ ] Admin dapat memeriksa data dan dokumen sesuai permission.
- [ ] Admin dapat meminta perbaikan, menyetujui internal, menolak, atau melakukan eskalasi.
- [ ] Alasan keputusan dan riwayat tindakan tersimpan.
- [ ] Admin tanpa permission tidak dapat melakukan tindakan sensitif.
- [ ] MENUIN Care tidak otomatis memperoleh kewenangan verifikasi.

### DOKU & Payments
- [ ] Status internal MENUIN terpisah dari status DOKU.
- [ ] Integrasi hanya menggunakan endpoint, status, dan kontrak DOKU yang telah diverifikasi.
- [ ] Kegagalan provider tidak menyebabkan pengajuan internal hilang atau berubah secara salah.
- [ ] Sub-account tidak dibuat berulang akibat retry.
- [ ] Pembayaran tidak dapat diaktifkan sebelum semua syarat yang berlaku terpenuhi.
- [ ] Status pembayaran dapat diaudit.

### Quality
- [ ] Migration dapat dijalankan melalui workflow repository.
- [ ] Type checking, lint, dan build berjalan sesuai standar project.
- [ ] Ada pengujian authorization, tenant isolation, status transitions, dokumen, dan payment gating.
- [ ] Loading, empty, error, dan success states tersedia.
- [ ] Tidak ada data mock yang disamarkan sebagai data produksi.

## 14. Implementation Phases

**Phase 0 — Repository Audit**
Audit schema, auth, roles, outlet/account relations, Admin Panel, MENUIN Care, payment integration, dan komponen UI yang sudah ada.

**Phase 1 — Data & Authorization**
Buat atau modifikasi schema minimal, migration, status model, permission, dan server-side validation.

**Phase 2 — Merchant Verification**
Implementasikan form, draft, upload dokumen, submission, status tracker, dan perbaikan pengajuan.

**Phase 3 — Admin Verification**
Implementasikan overview, review queue, detail pengajuan, review checklist, keputusan, serta audit trail.

**Phase 4 — DOKU & Payment Readiness**
Integrasikan hanya kemampuan provider yang telah dikonfirmasi. Tambahkan payment gating dan penanganan kegagalan.

**Phase 5 — QA & Hardening**
Jalankan pengujian, review keamanan, migration check, build, dan validasi end-to-end.

## 15. Definition of Done

Fitur dianggap selesai ketika merchant dapat mengajukan dan melacak verifikasi, admin dapat meninjau dan memutuskan pengajuan melalui Admin Panel, status DOKU terpisah dan akurat, akses data terlindungi, serta pembayaran hanya aktif sesuai persyaratan yang benar-benar berlaku.

Seluruh implementasi harus konsisten dengan arsitektur repository MENUIN saat ini dan tidak menggantikan fitur yang sudah berfungsi tanpa alasan teknis yang jelas.