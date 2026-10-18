export interface GuidelineItem {
  key: string;
  title: string;
  description?: string;
  sampleType?: 'NIB' | 'NPWP' | 'KTP' | 'BANK' | 'STOREFRONT' | 'CASHIER' | 'NONE';
  points: string[];
  note?: string;
}

export const GUIDELINES_MAP: Record<string, GuidelineItem> = {
  // Step 1: Profil Usaha
  'step-1-default': {
    key: 'step-1-default',
    title: 'Profil Legal Usaha',
    description: 'Data legalitas badan usaha Anda akan ditinjau untuk memastikan kepatuhan regulasi.',
    sampleType: 'NONE',
    points: [
      'Profil usaha dapat digunakan bersama untuk semua cabang outlet Anda.',
      'Siapkan berkas Nomor Induk Berusaha (NIB) dan NPWP badan usaha jika ada.',
      'Estimasi pengisian bagian ini sekitar 2-3 menit.',
    ],
    note: 'Seluruh dokumen harus berstatus resmi dan masih berlaku.',
  },
  'entity_type': {
    key: 'entity_type',
    title: 'Bentuk Entitas Usaha',
    description: 'Pilih bentuk badan hukum atau status kepemilikan usaha Anda.',
    sampleType: 'NONE',
    points: [
      'Perorangan (Individual): Usaha milik pribadi tanpa pemisahan badan hukum.',
      'PT Perorangan: Perseroan Terbatas untuk usaha mikro dan kecil dengan 1 pemegang saham.',
      'PT / CV: Badan usaha berbadan hukum atau persekutuan modal dengan akta notaris.',
      'Yayasan / Koperasi: Organisasi nirlaba atau badan usaha berasas kekeluargaan.',
    ],
  },
  'business_name': {
    key: 'business_name',
    title: 'Nama Legal Usaha',
    description: 'Nama resmi perusahaan sesuai akta pendirian atau NIB.',
    sampleType: 'NONE',
    points: [
      'Gunakan nama badan usaha resmi yang tertera pada dokumen NIB atau Akta.',
      'Untuk usaha perorangan, cantumkan nama pemilik atau nama merek dagang utama Anda.',
      'Hindari singkatan yang tidak tertera pada berkas izin resmi.',
    ],
  },
  'nib': {
    key: 'nib',
    title: 'Dokumen NIB (OSS)',
    description: 'Nomor Induk Berusaha yang diterbitkan oleh sistem OSS Republik Indonesia.',
    sampleType: 'NIB',
    points: [
      'Status NIB Anda harus berstatus "Terbit" (bukan draf permohonan).',
      'Halaman pertama wajib mencantumkan nama badan usaha, alamat domisili, dan nomor kontak.',
      'Halaman lampiran memuat daftar KBLI (Klasifikasi Baku Lapangan Usaha Indonesia).',
      'Pastikan seluruh halaman dokumen terlampir lengkap dalam format PDF atau gambar tajam.',
    ],
    note: 'Format: PDF, JPG, atau PNG. Maksimal 5 MB.',
  },
  'npwp': {
    key: 'npwp',
    title: 'NPWP Badan Usaha',
    description: 'Nomor Pokok Wajib Pajak badan usaha atau penanggung jawab.',
    sampleType: 'NPWP',
    points: [
      'Gunakan format 16 digit NIK/NPWP terbaru sesuai integrasi pajak nasional.',
      'Nama pada kartu NPWP harus selaras dengan nama badan usaha atau nama pemilik.',
      'Pastikan seluruh digit angka dan nama wajib pajak terbaca jelas tanpa blur.',
    ],
    note: 'Format: JPG, PNG, atau PDF. Maksimal 5 MB.',
  },

  // Step 2: Perwakilan Bisnis
  'step-2-default': {
    key: 'step-2-default',
    title: 'Perwakilan Bisnis',
    description: 'Identitas penanggung jawab yang berwenang atas akun Menuin dan pencairan dana.',
    sampleType: 'NONE',
    points: [
      'Perwakilan bisnis adalah pemilik usaha atau direktur utama yang sah.',
      'Data identitas digunakan untuk verifikasi KYC (Know Your Customer) sesuai regulasi perbankan.',
      'Siapkan foto fisik e-KTP asli penanggung jawab.',
    ],
  },
  'pic_name': {
    key: 'pic_name',
    title: 'Nama Penanggung Jawab',
    description: 'Nama lengkap individu yang berwenang menandatangani atau mewakili usaha.',
    sampleType: 'NONE',
    points: [
      'Tuliskan nama lengkap sesuai yang tertera pada e-KTP asli.',
      'Hindari penambahan gelar akademis atau keagamaan kecuali tercetak di e-KTP.',
      'Nama ini akan dicocokkan dengan nama pemilik rekening pencairan.',
    ],
  },
  'pic_nik': {
    key: 'pic_nik',
    title: 'Nomor Induk Kependudukan (NIK)',
    description: 'Nomor identitas kependudukan 16 digit resmi.',
    sampleType: 'NONE',
    points: [
      'Wajib terdiri dari 16 digit angka valid.',
      'Nomor harus sama persis dengan yang tercantum di e-KTP.',
      'Data NIK Anda dienkripsi dan dilindungi dengan standar keamanan fintech.',
    ],
  },
  'pic_contact': {
    key: 'pic_contact',
    title: 'Nomor Telepon / WhatsApp',
    description: 'Kontak aktif penanggung jawab untuk notifikasi dan audit kepatuhan.',
    sampleType: 'NONE',
    points: [
      'Gunakan nomor WhatsApp aktif yang mudah dihubungi.',
      'Tim verifikasi kepatuhan dapat mengirimkan konfirmasi jika terdapat data yang perlu diklarifikasi.',
    ],
  },
  'ktp': {
    key: 'ktp',
    title: 'Foto e-KTP Penanggung Jawab',
    description: 'Dokumen identitas resmi penanggung jawab usaha.',
    sampleType: 'KTP',
    points: [
      'Gunakan e-KTP asli fisik, bukan hasil fotokopi hitam putih atau scan buram.',
      'Pastikan 4 sudut kartu masuk ke dalam frame foto dan tidak terpotong.',
      'NIK, nama lengkap, tanggal lahir, dan foto wajah harus terbaca tajam tanpa pantulan cahaya (glare).',
      'Hindari menutup sebagian informasi KTP dengan jari atau benda lain.',
    ],
    note: 'Format: JPG atau PNG. Maksimal 5 MB.',
  },

  // Step 3: Rekening Settlement
  'step-3-default': {
    key: 'step-3-default',
    title: 'Rekening Settlement Bank',
    description: 'Rekening bank tempat pencairan otomatis seluruh hasil transaksi pembayaran QRIS.',
    sampleType: 'NONE',
    points: [
      'Dana transaksi QRIS dinamis akan dicairkan secara berkala ke rekening ini.',
      'Satu rekening bank dapat dihubungkan ke banyak outlet atau dikhususkan per cabang.',
      'Nama pemilik rekening wajib selaras dengan nama badan usaha atau penanggung jawab.',
    ],
  },
  'bank_account': {
    key: 'bank_account',
    title: 'Nomor & Nama Bank',
    description: 'Nomor rekening bank aktif di Indonesia.',
    sampleType: 'BANK',
    points: [
      'Pilih bank tujuan dari daftar bank terkemuka (BCA, Mandiri, BRI, BNI, BSI, dll).',
      'Masukkan nomor rekening tanpa tanda spasi atau tanda hubung (-).',
      'Pastikan rekening dalam status aktif dan dapat menerima transfer dana harian.',
    ],
  },
  'bank_holder': {
    key: 'bank_holder',
    title: 'Nama Pemilik Rekening',
    description: 'Nama yang tercetak pada buku tabungan atau rekening koran.',
    sampleType: 'BANK',
    points: [
      'Tuliskan nama pemilik rekening persis sesuai buku tabungan.',
      'Untuk PT/CV, rekening disarankan menggunakan rekening atas nama badan usaha.',
      'Untuk perorangan, nama rekening harus cocok dengan nama penanggung jawab.',
      'Sistem akan menghitung skor kecocokan nama secara otomatis.',
    ],
  },
  'bank_proof': {
    key: 'bank_proof',
    title: 'Bukti Rekening Bank',
    description: 'Dokumen bukti kepemilikan rekening tabungan.',
    sampleType: 'BANK',
    points: [
      'Unggah foto halaman depan buku tabungan atau tangkapan layar e-statement mutasi rekening.',
      'Nama bank, nomor rekening, dan nama pemilik rekening harus terlihat jelas.',
      'Saldo dan riwayat transaksi boleh disamarkan demi privasi Anda.',
    ],
    note: 'Format: JPG, PNG, atau PDF. Maksimal 5 MB.',
  },

  // Step 4: Lokasi Gerai
  'step-4-default': {
    key: 'step-4-default',
    title: 'Lokasi & Gerai Fisik',
    description: 'Verifikasi lokasi operasional outlet untuk aktivasi QRIS spesifik cabang.',
    sampleType: 'NONE',
    points: [
      'Setiap cabang outlet baru wajib mengisi data lokasi fisik dan foto gerainya sendiri.',
      'Data ini membuktikan bahwa gerai Anda benar-benar beroperasi dan siap melayani transaksi.',
      'Siapkan link Google Maps dan 2 foto fisik gerai Anda.',
    ],
  },
  'address': {
    key: 'address',
    title: 'Alamat Operasional Gerai',
    description: 'Alamat lengkap tempat gerai Anda beroperasi.',
    sampleType: 'NONE',
    points: [
      'Cantumkan nama jalan, nomor bangunan, RT/RW, kelurahan, dan kecamatan.',
      'Pastikan kota dan kode pos 5 digit terisi dengan benar.',
      'Alamat ini adalah tempat kasir melayani pesanan pelanggan.',
    ],
  },
  'maps': {
    key: 'maps',
    title: 'Titik Lokasi Google Maps',
    description: 'Koordinat lintang dan bujur gerai Anda.',
    sampleType: 'NONE',
    points: [
      'Tempelkan tautan Google Maps gerai Anda, koordinat GPS akan terdeteksi otomatis.',
      'Jika Anda sedang berada di outlet, gunakan tombol "Gunakan Lokasi Saat Ini".',
      'Pastikan pin lokasi tepat berada di bangunan gerai fisik Anda.',
    ],
  },
  'storefront_photo': {
    key: 'storefront_photo',
    title: 'Foto Tampak Depan Gerai',
    description: 'Bukti fisik bagian luar dan fasad gerai Anda.',
    sampleType: 'STOREFRONT',
    points: [
      'Ambil foto pada siang hari dengan pencahayaan terang.',
      'Plang nama gerai atau spanduk merek toko harus terlihat jelas dari luar.',
      'Menampilkan pintu masuk utama gerai secara proporsional.',
      'Hindari foto yang terhalang mobil parkir, tirai tertutup, atau pohon rimbun.',
    ],
    note: 'Format: JPG atau PNG. Maksimal 5 MB.',
  },
  'cashier_photo': {
    key: 'cashier_photo',
    title: 'Foto Area Kasir / POS',
    description: 'Bukti fisik tempat transaksi pembayaran berlangsung.',
    sampleType: 'CASHIER',
    points: [
      'Ambil foto meja kasir tempat pelanggan melakukan pembayaran.',
      'Perangkat kasir (tablet POS, kasir, atau mesin EDC) terlihat di atas meja.',
      'Menunjukkan suasana operasional gerai yang aktif.',
      'Hindari mengunggah foto gudang tertutup atau area dapur belakang.',
    ],
    note: 'Format: JPG atau PNG. Maksimal 5 MB.',
  },

  // Step 5: Review
  'step-5-default': {
    key: 'step-5-default',
    title: 'Review & Konfirmasi',
    description: 'Pemeriksaan akhir seluruh data sebelum dikirimkan ke tim kepatuhan.',
    sampleType: 'NONE',
    points: [
      'Periksa kembali keakuratan seluruh data profil, perwakilan, rekening, dan gerai.',
      'Setelah pengajuan dikirim, data akan masuk antrean verifikasi (estimasi 1 hari kerja).',
      'Transaksi kasir tunai tetap dapat berjalan normal selama proses peninjauan.',
    ],
    note: 'Pastikan mencentang persetujuan syarat dan ketentuan QRIS.',
  },
};
