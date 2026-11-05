# Analisis Jam dan rencana implementasi: perangkat → preview multi-rasio

> **Diperbarui:** gunakan [laporan gabungan berbasis pemeriksaan bundle dan aset](PREMOTIO_LAPORAN_GABUNGAN_DAN_IMPLEMENTATION_PLAN.md) sebagai acuan utama. Laporan itu mengoreksi asumsi tentang loop ring, screen scroll, image sequence, serta status prototipe pada dokumen ini.

Tanggal: 1 November 2026  
Status: **rencana implementasi dan audit awal**, bukan klaim bahwa hasil akhir sudah dibuat atau diuji.  
Referensi: [rekaman Jam](https://jam.dev/c/8a360bcb-b640-465c-9a3f-711d8bc7f710) dan [situs Premotio](https://premotio.com/).

## Ringkasan keputusan

Rekonstruksi terdiri dari satu panggung dengan background tetap: tiga ponsel berputar, dua ponsel samping keluar, ponsel tengah menampilkan perubahan isi layar, lalu scene berganti ke preview yang berubah rasio. Scroll memajukan cerita; ring gambar di preview tetap bergerak seiring waktu, termasuk saat scroll berhenti. Setelah preview selesai, seluruh elemen scene memudar dan **konten section berikutnya yang sebenarnya** naik dari bawah pada background yang sama. Tidak ada kartu yang meledak, terbang, atau membesar keluar layar.

Perlu membedakan *aspect ratio* dengan resolusi: yang pasti berubah pada rekaman adalah bentuk preview dan pilihan rasio `9:16 → 1:1 → 16:9`. Label `4K` dan `60` tampak terpilih pada frame yang diperiksa; perubahan resolusi output aktual atau seleksi 720p/1080p/2K tidak terbukti. Rencana ini mempertahankan ilusi perubahan **bentuk viewport**, tanpa mengklaim bahwa ada file yang diekspor ulang.

## Metode, bukti, dan keterbatasan

- **Jam MCP:** metadata dan frame terpilih dari video 43,69 detik; sistem mencatat layar 1920 × 993, tetapi ukuran viewport halaman dan scroll distance tidak tercatat. Tidak ada rekaman event interaksi, mikrofon, atau chapter. Waktu di bawah adalah waktu playback, **bukan** durasi yang harus dipasang pada animasi scroll.
- **Situs langsung:** diperiksa melalui browser pada viewport 1280 × 720, termasuk observasi visual, struktur DOM, computed style, dan perubahan frame pada posisi scroll yang sama. Data yang terlihat tidak otomatis membuktikan kode sumber asli, formula easing, atau semua detail 3D.
- **Workspace Menuin:** pemeriksaan statis file landing, prototipe yang sudah ada, dependencies, dan aset lokal. Prototipe tidak dijalankan atau diuji visual dalam analisis ini; temuan tentang prototipe adalah pembacaan kode.
- **Tingkat kepastian:** “terlihat” = dibuktikan frame/browser; “usulan” = desain implementasi yang perlu dikalibrasi; hal yang belum terbukti dicantumkan sebagai pertanyaan atau pekerjaan validasi. Jangan memperlakukan angka progress di dokumen sebelumnya sebagai hasil pengukuran baru.

## Storyboard terperinci berdasarkan rekaman

| Waktu Jam ± | Yang terlihat | Implikasi implementasi |
| --- | --- | --- |
| 00:09.0 | Ada shot ponsel nyaris dari samping di tengah dan bentuk besar kabur dengan fringe warna di tepi. | Ada transisi perspektif/blur menuju grup ponsel. Efek distorsi ini opsional karena intensitas dan mekanismenya tidak dapat diukur dari frame saja. |
| 00:10.0–00:11.0 | Tiga handset berjarak horizontal. Tengah frontal menampilkan editor; ponsel samping berputar memperlihatkan sisi depan, sisi samping, dan belakang. | Tiga objek independen, dengan orientasi dan posisi berbeda; pertahankan perspektif dan detail material. Jangan anggap gambar tiga ponsel statis sebagai bukti geometri 3D asli. |
| 00:12.0 | Samping sudah di luar frame; satu ponsel frontal bertahan di tengah. | Animasi keluar kiri/kanan harus kontinu dan dapat dibalik; jangan hide secara mendadak saat masih terlihat. |
| 00:13.0–00:14.5 | Judul besar “On every → device” di kiri atas; copy kecil dua paragraf di kanan bawah; handset tetap dominan di tengah. | Teks adalah lapisan terpisah dari perangkat. Beri ruang aman dari tepi, navbar, dan handset. |
| 00:16.0–00:18.0 | Panel `Library` dengan search dan grid kartu naik menutupi sebagian editor dalam layar; rangka, header, dan navigasi bawah ponsel secara visual tetap. | Buat area layar berklip dengan lapisan UI: chrome tetap, panel naik, lalu isi grid dapat bergeser. Ini lebih spesifik daripada menggeser seluruh screenshot perangkat. |
| 00:19.5 | Ponsel berputar ke sisi/profil; teks sebelumnya sudah hilang. | Handoff tidak sekadar mengganti gambar: gunakan rotasi dan keluarnya objek, bersamaan dengan pengenalan scene berikutnya. Hubungan geometri persis antarobjek belum terbukti. |
| 00:21.0–00:23.0 | Preview hitam portrait di kanan; ring kartu di dalamnya, headline di kiri muncul bertahap, disusul kontrol dan copy. Ada outline tipis di belakang preview. | Pisahkan preview berklip dari UI HTML dan outline; koordinasikan entrance tanpa frame kosong. |
| 00:25.0–00:27.0 | `1:1` terpilih; preview persegi; isi ring berbeda posisinya antarframe. | Rasio dan posisi pill mengikuti scroll; gerak konten jangan di-reset ketika wadah berubah. |
| 00:29.0–00:31.5 | `16:9` terpilih; preview menjadi landscape. Isi kartu terus bergerak. | Jaga proporsi konten tanpa stretching dan koordinat preview tetap di kolom kanan. |
| 00:32.5–00:34.5 | Referensi melepas kartu ke luar preview dan memudarkan elemen; bagian pricing muncul dari bawah. | **Jangan tiru scatter kartu.** Gantikan dengan fade scene sambil konten berikutnya naik di atas background tetap. |

Rentang awal video memperlihatkan keadaan peralihan yang tidak selalu menampilkan tiga handset dengan jelas. Jangan menyimpulkan urutan rinci sebelum 00:09 dari frame yang tersedia tanpa sampling tambahan.

## Temuan dari situs langsung

1. `.story__stage` berukuran satu viewport dan computed `position: sticky; top: 0`; wrapper `.story` menyediakan jarak scroll yang panjang. Pada viewport 1280 × 720 yang diperiksa, stage tetap di `top: 0` saat `scrollY` berada di sekitar 33.120–35.280 px. Ini adalah satu pengalaman panjang untuk **seluruh** cerita Premotio; angka tersebut bukan jarak yang harus disalin untuk section Menuin.
2. Canvas `.story-scene` berukuran viewport dan computed `position: fixed`; `.devices` dan `.export` adalah section DOM dalam stage. Anchor `data-story="devices-phone"` dan `data-story="export-room"` ada di DOM, tetapi implementasi mapping canvas ke anchor belum diverifikasi.
3. Judul dan paragraf berada di DOM, bukan teks yang harus dibakar ke dalam gambar. Judul visual dipecah menjadi line/word/character; state awal yang teramati menggunakan opacity 0 dan transform. Copy dibungkus line mask dan bergerak dari bawah. Versi aksesibel yang tidak dipecah juga ada di DOM.
4. Switch pada section ekspor memiliki enam pilihan rasio dan lapisan pill dengan label terang/gelap. Wadah kontrol yang diamati bertanda `aria-hidden="true"`; ini adalah visual presentasional, bukan bukti bahwa pengunjung dapat mengubah format dengan mengkliknya.
5. Pada scroll yang sama di scene ekspor, dua observasi browser menunjukkan susunan gambar ring berubah tanpa scroll tambahan. Ini mendukung adanya gerak berbasis waktu yang terpisah dari progress scroll. Mekanisme internal renderer dan nilai kecepatan pastinya belum diukur.

## Audit keadaan workspace saat ini

Workspace sudah berisi dokumen rencana dan prototipe **belum terlacak oleh Git**. Keduanya dipertahankan, tidak ditimpa oleh analisis ini.

- Halaman [`/landing-experiment`](../../apps/web/src/app/(marketing)/landing-experiment/page.tsx) merender [`landing-experiment-page.tsx`](../../apps/web/src/components/landing-experiment-page.tsx), yang sudah memasang [`premotio-devices-export-showcase.tsx`](../../apps/web/src/components/landing/premotio-devices-export-showcase.tsx) setelah hero dan sebelum `StepMorphShowcase`.
- Halaman utama [`page.tsx`](../../apps/web/src/app/(marketing)/page.tsx) memakai [`landing-page.tsx`](../../apps/web/src/components/landing-page.tsx), sehingga prototipe eksperimen tidak otomatis muncul di halaman utama.
- Proyek sudah memiliki GSAP, ScrollTrigger, Lenis, Three.js dan React Three Fiber; tidak perlu menambah library sebagai langkah awal. [`smooth-scroll.tsx`](../../apps/web/src/components/landing/smooth-scroll.tsx) sudah menyatukan loop Lenis dan GSAP.
- Model [`iphone_14_pro_max_space_black.glb`](../../apps/web/public/hero/3d/iphone_14_pro_max_space_black.glb) dan beberapa gambar Menuin tersedia. **Keberadaan file tidak membuktikan lisensi atau kecocokan orientasi/mesh layar**; periksa keduanya sebelum memakainya untuk produksi.
- Prototipe sudah memiliki scroll range, tiga instance, ring, state rasio, dan teaser exit. Namun pembacaan kode mengungkap hal yang perlu diverifikasi/diperbaiki:
  1. Canvas ring berada di belakang overlay DOM yang memiliki kotak preview hitam opak. Secara susunan layer, kotak itu berpotensi menutupi ring; clipping WebGL ke bentuk preview juga belum terlihat di kode. Periksa visual lalu gunakan render target/scissor/mask yang benar.
  2. Tekstur layar menggunakan `RepeatWrapping` dan menggeser satu gambar; ini dapat mengulang gambar dan menggerakkan seluruh tampilan. Ini belum merepresentasikan panel `Library` yang naik dengan chrome perangkat tetap.
  3. Rasio dihitung sebagai `height × ratio`, tetapi `maxWidth` bisa membatasi lebar secara terpisah sehingga bentuk aktual meleset. Rasio landscape harus muat ke kotak tersedia dengan kedua dimensi dihitung bersama.
  4. Teaser akhir berada di dalam stage, sedangkan komponen nyata berikutnya adalah `StepMorphShowcase`. Hal ini berpotensi menghasilkan teaser lalu pergantian ke konten berbeda; transisi harus menggunakan konten berikut yang sebenarnya atau handoff yang tidak menggandakannya.
  5. `setStageProgress` berjalan pada update scroll dan CSS transition juga menghaluskan properti; hal ini dapat menghasilkan kerja React berulang dan lag saat scrub/scroll balik. Profil sebelum memilih perbaikan.
  6. Jalur khusus reduced motion, fallback saat WebGL/aset gagal, dan cleanup eksplisit texture/material buatan sendiri belum terlihat. Pastikan juga overlay yang transparan tidak menangkap pointer atau focus.
  7. Komentar tentang fade perangkat dan ring tidak otomatis membuktikan alpha material berubah; kode yang terlihat memakai rotasi/visibility dan skala. Exit harus diuji dalam frame nyata.

Dokumen sebelumnya: [rencana terdahulu](PREMOTIO_DEVICES_EXPORT_REVERSE_ENGINEERING_PLAN.md). Klaim spesifik di sana seperti jumlah kartu atau angka progress internal tidak diverifikasi ulang pada investigasi ini dan tidak dijadikan acceptance criteria.

## Rancangan arsitektur

```text
Story wrapper: scroll range nyata pada dokumen
└─ Sticky stage: 100svh / 100dvh, overflow clip, background tunggal
   ├─ Visual device: tiga phone + screen content terklip
   ├─ Overlay device: heading kiri atas, body kanan bawah
   ├─ Export preview: frame berklip + ring yang terus berjalan
   ├─ Overlay export: heading, pill, copy, outline
   └─ Konten awal section berikutnya: entrance dari bawah
```

- Satu driver membaca progress wrapper (`0–1`) melalui ScrollTrigger, dan satu sumber state visual mengendalikan semua scene. Simpan progress di ref; gunakan timeline/quick setters untuk transform dan opacity. Hindari satu React render per frame bila profiling membuktikan beban berarti.
- Progress scroll memakai scroll dokumen sungguhan: sticky menahan panggung, **bukan** mematikan scroll body atau menangkap wheel secara global. Hasilnya dapat dibalik, mendukung scrollbar, touchpad, keyboard, dan kembali dari deep link.
- Gerak ring memakai waktu (`delta`) secara independen; progress scroll hanya menentukan visibility, pose, transisi, rasio dan mask. Saat panggung offscreen, jeda render/animasi untuk menghemat GPU. Batasi delta setelah tab kembali aktif untuk mencegah lompatan.
- Perangkat dapat memakai R3F dan model lokal setelah mesh, orientasi, serta lisensi diverifikasi. Isi layar paling mudah dikendalikan sebagai UI HTML dalam mask 2D yang terdaftar ke permukaan layar saat device frontal, atau sebagai dynamic texture/canvas. Jika butuh sinkronisasi selama yaw 3D, dynamic texture memberi perspektif yang konsisten; tentukan lewat prototipe kecil, bukan asumsi.
- Preview ring: satu canvas terpisah yang **benar-benar dibatasi wadah** atau render target + mask/scissor. Radius sudut harus ikut clip; gunakan alpha mask atau DOM overflow dengan canvas ditempatkan di dalamnya. Jangan menaruh objek di belakang div hitam opak lalu berharap terlihat.
- Gunakan DOM untuk teks, heading semantik dan outline. Split teks visual bersifat dekoratif (`aria-hidden`) dengan satu salinan teks semantik; jangan duplikasi heading untuk screen reader.

## Peta progress usulan untuk prototipe

Angka berikut titik awal untuk tuning pada perangkat nyata, **bukan** nilai yang diukur dari Premotio. Total scroll range awal sekitar 500–650vh termasuk tinggi stage; sesuaikan dengan durasi rasa scroll, bukan berdasarkan detik video. Jangan menambahkan smoothing CSS terpisah pada properti yang sudah di-scrub.

| Progress | Fase dan state visual |
| --- | --- |
| 0.00–0.12 | Tiga ponsel masuk, pose berbeda. Jaga titik awal konsisten ketika load langsung di tengah story. |
| 0.12–0.24 | Dua ponsel berputar dan bergerak keluar; ponsel tengah menuju pose frontal. Teks mulai muncul mendekati akhir. |
| 0.24–0.31 | Heading kiri atas dan dua paragraf kanan bawah muncul; beri jeda membaca. |
| 0.31–0.47 | Frame utama tetap. Panel Library naik; grid bergerak di dalam mask. Isi ponsel tidak wrap/repeat. |
| 0.47–0.57 | Copy devices memudar, handset yaw menuju profil dan keluar; preview portrait muncul di kanan. Periksa overlap agar tidak ada flash. |
| 0.57–0.65 | Heading dan kontrol export masuk; 9:16 aktif; ring bergerak. |
| 0.65–0.76 | Preview bermorf ke 1:1, pill bergerak; akhir rentang menahan komposisi untuk dibaca. |
| 0.76–0.87 | Preview bermorf ke 16:9, pill bergerak; ring tetap hidup; tahan sebentar. |
| 0.87–1.00 | Fade preview, ring, outline, heading, kontrol, copy. Konten section nyata berikutnya masuk dari bawah di stage dengan background tetap; lepaskan sticky setelah posisinya selaras dengan flow normal. |

Untuk setiap fase gunakan `clamp((p-start)/(end-start), 0, 1)` dan kurva halus yang sama pada pasangan properti yang sinkron. Tentukan dimensi preview berdasarkan ruang kanan `(Wmax,Hmax)` dan rasio `r`: `h = min(Hmax, Wmax/r)`, `w = r*h`. Interpolasi ukuran/rasio antar-keyframe secara terkendali; hitung pill dari posisi elemen target aktual, bukan jarak tetap yang rusak ketika font berubah.

## Rencana transisi akhir yang diminta

1. Setelah landscape terbaca, semua elemen scene export memudar bersama; ring tetap terklip sepanjang fade. Boleh ada pergeseran sangat kecil ke atas, tetapi **tidak** ada scatter, pelebaran orbit, atau kartu keluar viewport.
2. Background stage tidak berpindah atau berubah warna selama overlap. Konten berikutnya masuk dari bawah dengan `translateY` dan opacity mengikuti progress yang sama; headline masuk dahulu, komponen bawah menyusul ringan.
3. Section berikut harus berupa satu konten yang sama sebelum dan sesudah handoff, bukan teaser tiruan disusul duplikat. Putuskan implementasi berdasarkan struktur section: integrasikan entrance dalam wrapper yang sama atau siapkan slot yang dapat diserahkan ke flow tanpa perubahan posisi visual. Hindari memindahkan node DOM imperatif antar-parent React.
4. Di titik pelepasan sticky, bandingkan bounding box dan background pada dua frame bersebelahan, baik scroll maju maupun balik. Tidak boleh ada snap, ruang kosong, judul ganda, atau halaman yang tampak bergeser tiba-tiba.

## Responsif, performa, dan aksesibilitas

- **Desktop:** komposisi triptych dan dua kolom penuh. Uji 1920 × 993, 1440 × 900, 1280 × 720.
- **Tablet/ponsel:** susun ulang headline, ponsel, dan copy agar tidak saling menutupi. Bila tiga handset terlalu kecil atau GPU berat, gunakan versi dengan satu perangkat atau poster, tetapi pertahankan urutan narasi. Uji 768 × 1024 dan 390 × 844, termasuk perubahan orientasi.
- **Reduced motion:** tampilkan versi statis per scene dalam alur normal yang tetap lengkap dan terbaca; hentikan rotasi otomatis dan scrub rumit. Tidak ada konten penting yang hanya muncul setelah animasi.
- **WebGL/aset gagal:** poster ringan dengan teks DOM tetap ada; jangan biarkan canvas kosong atau memblokir halaman. Batasi DPR berdasarkan profiling; compress texture, preload seperlunya, dan dispose resource milik komponen.
- **Kontrol:** jika pill hanya presentasi, jangan diberi perilaku tombol palsu. Jika kelak dibuat interaktif, tambahkan perilaku, focus, nama dan state aksesibel serta definisikan konflik antara klik dan scroll.
- **Navigasi dan cleanup:** tes scroll maju/mundur cepat, resize di tengah, back/forward, refresh pada progress tengah, keyboard, dan lifecycle React Strict Mode. Jangan buat ticker Lenis kedua; bersihkan ScrollTrigger, listener, observer, timeline dan resource yang dimiliki saat unmount.

## Urutan kerja berikutnya

1. Tentukan lokasi integrasi dan konten sesudahnya; snapshot baseline visual prototipe sebelum perubahan. Pertahankan seluruh perubahan workspace yang sudah ada.
2. Buat versi stage tanpa WebGL: uji progress, susunan layer, fade, entrance konten nyata, continuity di batas sticky, dan reverse scroll.
3. Audit model iPhone: mesh layar, bounds, orientasi, material, lisensi. Implementasikan pose tiga ponsel lalu penguncian satu ponsel.
4. Bangun UI dalam layar berlapis dan clipping; gerakkan panel Library/grid dengan progress dan pastikan chrome tetap.
5. Perbaiki preview melalui mask/render target; sambungkan ratio dan pill ke progres yang sama sambil ring mempertahankan phase berbasis waktu.
6. Tambahkan final fade/handoff, responsive layout, reduced motion dan fallback; lakukan visual QA dan performance profile pada viewport yang tercantum.
7. Verifikasi build/lint yang relevan dan uji browser pada rute yang dipilih. Catat deviasi visual dan hasil tes; jangan menyatakan selesai hanya dari pemeriksaan kode.

## Kriteria penerimaan

- Tiga handset terlihat; kiri dan kanan berputar dan keluar layar secara kontinu; tengah stabil saat isi dalamnya bergerak.
- Heading dan copy masuk di posisi yang dapat dibaca tanpa menutupi handset; frame handset dan background tidak bergerak selama fase internal-screen.
- Preview benar-benar berklip ke bentuk portrait, square, landscape; switch menunjukkan `9:16 → 1:1 → 16:9`; ring tidak reset dan tetap bergerak meskipun scroll berhenti.
- Setelah scene akhir, seluruh scene export fade; tidak ada kartu keluar atau orbit membesar. Konten section berikutnya yang sebenarnya naik dari bawah; background tetap dan handoff tidak meloncat, juga saat scroll dibalik.
- Responsif, reduced motion, navigasi keyboard, reload di tengah, dan kegagalan aset/WebGL tetap menghasilkan konten yang berguna. Performance diukur pada perangkat target; tidak ada target FPS numerik yang diklaim tanpa baseline.

## Yang dibutuhkan dari Anda

1. Konfirmasi **rute tujuan**: lanjutkan pada `/landing-experiment` atau pindahkan ke halaman utama.
2. Konfirmasi **section yang muncul setelah fade**: gunakan `StepMorphShowcase` yang saat ini langsung mengikuti prototipe, atau berikan konten/section lain.
3. Tentukan konten dan pesan Menuin untuk dua scene; copy dan pilihan `4K / FPS / MP4` dalam prototipe saat ini masih bersifat demonstrasi dan perlu disesuaikan dengan fitur produk yang benar.
4. Pastikan hak pakai model iPhone dan gambar lokal; jika belum jelas, gunakan aset berlisensi atau handset generik. Berikan screenshot UI Menuin yang ingin ditampilkan jika aset saat ini belum sesuai.
5. Jika penting, tentukan apakah chip rasio hanya animasi presentasi seperti referensi atau benar-benar bisa diklik. Default rencana: presentasi yang mengikuti scroll.
