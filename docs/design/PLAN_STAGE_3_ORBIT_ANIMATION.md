# Implementation Plan: 3-Body Clockwise Orbit Levitation & Revised Ground Layout

> **Target**: [`apps/web/src/components/landing/hero-3d-scene.tsx`](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/components/landing/hero-3d-scene.tsx)  
> **Source of Truth**: [`docs/design/HERO_3D_SCENE_SOURCE_OF_TRUTH.md`](file:///home/zidaneelfasya/D/Github/menuin/docs/design/HERO_3D_SCENE_SOURCE_OF_TRUTH.md)

---

## 1. Analisis & Pemahaman Mendalam (Reverse Engineering Bersus)

Berdasarkan analisis frame-by-frame dari 5 gambar tangkapan layar Bersus (`media_1793256443814.png` s/d `media_1793256443848.png`) dan kode bundle R3F Bersus (`brs-module-r3f-mainpage/assets/js/app/main.js`):

```
[Stage 1 & 2: Tergeletak di Lantai]
              [Logo menuin. (Z = -0.05)]
                     
       [HP di Belakang (Z = -0.45)]
   
[iPad di Kiri (Z = +0.40)]        [Laptop di Kanan Depan (Z = +0.45, Serong)]
-----------------------------------------------------------------------------
                              LANTAI (Y = -0.350)
```

### Mekanisme Gerak Tahap 3 (Scroll Progress $0.22 \to 0.44$):
1. **Pelepasan dari Lantai (Lift-Off)**:
   - Ketiga perangkat melepaskan diri dari lantai $Y = -0.350$, bayangan kontak meredup secara mulus.
2. **Revolusi Orbit Bersama (Clockwise — Searah Jarum Jam)**:
   - Ketiga perangkat terikat dalam formasi 3-titik ($120^\circ$ phase interval) mengitari pusat orbit yang berada **sedikit di depan logo `menuin.`** ($Z_{center} \approx +0.10$).
   - Arah orbit: **Searah Jarum Jam (Clockwise)** saat diproyeksikan di bidang $XZ$ (Kanan $\to$ Belakang $\to$ Kiri $\to$ Depan $\to$ Kanan).
   - Radius orbit dijaga kompak ($R_x \approx 0.65 - 0.75$, $R_z \approx 0.40 - 0.50$) sehingga gerakannya melintas anggun memotong bidang huruf `menuin.` tanpa terpental keluar dari viewport layar.
3. **Rotasi Mandiri pada Poros Perangkat (Counter-Clockwise Self-Tumbling)**:
   - Sementara orbit sistem berputar searah jarum jam, **setiap device berputar pada poros lokalnya berlawanan arah jarum jam (Counter-Clockwise)**.
   - **Kurva Kecepatan Non-Konstan (Akselerasi)**:
     - Di awal pengangkatan ($u \in [0.0, 0.3]$): Rotasi lokal berputar sangat lambat (memperlihatkan momen inersia pelepasan gravitasi).
     - Di tengah orbit ($u \in [0.3, 0.8]$): Kecepatan putaran lokal berakselerasi mengikuti momentum orbit yang meluncur kencang di depan logo.
     - Di akhir orbit ($u \in [0.8, 1.0]$): Rotasi melambat secara anggun (*hermite ease-out*) dan terkunci (*settle*) tepat pada sudut showcase Tahap 3 yang menghadap kamera.
4. **Zero Shaking / Zero Vibration**:
   - Kamera dan objek 100% stabil, tenang, dan berwibawa (tidak ada kamera bergetar atau partikel pecah).

---

## 2. Tata Letak Baru (Ground Layout Stage 1 & Stage 2)

Sesuai instruksi koreksi urutan tata letak:

| Perangkat | Posisi $Z$-Depth | Posisi $[X, Y, Z]$ di Lantai | Sudut Orientasi di Lantai | Visual & Peran |
|---|---|---|---|---|
| **HP (iPhone 14 Pro Max)** | **Belakang** ($Z < 0$) | `[+0.18, -0.3447, -0.45]` | `Euler(0, 0.22, 0, 'YXZ')` | Tergeletak di belakang logo `menuin.` (seperti posisi bidak Kuda di Bersus). |
| **Laptop (MacBook Pro)** | **Kanan Depan** ($X > 0, Z > 0$) | `[+0.68, -0.3500, +0.45]` | `Euler(0, -0.58, 0, 'YXZ')` | Terbuka di depan kanan, **serong menghadap diagonal ke arah kamera**, memperlihatkan layar dashboard putih dan keyboard. |
| **iPad Pro (Tablet)** | **Kiri Depan** ($X < 0, Z > 0$) | `[-0.72, -0.3429, +0.40]` | `Euler(-Math.PI / 2, 0.25, 0, 'YXZ')` | Tergeletak rata di depan kiri dengan layar biru menghadap ke atas. |

---

## 3. Matematika Kurva Orbit & Akselerasi Rotasi (Stage 3)

Didefinisikan parameter transisi normalisasi $u \in [0, 1]$ pada scroll progress $0.22 \to 0.44$:
$$u = \frac{\text{progress} - 0.22}{0.22}$$

### 3.1. Kurva Elevasi & Radius Orbit:
- Elevasi vertikal:
  $$Y_{center}(u) = \text{lerp}(-0.35, +0.12, \text{smoothstep}(u))$$
- Radius orbit elips (kompak di depan teks):
  $$R_x(u) = 0.72, \quad R_z(u) = 0.42, \quad Z_{center} = +0.10$$

### 3.2. Lintasan Orbit Searah Jarum Jam (Clockwise):
Fase awal masing-masing perangkat pada lingkaran orbit:
- **Laptop (Kanan Depan)**: $\theta_0 \approx -\pi / 6$ ($-30^\circ$)
- **iPad (Kiri Depan)**: $\theta_0 \approx -5\pi / 6$ ($-150^\circ$)
- **HP (Belakang)**: $\theta_0 \approx +\pi / 2$ ($+90^\circ$)

Perputaran sudut orbit searah jarum jam sejauh $\Delta \theta = -\pi$ ($-180^\circ$):
$$\theta_k(u) = \theta_{0,k} - \Delta \theta \cdot \text{smoothstep}(u)$$

$$X_k(u) = R_x(u) \cdot \cos(\theta_k(u))$$
$$Z_k(u) = Z_{center} + R_z(u) \cdot \sin(\theta_k(u))$$

### 3.3. Kurva Akselerasi Rotasi Mandiri (Counter-Clockwise Spin):
Untuk menghasilkan efek "lambat di awal $\to$ bertambah cepat $\to$ mendarat presisi di akhir":
- Fungsi fase rotasi akselerasi:
  $$w(u) = u^{2.5} \cdot (1 + 0.4 \cdot (1 - u))$$
- Sudut rotasi lokal berlawanan arah jarum jam ($+ \text{angle}$ pada sumbu lokal):
  $$\text{Spin}_k(u) = \text{qGround}_k \xrightarrow{\text{slerp}} \text{qSpin}_k(w(u)) \xrightarrow{\text{slerp}} \text{qFloat}_k$$
- Hasilnya: Perangkat mulai mengangkat perlahan, lalu berputar cepat saat melintasi depan logo `menuin.`, kemudian memperlambat putarannya secara halus tepat pada posisi melayang Tahap 3.

---

## 4. Alur Integrasi Tahap 4 s/d Tahap 6

1. **Tahap 4 ($0.44 \to 0.64$)**:
   - Setelah orbit selesai di Tahap 3, kamera melakukan **Pan & Dolly-in ke objek di kiri (iPad)** di `[-0.56, 0.26, 1.45]`.
2. **Tahap 5 ($0.64 \to 0.84$)**:
   - Kamera melakukan **Whip-pan ke objek di kanan (Laptop/MacBook)** di `[0.62, 0.24, 1.55]`.
3. **Tahap 6 ($0.84 \to 1.00$)**:
   - Kamera kembali mundur ke **Master Center Shot** merangkul seluruh ekosistem di `[0, 0.56, 2.85]`.

---

## 5. Rencana Eksekusi & Langkah Berikutnya

1. **File yang Dimodifikasi**:
   - [`apps/web/src/components/landing/hero-3d-scene.tsx`](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/components/landing/hero-3d-scene.tsx):
     - Memperbarui koordinat ground Stage 1 & 2 (HP belakang, Laptop kanan-depan serong, iPad kiri).
     - Mengimplementasikan fungsi orbit parametrik 3-bodi Clockwise di `SceneContent` / masing-masing komponen satelit.
     - Mengimplementasikan kurva akselerasi Counter-Clockwise self-tumbling pada masing-masing device.
     - Menyesuaikan posisi ContactShadows agar tetap menempel di lantai saat ground dan memudar saat terangkat.
2. **Verifikasi Teknis**:
   - Menjalankan `tsc --noEmit` untuk memastikan 0 type/compilation error.
   - Menguji kelancaran matematis proyeksi orbit 3D dengan node test script.
3. **Pembaruan Dokumentasi**:
   - Mendokumentasikan persamaan parametrik orbit dan kurva akselerasi ke [`docs/design/HERO_3D_SCENE_SOURCE_OF_TRUTH.md`](file:///home/zidaneelfasya/D/Github/menuin/docs/design/HERO_3D_SCENE_SOURCE_OF_TRUTH.md).
