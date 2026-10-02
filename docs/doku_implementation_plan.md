# Plan Implementasi DOKU — Status & Langkah Lanjutan

Branch: `claude/peaceful-davinci-927vqi`
Acuan teknis lengkap: [`doku_payment_gateway_migration_source_of_truth.md`](./doku_payment_gateway_migration_source_of_truth.md)

## Keputusan yang sudah diambil

- **Model akun:** Platform + Sub Account (Model A). Kredensial DOKU hanya ada di env server. Tiap outlet hanya menyimpan `doku_sub_account_id`.
- **Lingkungan:** semua fase dikerjakan dan dites di **sandbox**. Production di bagian paling akhir.
- **Fase 0** (hotfix Midtrans) **dilewati**, karena aplikasi belum rilis dan Midtrans langsung diganti.
- **Produk:** DOKU Checkout untuk storefront dan langganan. SNAP QRIS untuk POS (Fase 3).

---

## Fase 1: Checkout storefront ✅ SELESAI (commit `3dcdd69`)

- `lib/payments/doku/*`: config, signature, client, checkout, status, sub account, notification
- `lib/payments/payment.service.ts`, `state-machine.ts`, `utils.ts`
- `/api/webhook/doku` dan `/api/cron/payment-reconcile`
- Tabel `payment_attempts` dan `payment_webhook_events` (`drizzle/doku_payments.sql`)
- Storefront memakai redirect ke DOKU. Pengaturan memakai aktivasi Sub Account. Cek status kasir (web dan mobile) sudah memakai DOKU.
- Pengujian: 59 unit test dan 11 integration test (Postgres lokal) lolos, `tsc` dan `next build` bersih.
- **Belum diuji live ke DOKU sandbox**, karena network environment memblokir `api-sandbox.doku.com`.

---

## Fase 2: Langganan Menuin via DOKU ✅ SELESAI (menunggu uji live di sandbox)

- Katalog harga di server: `lib/billing/plans.ts`. Tabel `subscription_invoices`. `payment_attempts` mendukung `purpose` ORDER dan SUBSCRIPTION. Migrasi di `drizzle/doku_subscriptions.sql`.
- `startSubscriptionPayment` mengarahkan dana ke akun platform. Saat lunas, `applySubscriptionPaid` mengaktifkan atau memperpanjang langganan (sisa hari ikut dibawa) dan memperbarui `subscription_tier`.
- `/checkout` wajib login dan hanya untuk OWNER. Halaman baru `/checkout/status`. `PaymentGate` membaca katalog server. Entitlement mengecek `currentPeriodEnd`.
- Celah keamanan dihapus: `markTenantAsPaidAction`, `createOrUpdateSubscription`, `getTenantDetailsByEmail`, dan route Midtrans lama.
- **Bug yang ditemukan dan diperbaiki saat pengujian:**
  - Deadlock saat owner klik "Bayar" paralel, karena urutan lock tenant ↔ invoice tidak konsisten. Billing action sekarang diserialisasi lewat unique index, bukan lock tenant.
  - Nama FK `payment_attempts → subscription_invoices` lebih dari 63 karakter sehingga dipotong Postgres. Diganti nama pendek `payment_attempts_sub_invoice_fk`.
- Pengujian:
  - **107 test lolos**: 79 unit, 28 integration ke Postgres, termasuk race webhook vs ganti paket.
  - Mutation check: test gagal saat carry-over, dedupe aktivasi, atau update tier dirusak.
  - Migrasi diverifikasi dari kondisi fresh, upgrade dari Fase 1, dan run berulang.
  - `tsc`, `eslint`, dan `next build` bersih.

### Keputusan produk yang masih terbuka
- Harga billing (Starter Rp99.000 → BASIC, Business Rp199.000 → PRO) **berbeda** dengan harga di landing (`components/landing/pricing-data.ts`: Kasir 49.900, Kasir Plus 74.900, Lengkap 149.000, ditandai "belum final"). Begitu final, cukup ubah `lib/billing/plans.ts`. Kalau jumlah paket berubah, mapping ke tier di `getEntitlements` juga perlu disesuaikan.

---

## Fase 3: POS QRIS dinamis (SNAP) ✅ SELESAI (menunggu uji live di sandbox)

- **Modul SNAP** (`lib/payments/doku/snap/`):
  - config yang menolak public key DOKU yang tertukar dengan public key Menuin (kesalahan yang terjadi di chat sebelumnya);
  - signature RSA dan HMAC-SHA512 sesuai library resmi DOKU;
  - token B2B di-cache (single-flight, retry saat 401);
  - QRIS generate/query;
  - token SNAP inbound (JWT RS256).
- **POS:** "QR Dinamis" sebelumnya langsung dicatat **lunas tanpa pembayaran sungguhan**. Sekarang alurnya:
  - transaksi PENDING, lalu QR DOKU tampil;
  - polling, lalu lunas setelah DOKU mengonfirmasi;
  - batal: stok kembali;
  - QR kedaluwarsa: bisa dibuat ulang.
- **Ditutup:** `createTransaction` dan API POS mobile tidak lagi bisa mencatat QRIS dinamis atau metode gateway sebagai lunas.
- **Endpoint notifikasi SNAP:** `/api/snap/v1.0/access-token/b2b` dan `/api/snap/v1.0/qr/qr-mpm-notify`. Body notifikasi tidak dipercaya; status selalu diambil ulang lewat query.
- **Bug yang ditemukan dan diperbaiki saat pengujian:** rate limit cek status bocor saat request paralel (4 request sekaligus semuanya memanggil DOKU). Sekarang klaim cek dilakukan atomik. Perbaikan ini juga berlaku untuk polling halaman status storefront dan langganan.
- **Pengujian:**
  - **147 test lolos**, termasuk 54 unit SNAP dan 13 integration QRIS POS;
  - mutation check: test gagal bila restock atau cek-sebelum-batal dihapus;
  - migrasi Fase 1–3 diverifikasi;
  - `tsc`, `eslint`, dan `next build` bersih.

### Perlu dikonfirmasi saat uji live sandbox
- `CHANNEL-ID` yang benar untuk QRIS (default `95221`).
- Field wajib `additionalInfo` pada `qr-mpm-generate`.
- Cara DOKU memetakan merchant QRIS ke Sub Account outlet. Saat ini setiap outlet memakai `doku_qris_merchant_id`/`doku_qris_terminal_id` sendiri, diisi admin sesuai data dari DOKU.

---

## Fase 4: Rekonsiliasi & operasional ⏳
- Settlement report harian: isi `fee_amount`/`net_amount` riil (`fee_source = SETTLEMENT`).
- Dashboard admin untuk attempt dengan `requires_review = true` (bayar ganda, telat, amount mismatch).
- Alur refund, manual dulu.

## Go-live ⏳
- Lengkapi legal dan kontrak platform dengan DOKU. Buat kredensial production **baru**, karena key sandbox sudah pernah ditempel di chat.
- `DOKU_ENV=production` membuat Sub Account otomatis wajib. Daftarkan Notification URL production. Buat Sub Account production per outlet.

---

## Yang perlu disiapkan pemilik project
- [ ] Env deployment: `DOKU_ENV`, `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, `APP_BASE_URL`, `CRON_SECRET` (dan variabel QRIS di bawah).
- [ ] Jalankan migrasi: `DATABASE_URL=… npm run db:migrate:doku --workspace=web`.
- [ ] Dashboard DOKU sandbox: Notification URL `https://<domain>/api/webhook/doku`. Aktifkan Checkout dan Sub Account.
- [ ] Scheduler cron 5 menit untuk `GET /api/cron/payment-reconcile` dengan header `Authorization: Bearer <CRON_SECRET>`.
- [ ] QRIS: buat RSA key pair sendiri, unggah public key ke DOKU, isi `DOKU_PRIVATE_KEY`, `DOKU_PUBLIC_KEY` (milik DOKU), `DOKU_QRIS_MERCHANT_ID`, dan `DOKU_QRIS_TERMINAL_ID`. Daftarkan base URL SNAP `https://<domain>/api/snap`.
- [ ] Supaya Claude bisa ikut tes live: tambahkan `api-sandbox.doku.com` dan `developers.doku.com` ke network allowlist environment, lalu isi env DOKU di pengaturan environment.
- [ ] Putuskan harga final paket langganan (lihat "Keputusan produk yang masih terbuka" di Fase 2).
