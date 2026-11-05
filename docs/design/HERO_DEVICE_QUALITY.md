# Kualitas model perangkat hero landing-experiment

Pembaruan: 2 November 2026. Scope: tampilan dan biaya aset tiga perangkat di hero.

## Perubahan visual

- iPhone memakai model iPhone 17 Pro Max Silver yang sudah dibuat untuk Device Story. Adaptasi sumbu dan ukuran diterapkan pada root internal model: layar menghadap +Y dan bagian atas menuju -Z, mengikuti kontrak hero lama. Parent animasi tetap menggunakan skala 1,35 dan konfigurasi orbit lama.
- Laptop mempertahankan dimensi, layar dan `Display_Hinge_Pivot`. Aluminium, trackpad, keycap hitam, keyboard well, speaker, port, karet, bezel dan logo memiliki material sendiri. Label tombol ditambahkan sebagai satu mesh gabungan.
- iPad mempertahankan dimensi dan UV layar. Bodi aluminium space black, bezel, kaca kamera, ring, flash, antena dan smart connector mempertahankan material masing-masing.
- Normal permukaan laptop/iPad dirapikan dengan weighted normals. Mesh kecil digabung menurut material dan assembly; seluruh bagian layar laptop tetap anak dari engsel yang sama.
- Reflection map studio 128px dibuat sekali dan hanya dipasang pada material perangkat. Pencahayaan panggung, logo, background dan bayangan memakai kode semula. Material lensa tidak memakai transmission pass.
- Wallpaper dan waktu reveal siluet tetap sama. Material hasil clone bersifat lokal untuk hero, sehingga aset iPhone yang dipakai Device Story tidak dimutasi.

## Anggaran aset aktual

| Aset | GLB sebelum → sesudah | Mesh sebelum → sesudah | Segitiga sebelum → sesudah |
| --- | --- | --- | --- |
| Laptop | 809.500 → 295.996 byte | 96 → 14 | 54.024 → 30.683 |
| iPhone | 109.160 → 331.944 byte | 28 → 12 | 4.490 → 18.638 |
| iPad | 365.764 → 163.260 byte | 54 → 12 | 5.770 → 5.770 |
| Total perangkat | 1.284.424 → 791.200 byte | 178 → 38 | 64.284 → 55.091 |

iPhone lebih detail dan lebih besar daripada aset iPhone 14 lama. Optimasi laptop/iPad membuat total transfer GLB turun sekitar 38%, jumlah mesh turun sekitar 79%, dan segitiga turun sekitar 14%. Ini ukuran aset dan kelompok render utama, bukan pengukuran FPS; shadow pass menambah render calls.

## Berkas

- Integrasi: `apps/web/src/components/landing/hero-3d-scene.tsx`.
- Material dan reflection map: `apps/web/src/components/landing/hero-device-materials.tsx`.
- Aset hero terpisah: `apps/web/public/hero/3d/macbook_pro_silver_hero.glb` dan `ipad_pro_space_black_hero.glb`.
- Sumber Blender: `assets/3d/macbook_pro_silver_hero.blend` dan `ipad_pro_space_black_hero.blend`.
- Generator: `scripts/assets/refine-hero-devices.py`.
- Validasi: `scripts/assets/verify-hero-devices.mjs`.

File GLB asli tetap tersedia. Model iPhone memakai `iphone_17_pro_max_silver.glb` yang sudah tersedia dan tidak diekspor ulang oleh pembaruan ini.

## Reproduksi dan verifikasi

```bash
blender --background --factory-startup --threads 4 --python scripts/assets/refine-hero-devices.py
node scripts/assets/verify-hero-devices.mjs
node scripts/assets/verify-device-story-model.mjs
```

Generator berjalan dalam proses Blender terpisah. File Blender pengguna yang sedang terbuka tidak diubah.

Verifier membaca GLB dengan `GLTFLoader` dari `three-stdlib` dan MeshoptDecoder. Ia memeriksa posisi dan UV layar, bounds silhouette, posisi dan quaternion engsel, normal geometri, batas biaya aset dan tidak adanya animasi dalam GLB baru. Argumen direktori baseline opsional memeriksa bahwa kode CameraRig, StudioLighting, shadow, wordmark, orbit, magnetic tracking dan scroll controller identik dengan snapshot sebelum perubahan.

## Koreksi sambungan laptop saat zoom

Putaran horizontal camera tracking sebelumnya diterapkan hanya pada layar, sehingga layar menyimpang dari sumbu engsel papan keyboard dan bodi tampak bengkok. Sekarang `MacBook_Rigid_Tracking` menjadi parent bersama bodi dan layar, dengan pusat putaran tepat pada engsel lama. Engsel layar sendiri hanya mempertahankan pitch pembukaannya. Matriks layar, easing yaw, orbit, kamera dan scroll tetap sama; papan keyboard mengikuti layar sebagai assembly kaku. Tidak ada perubahan geometri, ukuran GLB atau tambahan draw call.

Verifier menguji posisi semua mesh saat pemasangan rig, kesamaan lintasan matriks layar dengan implementasi lama, dan transform relatif seluruh bagian laptop untuk yaw maju/mundur hingga kembali nol. Pengecualian baseline dibatasi pada pemindahan penerapan yaw dari layar ke parent bersama, bukan perubahan perhitungan atau timing.

TypeScript dan ESLint terarah lulus; satu warning cleanup ref lama pada `useMagneticDevice3D` tetap ada. Inspeksi browser desktop mencakup silhouette, perangkat menyala, pose melayang, fokus laptop dan fokus iPhone; tidak ditemukan error WebGL. Pengukuran FPS/GPU pada perangkat fisik belum dilakukan. Tata letak dan perilaku responsif lama tetap dipertahankan.
