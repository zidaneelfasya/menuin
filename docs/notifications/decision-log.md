# Decision & Change Log: Menuin Notification System

Dokumen ini mencatat keputusan arsitektural, masukan pengguna (*user feedback*), dan rekaman perubahan (*changelog*) selama perancangan dan implementasi fitur sistem notifikasi Menuin.

---

## Log Riwayat & Keputusan

### [2026-11-09] - Inisialisasi PRD & Implementasi Notifikasi Inti

#### 1. Masukan & Arahan Pengguna (User Feedback & Constraints)
* **Pemisahan Sistem Notifikasi:**
  - *Pesanan Masuk (Operasional Kasir/Dapur)* tetap beroperasi independen melalui modal pesanan masuk, audio chime `/notification.mp3`, dan kanban orders.
  - *Lonceng Kanan Atas* khusus difungsikan sebagai **Pusat Notifikasi Manajemen & Toko** (Verifikasi, Langganan/Billing, Promosi, dan Keamanan Akun/Tim).
* **Dual-Presentation UI:**
  - Menampilkan *Floating Popover* saat ikon lonceng diklik untuk 5–6 notifikasi terbaru dengan tombol *Tandai semua dibaca* dan tautan *Lihat semua notifikasi*.
  - Menyediakan *Dedicated Page* `/outlet/[outletKey]/notifications` untuk audit menyeluruh.
* **Filter Waktu & Kategori:**
  - Filter Kategori: `Semua`, `Verifikasi`, `Langganan`, `Promosi`, `Akun & Tim`.
  - Filter Waktu: `Semua waktu`, `Hari ini`, `7 hari terakhir`, `30 hari terakhir`.
  - Opsi filter cepat: *Belum dibaca saja*.
* **Standar Tipografi & Anti-Slop (Menuin Design Standard):**
  - Dilarang menggunakan kapitalisasi sembarangan (*uppercase*) pada teks judul, deskripsi, dan tombol. Gunakan *sentence case* alami.
  - Dilarang menggunakan *letter-tracking* artifisial (`tracking-wider`/`tracking-widest`) pada copy teks panjang.
  - Bebas gradasi (*zero gradients*): kartu berlatar putih murni (`bg-white`), *borderless* (`border-none`), dengan bayangan fisik lembut multi-stop.

#### 2. Keputusan Arsitektur Teknis
1. **Penyimpanan Database:**
   - Menambahkan tabel `notifications` pada PostgreSQL dengan indeks `tenant_id`, `recipient_account_id`, `created_at`, dan `tenant_id + is_read`.
   - Mengaktifkan `ALTER PUBLICATION supabase_realtime ADD TABLE notifications` agar pembaruan status dapat disiarkan langsung ke browser via WebSocket.
2. **Komponen Antarmuka:**
   - `NotificationPopover`: Menggunakan Radix UI Popover yang di-style borderless raised, terintegrasi langsung pada `Header` (`apps/web/src/components/layout/header.tsx`).
   - `NotificationsClient`: Mengadopsi pengelompokan timeline natural (*Hari ini*, *Kemarin*, *Minggu ini*, *Lebih lama*) dengan filter pill kapsul tactile.
3. **Penyelarasan Realtime:**
   - Menggunakan channel reaktif `tenant-notifications-${tenantId}` yang secara otomatis menyinkronkan unread badge dan data terbaru tanpa memerlukan reload browser.

#### 3. Status Komponen
- [x] Skema Drizzle & Migrasi Database: **Selesai (Aktif di DB)**
- [x] Server Actions (`apps/web/src/lib/actions/notifications.ts`): **Selesai**
- [x] Floating Popover (`NotificationPopover`): **Selesai**
- [x] Halaman Penuh Notifikasi (`/outlet/[outletKey]/notifications`): **Selesai**
- [x] Integrasi Realtime WebSocket: **Selesai**
- [x] Verifikasi TypeScript (`tsc --noEmit`): **0 Error**

---

### [2026-11-09] - Optimasi Transisi Halaman (Page Transition & Loading Architecture)

#### 1. Masukan & Temuan Masalah (User Report)
* Pengguna melaporkan bahwa saat mengklik tombol *"Lihat semua notifikasi"*, animasi tirai transisi halaman (*page transition curtain*) muncul namun halaman tidak berpindah.

#### 2. Investigasi & Akar Masalah (Root Cause Analysis)
* Sistem transisi halaman Menuin (`PageTransitionProvider`) menggunakan arsitektur **Dual-Gate Completion**:
  - **Gate 1:** Menunggu animasi tirai selesai menutupi layar (`isCurtainCovered`).
  - **Gate 2:** Menunggu rute tujuan terpasang di DOM (`isRouteReady`, dipicu saat `pathname === targetHref`).
* Pada rute `/outlet/[outletKey]/notifications`, belum disediakan file pendamping **`loading.tsx`** dan halaman belum mendukung *streaming suspense* Next.js 15 berbasis `params` Promise.
* Akibatnya, browser tertahan menunggu *Server Component* render tuntas sebelum mengubah `pathname`. Hal ini menahan Gate 2 sehingga tirai transisi tampak berhenti.
* Di sisi lain, pada tombol popover, `outletKey` berpotensi tidak tersinkron jika hanya mengandalkan *props* tanpa membaca `useParams()` / `usePathname()`.

#### 3. Solusi & Tindakan yang Diterapkan
1. **Penyediaan `loading.tsx` Khusus:**
   - Dibuat file [`apps/web/src/app/outlet/[outletKey]/notifications/loading.tsx`](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/outlet/[outletKey]/notifications/loading.tsx) dengan skeleton loading berstandar Menuin.
   - Mengaktifkan pola arsitektur **Navigate First, Fetch Data After** bawaan commit `5754162`, sehingga Next.js langsung memasang rute dan mengubah `pathname` secara instan saat transisi dipicu.
2. **Pola Halaman Next.js 15 Teroptimasi:**
   - Memperbarui [`page.tsx`](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/outlet/[outletKey]/notifications/page.tsx) dengan tipe `{ params: Promise<{ outletKey: string }> }` dan pembungkusan `<Suspense fallback={<NotificationsLoading />}>`.
3. **Penyelarasan Dinamis `outletKey`:**
   - Pada [`notification-popover.tsx`](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/components/layout/notification-popover.tsx), `activeOutletKey` diekstrak dinamis dari `useParams().outletKey` dan `usePathname()` dengan fallback ke props.
4. **Implementasi Pre-fetching (`prefetchRoute` & `<Link>`):**
   - Mengubah tombol footer popover menjadi komponen `<Link prefetch={true}>` dengan pemicu `prefetchRoute` otomatis saat popover dibuka atau saat pengguna mengarahkan kursor (*hover*).
   - Menambahkan `prefetchRoute` pada kartu item notifikasi saat di-hover.

---

### [2026-11-09] - Perbaikan Error Boundary "Terjadi Kesalahan" Setelah Membuka Halaman

#### 1. Masukan & Temuan Masalah (User Report)
* Pengguna melaporkan: *"setelah beberapa saat membuka notifications yang tiba tiba muncul terjadi kesalahan."*
* Halaman berpindah ke fallback Error Boundary `apps/web/src/app/outlet/[outletKey]/error.tsx` dengan pesan *"Terjadi Kesalahan - Maaf, sistem mengalami kesalahan tidak terduga saat memuat data halaman ini."*

#### 2. Investigasi & Akar Masalah (Root Cause Analysis)
1. **Konflik Channel Supabase Realtime (Topic Collision):**
   - Komponen `NotificationPopover` (yang selalu terpasang pada `Header` di setiap halaman) dan `NotificationsClient` (pada halaman penuh notifikasi) keduanya mendaftar ke topik WebSocket yang sama: `tenant-notifications-${tenantId}`.
   - Di `@supabase/supabase-js`, mendaftar dua channel dengan topik identik pada satu client browser menyebabkan event listener bertabrakan. Saat salah satu komponen melakukan unmount atau re-render pada pergantian filter, pemanggilan `supabase.removeChannel(channel)` memutus channel yang sedang aktif bagi komponen lainnya dan memicu event error unhandled.
2. **`revalidatePath` Memicu Error `NEXT_REDIRECT` di Server Component:**
   - Server actions (`markNotificationAsRead`, `markAllNotificationsAsRead`, `deleteNotification`, dan `clearReadNotifications`) memanggil `revalidatePath('/outlet/[outletKey]/notifications')`.
   - Pada Next.js 15, revalidasi latar belakang ini memaksa re-render komponen server `NotificationsPage`. Saat re-render latar belakang, request headers tidak membawa `x-menuin-outlet-key`. Di dalam `NotificationsContent`, terdapat baris `if (!user) redirect('/auth/login')`. Pemanggilan `redirect()` di dalam re-render streaming melempar error internal `NEXT_REDIRECT` yang ditangkap oleh boundary `error.tsx`.
   - Padahal, `NotificationsClient` telah mengelola pembaruan antarmuka secara *optimistic state*, sehingga `revalidatePath` di server sama sekali tidak dibutuhkan dan membebani server.
3. **Potensi `RangeError` pada `new Intl.DateTimeFormat`:**
   - Helper `formatCardDate` dan `formatRelativeTime` mem-parsing `new Date(date)` tanpa perlindungan `try/catch` atau validasi `isNaN(d.getTime())`. Apabila terdapat data notifikasi dengan timestamp tidak valid, pemanggilan `new Intl.DateTimeFormat` langsung melempar `RangeError: Invalid time value` yang merusak pohon render React.
4. **Fetch Redundan Saat Inisialisasi Halaman (Initial Mount Race Condition):**
   - `NotificationsClient` menjalankan `refreshNotifications()` langsung di `useEffect` pertama kali dimount, meskipun halaman sudah menerima `initialNotifications` lengkap dari server.

#### 3. Solusi & Tindakan yang Diterapkan
1. **Isolasi Topik Channel Realtime:**
   - Mengubah topik channel pada `NotificationPopover` menjadi `popover-notifications-${tenantId}`.
   - Mengubah topik channel pada `NotificationsClient` menjadi `page-notifications-${tenantId}`.
   - Menambahkan callback `subscribe((status) => ...)` dengan log penanganan kesalahan yang aman.
2. **Penghapusan `revalidatePath` pada Mutasi Notifikasi:**
   - Menghapus pemanggilan `revalidatePath` dari server actions di `apps/web/src/lib/actions/notifications.ts` agar pembaruan status berjalan murni secara *optimistic UI* di klien dan mengeliminasi re-render latar belakang tak terduga.
3. **Pembersihan `redirect()` di `NotificationsContent`:**
   - Mengganti `if (!user) redirect('/auth/login')` dengan pengembalian aman `if (!user) return null;` pada `apps/web/src/app/outlet/[outletKey]/notifications/page.tsx`, mengingat proteksi sesi pengguna sudah dijamin penuh oleh `DashboardLayout` (`layout.tsx`).
4. **Pengamanan Parsing Tanggal (Defensive Date Parsing):**
   - Menambahkan pembungkusan `try/catch` dan pemeriksaan `isNaN(d.getTime())` pada `formatCardDate`, `formatRelativeTime`, serta pengelompokan timeline `groupedItems`.
5. **Pencegahan Fetch Redundan:**
   - Menambahkan `isFirstMount = React.useRef(true)` pada `NotificationsClient` agar data awal dari Server Component langsung digunakan tanpa memicu pemanggilan ulang server action di detik awal render.

---

### [2026-11-09] - Transformasi Menjadi "Log Notifikasi" Ringkas (Ala DOKU) & Integrasi Date Range Picker

#### 1. Masukan & Arahan Pengguna (User Request & Approval)
* Pengguna meminta penyederhanaan konsep notifikasi:
  - *"sepertinya konsep notifikasi perlu kita rubah. untuk sekarang sepertinya saya ingin hanya menampilkan terkait status pembayaran dari langganan, lalu verifikasi bisnis, outlet berhasil dibuat, pambayaran langganan berhasil, intinya tentang log notifikasi yang tidak perlu ribet, cukup itu saja."*
  - *"dan saya ingin notifikasi ini simple saja, saya berikan contoh pada doku. disana terkait business approval. sepertinya untuk sekarang hapus kategori, dan berikan filter untuk range tanggal saja. saya ingin tampilan date picker sesuai dengan standar menuin seperti yang ada di report & analytics."*

#### 2. Keputusan Arsitektur & Perubahan Desain
1. **Penyederhanaan Tampilan (Eliminasi Tab Kategori):**
   - Menghapus tab/pill kategori (`ALL`, `VERIFICATION`, `BILLING`, dll.) dari halaman utama `/notifications`.
   - Mengubah judul menjadi **"Log Notifikasi"** dengan subjudul *"Lihat semua notifikasi Anda dan update terbaru"*.
   - Mengadopsi struktur baris log DOKU:
     - Header baris: `[Label Konteks] • [Tanggal & Waktu WIB]`.
     - Baris utama: Judul tebal di kiri dan tautan aksi langsung `Lihat Detail ↗` di kanan.
     - Deskripsi log ringkas dan padat.
     - Unread state: berlatar belakang lembut `bg-blue-50/30` dengan indikator badge biru muda, sedangkan read state berlatar putih murni `bg-white`.
2. **Date Range Picker Standar Menuin (Report & Analytics):**
   - Mengintegrasikan Popover Date Range Picker menggunakan `react-day-picker` (`mode="range"`), lokalisasi bahasa Indonesia (`date-fns/locale/id`), dan preset cepat: *Semua*, *Hari Ini*, *7 Hari*, *Bulan Ini*, *Bulan Lalu*.
   - Filter diteruskan ke server action melalui parameter `startDate` dan `endDate` dengan batasan awal hari (00:00:00) dan akhir hari (23:59:59).
3. **Penyelarasan Server Action & Pembersihan Database (Database Purge):**
   - Menghapus data notifikasi usang/lama (seperti promosi dan rekap shift) dari database PostgreSQL tenant.
   - Mengisi ulang hanya dengan data log bisnis esensial:
     1. *Status verifikasi data terbaru* (Verifikasi Usaha)
     2. *Data registrasi Anda belum dapat diverifikasi* (Verifikasi Usaha)
     3. *Pembayaran langganan berhasil* (Status Pembayaran)
     4. *Outlet berhasil dibuat* (Pembaruan Toko)
     5. *Pengingat pembayaran langganan* (Status Pembayaran)
     6. *Perubahan data telah disetujui* (Verifikasi Usaha)
4. **Penyederhanaan Ekstrem Antarmuka (Exact DOKU Layout):**
   - Menghapus tombol-tombol tambahan yang membingungkan (*Bersihkan yang dibaca*, *Belum dibaca saja*).
   - Menghilangkan ikon lingkaran (*circle icons*) pada setiap kartu log, sehingga bentuknya berupa baris datar (*flat row*) yang dipisahkan garis pembatas halus dalam satu kontainer putih bersih.
   - Menggunakan highlight warna unread `#FFF4F3` persis seperti DOKU dengan tautan aksi di sisi kanan.

---

### [2026-11-09] - Penyesuaian Standar Desain Menuin Neumorphism & Desain Popover Image 2

#### 1. Masukan & Arahan Pengguna (User Request)
* Pengguna menginstruksikan koreksi gaya antarmuka:
  - Halaman penuh notifikasi (`/outlet/[outletKey]/notifications`) dikembalikan sepenuhnya ke **standar desain Menuin Neumorphism** murni: kartu putih murni tanpa border (`border-none`), bayangan multi-stop diffuse (`shadow-[0_4px_24px_rgba(160,175,200,0.14)]`), aksen biru Menuin `#0e59f9`, font-semibold ceiling, sentence-case, dan zero elemen merah/pink DOKU.
  - Pop-up notification (`NotificationPopover`) diubah persis mengikuti desain **Image 2**:
    1. Filter pills: *Semua*, *Belum dibaca*, *Verifikasi*, *Langganan*.
    2. Titik indikator unread (bullet dot) biru/purple di sisi kiri.
    3. Circular avatar badge dengan ikon konteks (Verifikasi: ShieldCheck, Billing: CreditCard, Outlet: Store).
    4. Tanggal notifikasi di pojok kanan bawah setiap item (*Hari ini, 14:30*, *Kemarin, 09:15*, *25 Okt, 10:15*).
    5. **Hapus seluruh teks merah** (tidak boleh ada link/teks merah). Klik langsung menavigasi ke rute tujuan.

#### 2. Tindakan yang Telah Dilakukan
1. **Refactoring `NotificationPopover` (`apps/web/src/components/layout/notification-popover.tsx`):**
   - Header popover dilengkapi filter pills reaktif (*Semua*, *Belum dibaca*, *Verifikasi*, *Langganan*).
   - Format baris item: avatar ikon lingkaran diposisikan sepenuhnya rata kiri (*flushed to the left*), indikator titik biru (*blue dot*) dihilangkan sesuai masukan pengguna, judul, pesan singkat, context badge di kiri bawah, dan timestamp tanggal di kanan bawah.
   - Pembeda status *unread* menggunakan *subtle soft tint* (`bg-blue-50/20`) dan bobot teks yang lebih tegas (`font-bold text-slate-950`), menjaga perataan vertikal seluruh elemen tetap rapi dan konsisten.
   - Semua teks merah dieliminasi total.
2. **Refactoring `NotificationsClient` (`apps/web/src/app/outlet/[outletKey]/notifications/notifications-client.tsx`):**
   - Menggantikan border kaku dan latar pink DOKU dengan kontainer `bg-white rounded-3xl shadow-[0_4px_24px_rgba(160,175,200,0.14)] border-none divide-y divide-slate-100/80`.
   - Tombol raised tactile neumorphic: Date range picker dan tombol *Tandai semua sudah dibaca* berbentuk kapsul `rounded-full` dengan soft-shadow `[0_2px_10px_rgba(160,175,200,0.22)] border-none`.
   - Warna aksen tautan menggunakan Menuin Blue `#0e59f9` (bebas warna merah).
3. **Database Cleansing:**
   - Database tenant aktif telah dibersihkan dari row dummy lama (promo/shift) dan digantikan 6 log bisnis resmi (Verifikasi Usaha, Status Pembayaran, Pembaruan Toko).
4. **Verifikasi Teknis:**
   - `npx tsc --noEmit` lolos tanpa error (0 error).

- **Penggantian Hyperlink "Tandai Semua Dibaca" dengan Tombol Ikon Centang Hijau:**
  - Teks hyperlink biru `Tandai semua dibaca` di header popover diubah menjadi tombol ikon centang hijau (`Check stroke-[2.5] text-emerald-600`) berlatar lingkaran lembut `bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white` dengan efek *glow soft shadow*. Saat di-*hover*, latar belakang berubah menjadi hijau emerald solid dan ikon centang berubah menjadi putih bersih.
  - Ketika seluruh notifikasi telah dibaca, tombol bertransisi lembut menjadi ikon centang abu-abu pasif (`bg-slate-50 text-slate-300`) sehingga tata letak tetap stabil dan rapi.
  - Tombol aksi pada halaman utama (`notifications-client.tsx`) diselaraskan dengan ikon centang hijau yang sama.
