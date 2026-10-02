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

## Fase 3: POS QRIS dinamis (SNAP) ⏳
- Generate RSA key pair sendiri, lalu upload public key ke DOKU. Private key disimpan di env (`DOKU_PRIVATE_KEY`). Simpan juga `DOKU_PUBLIC_KEY` milik DOKU.
  - Catatan: dua public key yang dikirim di chat **identik**, jadi salah satunya keliru.
- Token B2B: `X-SIGNATURE = SHA256withRSA(clientId|timestamp)`, di-cache sampai expired dikurangi 60 detik.
- `POST /snap-adapter/b2b/v1.0/qr/qr-mpm-generate` menghasilkan `qrContent` yang ditampilkan di `features/pos/components/payment-modal.tsx` (opsi `qris_dynamic`).
- Notifikasi SNAP diverifikasi dengan public key DOKU (asymmetric). Fallback-nya `qr-mpm-query`.
- Pakai ulang `payment_attempts` dengan `product = 'SNAP_QRIS'` dan state machine yang sama.

## Fase 4: Rekonsiliasi & operasional ⏳
- Settlement report harian: isi `fee_amount`/`net_amount` riil (`fee_source = SETTLEMENT`).
- Dashboard admin untuk attempt dengan `requires_review = true` (bayar ganda, telat, amount mismatch).
- Alur refund, manual dulu.

## Go-live ⏳
- Lengkapi legal dan kontrak platform dengan DOKU. Buat kredensial production **baru**, karena key sandbox sudah pernah ditempel di chat.
- `DOKU_ENV=production` membuat Sub Account otomatis wajib. Daftarkan Notification URL production. Buat Sub Account production per outlet.

---

## Yang perlu disiapkan pemilik project
- [ ] Env deployment: `DOKU_ENV`, `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, `APP_BASE_URL`, `CRON_SECRET`.
- [ ] Jalankan migrasi: `DATABASE_URL=… npm run db:migrate:doku --workspace=web`.
- [ ] Dashboard DOKU sandbox: Notification URL `https://<domain>/api/webhook/doku`. Aktifkan Checkout dan Sub Account.
- [ ] Scheduler cron 5 menit untuk `GET /api/cron/payment-reconcile` dengan header `Authorization: Bearer <CRON_SECRET>`.
- [ ] Supaya Claude bisa ikut tes live: tambahkan `api-sandbox.doku.com` dan `developers.doku.com` ke network allowlist environment, lalu isi env DOKU di pengaturan environment.
- [ ] Putuskan harga final paket langganan (lihat "Keputusan produk yang masih terbuka" di Fase 2).
