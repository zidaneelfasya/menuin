# Reverse-engineering plan: perangkat → ekspor

> **Diperbarui:** gunakan [laporan gabungan berbasis pemeriksaan bundle dan aset](PREMOTIO_LAPORAN_GABUNGAN_DAN_IMPLEMENTATION_PLAN.md) sebagai acuan utama. Angka dan dugaan teknis di dokumen awal ini bukan spesifikasi final.

Tanggal analisis: 1 November 2026  
Referensi visual: [premotio.com](https://premotio.com/) dan [rekaman Jam](https://jam.dev/c/8a360bcb-b640-465c-9a3f-711d8bc7f710).

## Keputusan desain

Rekonstruksi untuk Menuin akan mengambil **bahasa gerak dan struktur interaksi** dari referensi—bukan menyalin kode, tekstur, atau identitas visual Premotio. Bagian yang dibuat terdiri atas dua scene yang dipin pada viewport:

1. `DevicesScene`: tiga iPhone 3D masuk, mengorbit, menyisakan satu perangkat, lalu konten di dalam layar perangkat bergerak mengikuti scroll.
2. `ExportScene`: headline, segmented switches, dan preview media yang berubah rasio sambil konten preview tetap hidup.

Kedua scene akan berakhir melalui **fade bersih + entrance konten berikut dari bawah**, sesuai arahan. Efek referensi berupa kartu-kartu yang terlempar ke orbit besar lalu keluar layar **tidak akan dipakai**.

## Bukti dan batas kepastian

| Sumber | Yang dapat dipastikan |
| --- | --- |
| Jam, 43,69 dtk, viewport 1920×993 | Urutan visual, waktu relatif, komposisi desktop, perubahan state, serta exit original ke pricing section. Rekaman tidak memiliki event mouse/keyboard sehingga scroll yang tampak harus dibaca dari perubahan frame, bukan event log. |
| HTML/CSS publik Premotio | Section DOM sesungguhnya bernama `.devices` dan `.export`; keduanya tinggi `100svh`, `overflow:hidden`, mula-mula `visibility:hidden`. Anchor render untuk scene adalah `data-story="devices-phone"` dan `data-story="export-room"`. |
| Bundle publik Premotio | Ada canvas fixed `.story-scene`, scene WebGL, GSAP, dan anchor diukur dengan `getBoundingClientRect()`. Ini mengonfirmasi bahwa render perangkat/ring bukan elemen DOM biasa. Nilai detail di bawah adalah pembacaan perilaku implementasi publik dan frame Jam, bukan API yang harus dipertahankan. |

## Pembacaan scene per scene

### 1. Perkenalan tiga perangkat — sekitar 0:03,5–0:12,0 pada Jam

Kanvas memperlihatkan tiga handset pada garis horizontal: perangkat kiri terutama memperlihatkan punggung/kamera, perangkat tengah frontal, perangkat kanan tiga-perempat dengan konten merah pada layar. Ponsel tengah adalah subjek yang kelak bertahan. Semua objek berada pada background putih yang sama dengan halaman dan navbar tetap di atasnya.

- **0:03,5–0:05,5:** handset membuka pose dari posisi separuh/off-axis ke komposisi triptych. Rotasi tidak seragam sehingga objek terasa bermassa, bukan slide linear.
- **0:06,5–0:09,5:** terjadi warp/kamera menuju pusat: chromatic fringe dan motion blur tampak pada rekaman. Pada implementasi Menuin, gunakan blur ringan berbasis CSS/canvas atau lewati fringe bila anggaran GPU ketat; jangan membuat blur filter pada seluruh halaman.
- **0:10,0–0:12,0:** perangkat kiri/kanan berputar dan menjauh, tengah stabil. Ini bukan tiga elemen yang sekadar `display:none`; kedalaman, yaw, dan skala berubah serempak.

**Model referensi yang terkonfirmasi dari bundle:** progress perangkat dibagi kira-kira menjadi clear 0–0,027; fase warp di pusat sekitar 0,080; pengambilan shot 0,080–0,312; teks devices 0,157–0,191; isi layar/preset sheet 0,200–0,261. Progres tersebut dinormalisasi terhadap scene devices, sehingga jangan diperlakukan sebagai scroll halaman global.

### 2. “On every → device” — sekitar 0:12,5–0:19,5

Setelah dua handset samping tersingkir, iPhone utama berpindah ke pusat. Judul besar muncul di kiri atas, dan dua paragraf muncul di kanan bawah. Keduanya adalah lapisan DOM di atas scene, bukan tekstur yang melekat pada ponsel.

Saat scroll berlanjut, frame ponsel **tetap terkunci**; yang bergeser adalah isi aplikasinya:

1. editor/timeline di bagian atas layar;
2. transisi ke header `Library`;
3. search bar dan grid preset masuk dari bawah;
4. posisi akhirnya menampilkan beberapa kartu preset dalam scroll area di dalam device.

Karakter pentingnya adalah ilusi nested scroll: halaman tidak bergerak selama section masih dipin, tetapi offset UI di dalam clipping screen bertambah. Jadi perangkat tidak boleh dipindahkan secara vertikal untuk mensimulasikan scroll aplikasi.

### 3. Handoff ke “Make it once. → Send it out” — sekitar 0:19,5–0:22,0

Transisi bukan hard cut. Scene devices melemah, lalu area kanan memperkenalkan preview portrait hitam berisi ring carousel. Pada saat yang sama headline di kiri, switch rasio, switch resolusi/FPS, dan copy bawah naik menuju posisi akhir. Empat outline rasio di belakang preview sudah mulai ada saat state masuk—mereka membentuk konteks ukuran output.

### 4. Preview dan perubahan rasio — sekitar 0:22,0–0:31,5

Tiga sistem bergerak dengan satu progress scroll:

| Sistem | Perilaku yang diamati |
| --- | --- |
| Switch rasio | Active pill berpindah bertahap `9:16 → 1:1 → 16:9`; bukan kontrol interaktif dalam rekaman. |
| Wadah preview | Tinggi/lebarnya bermorf dari portrait ke square lalu landscape. Sudut membulat mempertahankan ukuran optik yang wajar. |
| Isi preview | Ring kartu terus berputar sendiri sambil rasio wadah berubah. Konten tidak di-stretch bersama wadah; ia dirender/dicrop di viewport baru. |
| Outline output | Outline square dan landscape tetap sebagai frame putus-putus, diskalakan lalu dimask di sekitar viewport aktif supaya tidak menyeberang preview. |

Di referensi publik, ratio state bergerak pada indeks diskrit `2 → 3 → 5` di array `3:4, 4:5, 9:16, 1:1, 4:3, 16:9`. Preview ring menggunakan 22 kartu dan laju fase berkelanjutan. Artefak ini menjelaskan mengapa pergantian rasio tampak sinkron, namun strip gambar tetap memiliki gerak sendiri.

### 5. Exit original versus exit Menuin — sekitar 0:31,5–0:34,5

**Original:** kartu pada ring dilepas satu per satu dan terbang membesar ke seluruh viewport. Preview berubah abu-abu sesaat; headline, switch, copy, dan shape memudar. Baru kemudian section pricing datang dari bawah.

**Target Menuin:** hapus seluruh outbound-card orbit. Dalam rentang scroll pendek, panel preview, outline, switch, headline, dan copy menghilang bersama dalam fade/blur yang terukur. Background tidak bergerak. Pada waktu yang sama, konten section berikutnya dimasukkan dari bawah sampai mengambil viewport. Hasilnya terasa seperti panel panggung berganti, bukan halaman meluncur.

## Arsitektur implementasi yang direkomendasikan

### Komponen dan kepemilikan state

```text
MenuinDeviceExportStory (client boundary)
├── ScrollDriver                  # satu sumber `progress` yang di-clamp
├── StickyStage                   # tinggi 100dvh; tidak mengubah body scroll
│   ├── DeviceCanvas              # R3F: handset, bahan layar, kamera
│   ├── DeviceDomOverlay          # judul dan copy “device”
│   ├── ExportCanvas              # R3F/Canvas2D: ring media, clipping preview
│   └── ExportDomOverlay          # headline, switches, copy, outline
└── FollowingSectionEntrance      # DOM normal, translateY + opacity dari bawah
```

- Buat wrapper story setinggi **500–650vh** untuk desktop. Di dalamnya gunakan satu `position:sticky; top:0; height:100dvh`; browser tetap memiliki scroll range nyata dan deep-link/aksesibilitas tidak rusak.
- `ScrollDriver` menghitung `rawProgress = (scrollY - storyTop) / (storyHeight - viewportHeight)` dan memetakan ke named ranges. Jangan menyebarkan wheel listener yang mencegat scroll seperti implementasi hero lama.
- Gunakan satu `requestAnimationFrame` untuk menyetel state visual. GSAP `quickSetter`/timeline boleh dipakai untuk DOM overlay, tetapi jangan membuat tween baru pada setiap event scroll.
- Semua angka state disimpan sebagai token bernama, bukan angka anonim di JSX. Contoh: `DEVICE_WARP`, `DEVICE_COPY_IN`, `PHONE_INNER_SCROLL`, `EXPORT_RATIO_SQUARE`, `EXPORT_EXIT`.

### Pemilihan teknologi

- Gunakan `@react-three/fiber`/Three yang sudah dipakai oleh [`hero-3d-scene.tsx`](../../apps/web/src/components/landing/hero-3d-scene.tsx) untuk handset dan ring, sehingga aset GLTF/material/camera tetap dalam stack yang sama.
- Gunakan DOM untuk judul, body copy, segmented control, dan outline. DOM menjaga teks tajam, selectable, responsif, serta aksesibel.
- Gunakan `RenderTarget` atau material dengan texture atlas/HTML snapshot untuk layar ponsel. Untuk scope awal, isi layar dapat berupa texture/video mockup tersendiri; jangan mencoba merender aplikasi Menuin aktual ke dalam WebGL pada tahap pertama.
- Render ring di scene/canvas yang sama dengan masking rect ratio. Jangan mengandalkan `object-fit` pada satu gambar bila ingin kartu terlihat punya depth, perspektif, dan gerak mandiri.

## State machine dan peta scroll yang akan diimplementasikan

Range berikut adalah proposal Menuin, bukan durasi timecode Jam. Semua nilai adalah progress dalam story pinned 0–1.

| State | Range | Perangkat / render | DOM overlay |
| --- | ---: | --- | --- |
| `TRIPTYCH_IN` | 0.00–0.10 | Tiga ponsel masuk ke pose; alpha 0→1; kamera tenang. | Tidak ada. |
| `TRIPTYCH_WARP` | 0.10–0.18 | Dua ponsel melakukan yaw/depth separation; tengah mulai menjadi hero. Opsional radial/chromatic blur lokal. | Tidak ada. |
| `DEVICE_FOCUS` | 0.18–0.29 | Samping keluar ke ±X dan Z; ponsel tengah scale ke target. | Judul kiri dan copy kanan masuk bertahap. |
| `PHONE_INNER_SCROLL` | 0.29–0.48 | Frame handset terkunci. `screenContentOffsetY` bergerak 0→target; timeline berganti Library/grid. | Teks tetap statis. |
| `CROSSFADE_TO_EXPORT` | 0.48–0.58 | Phone opacity 1→0. Preview portrait/ring opacity 0→1. | Devices out; headline/switch export from `y: 56px`, alpha 0→1. |
| `PORTRAIT` | 0.58–0.66 | Preview 9:16; ring berjalan. | 9:16 active. |
| `SQUARE` | 0.66–0.75 | Container morf ke 1:1; ring berlanjut tanpa reset fase. | Pill pindah ke 1:1. |
| `LANDSCAPE` | 0.75–0.87 | Container morf ke 16:9; ring berlanjut; outline landscape mendominasi. | Pill pindah ke 16:9. |
| `FADE_TO_NEXT` | 0.87–1.00 | Semua render export alpha 1→0, scale 1→0,985, blur max 8px; **tanpa scatter/orbit exit**. | Overlay export keluar sedikit ke atas; following content masuk dari bawah (`y: 13dvh → 0`, alpha 0→1). |

### Rumus gerak penting

```ts
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;
```

**Scroll konten internal ponsel**

```ts
const t = smoothstep(range(progress, 0.29, 0.48));
screenContentY = lerp(0, -libraryScrollDistancePx, t);
// Device mesh/world matrix tetap konstan pada interval ini.
```

**Rasio preview tersegmentasi**

```ts
const ratios = [9 / 16, 1, 16 / 9];
const ratioProgress = progress < 0.75
  ? lerp(ratios[0], ratios[1], smoothstep(range(progress, 0.66, 0.75)))
  : lerp(ratios[1], ratios[2], smoothstep(range(progress, 0.75, 0.87)));

const height = stageHeight * 0.58;
const width = height * ratioProgress;
```

**Ring yang independen dari scroll**

```ts
ringPhase += deltaSeconds * RING_RADIANS_PER_SECOND;
// scroll mengubah kamera/clip viewport, bukan `ringPhase`.
```

**Exit pengganti**

```ts
const t = easeOutQuart(range(progress, 0.87, 1));
exportOpacity = 1 - t;
exportScale = 1 - 0.015 * t;
nextSectionY = (1 - smoothstep(range(progress, 0.90, 1))) * 13; // d vh
nextSectionOpacity = smoothstep(range(progress, 0.90, 1));
```

## Detail visual yang harus dipertahankan

- Background halaman `#f5f5f7` / off-white dan foreground hampir hitam; hindari gradient dekoratif di panggung ini.
- Headline desktop besar, tracking rapat, line-height sekitar 0,9. Referensi menggunakan pendekatan Inter Tight; gunakan token font Menuin yang terdekat bila font itu bukan bagian brand.
- Posisi desktop: headline sekitar kolom kiri, preview pada kolom kanan, title device kiri-atas, copy device kanan-bawah. Navbar harus tetap layer paling atas dan tidak ikut blur.
- Segment switch putih berbentuk pill, active state hitam. Statusnya presentasional selama mode scroll; keyboard focus tidak boleh tersandera pada chip yang tidak benar-benar mengubah state pengguna.
- Outline rasio: border dashed 1px, alpha rendah, rounded rect; memakai mask/clip agar garis tidak menembus isi preview.
- Jaga `overflow:hidden`/scissor hanya pada stage dan screen/preview. Jangan mengunci `body`, menonaktifkan scrollbar, atau menghijack navigation selama user membaca section.

## Responsif, aksesibilitas, dan fallback

| Kondisi | Perlakuan |
| --- | --- |
| Desktop ≥ 1024px | Pengalaman penuh: WebGL handset dan ring, sticky storytelling, layout kiri/kanan. |
| Tablet 641–1023px | Satu handset lebih kecil; headline/copy menjadi aliran vertikal yang tidak bertabrakan. Preview di bawah headline, tetap ada morph rasio. |
| Mobile ≤ 640px | Jangan paksakan triptych 3D di layar kecil. Tampilkan satu phone frontal, ring preview lebih kecil, switch dapat wrap; gunakan story range lebih pendek. |
| `prefers-reduced-motion: reduce` | Tidak ada warp, no autonomous ring, no scroll-scrub. Tampilkan state akhir tiap scene sebagai DOM/static image, dengan fade sederhana antar section. |
| WebGL/context gagal | `DeviceCanvas`/`ExportCanvas` diganti visual poster rasio statis dan DOM tetap dapat dibaca. Pastikan section tidak blank. |
| Keyboard/screen reader | Sediakan heading dan copy nyata dalam DOM; canvas `aria-hidden`; focus order masuk langsung ke CTA/konten sesudahnya. |

## Aset dan keputusan yang dibutuhkan dari Anda

Sebelum implementasi produksi, Anda perlu menyediakan atau menyetujui:

1. **Aset device:** satu GLTF iPhone yang lisensinya jelas atau persetujuan untuk menggunakan handset generik buatan sendiri. Jangan gunakan model/tekstur dari Premotio.
2. **Isi layar:** 6–12 screenshot/aset UI Menuin untuk editor dan library. Resolusi portrait minimal 1290×2796 agar tetap tajam di DPR tinggi; atau satu video loop yang dapat dipotong per state.
3. **Media ring:** minimal 12 gambar karya/portfolio Menuin berformat konsisten (direkomendasikan 4:5 atau 3:4), plus izin penggunaan.
4. **Copy final:** pengganti `On every → device`, `Make it once. → Send it out`, dua paragraf per scene, serta tujuan CTA section setelahnya.
5. **Pilihan scope:** apakah device perlu benar-benar iPhone realistis 3D atau boleh menjadi frame 2D/2.5D yang menyerupai produk? Opsi 2.5D jauh lebih ringan dan lebih mudah stabil pada perangkat low-end.

## Urutan implementasi

1. Audit landing page yang aktif dan tentukan slot tempat story masuk tanpa menimpa perubahan user yang sudah ada.
2. Tambahkan `MenuinDeviceExportStory` sebagai client component terisolasi beserta `ScrollDriver`, token range, dan mode reduced-motion.
3. Buat DOM skeleton dan stage sticky terlebih dahulu; verifikasi tinggi scroll, deep-link, resize, dan flow menuju section berikut tanpa canvas.
4. Implementasikan `DeviceCanvas`: pose triptych, fokus satu ponsel, lalu internal-screen scroll dengan clipping yang benar.
5. Implementasikan `ExportCanvas` dan `ExportDomOverlay`: ring phase kontinu, segmented switch sinkron, aspect-ratio morph, serta outline mask.
6. Implementasikan exit pengganti (`FADE_TO_NEXT`) dan pastikan tidak ada kartu yang scatter/keluar orbit.
7. Tambahkan fallback poster, mobile layout, dan reduced-motion.
8. Uji visual pada 1440×900, 1920×993, 1024×768, 768×1024, dan 390×844; uji scroll maju/mundur cepat dan resize di tengah scene.
9. Profile CPU/GPU dan memory texture; kurangi texture size/instance count sebelum menambah efek blur.

## Kriteria selesai / acceptance criteria

- Pada desktop, tiga ponsel muncul dan dua ponsel samping keluar sementara satu perangkat menjadi fokus.
- Pada fase device, scroll mengubah **isi layar**, bukan posisi halaman atau frame iPhone.
- Teks device muncul kiri-atas dan copy kanan-bawah tanpa overlap pada 1440px dan 1920px.
- Saat memasuki export, preview berubah 9:16 → 1:1 → 16:9 dan selected ratio mengikuti; ring tetap bergerak sepanjang perubahan ukuran.
- Tidak ada outbound scatter/orbit kartu setelah preview landscape.
- Background stage tetap stabil; scene export menghilang, lalu text/component section berikut naik dari bawah.
- `prefers-reduced-motion` dan kegagalan WebGL menghasilkan konten yang tetap terbaca dan dapat dinavigasi.
- Tidak ada frame drop berulang saat scroll lambat pada laptop target; lakukan baseline Lighthouse/performance profile sebelum dan sesudah.

## Risiko teknis dan mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Scroll janky karena R3F, GSAP, dan React state saling memicu | Simpan progress pada ref/external store; render Three via `useFrame`; batasi DOM update ke CSS variables/quick setters. |
| Texture layar berat | Atlas/kompres gambar, lazy preload scene berikut, dispose texture saat unmount, batasi DPR canvas pada 1,5–2. |
| Layout shift akibat navbar/responsif | Anchor semua posisi pada stage rect, gunakan `ResizeObserver`, dan evaluasi ulang camera/overlay pada resize. |
| Exit terasa seperti halaman ikut scroll | Pertahankan sticky stage hingga alpha scene = 0 dan entrance next section selesai; baru lepaskan normal document flow. |
| Aset belum siap | Bangun kontrak data dan gunakan poster placeholder berlabel; jangan mengunci animasi pada asset final. |

## Catatan implementasi terhadap kode Menuin saat ini

Repository sudah memiliki fondasi R3F/GSAP pada [`apps/web/src/components/landing/hero-3d-scene.tsx`](../../apps/web/src/components/landing/hero-3d-scene.tsx) dan [`apps/web/src/components/landing/hero-scroll-showcase.tsx`](../../apps/web/src/components/landing/hero-scroll-showcase.tsx). Komponen baru sebaiknya **tidak** memperluas hero tersebut menjadi state machine kedua yang mengunci `body` scroll. Jadikan ini module landing mandiri dengan satu source of truth progress dan integrasikan hanya setelah lokasi section aktif disepakati.

