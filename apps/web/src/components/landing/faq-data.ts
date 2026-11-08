interface FAQItem {
  question: string;
  answer: string;
}

export const faqData: FAQItem[] = [
  {
    question: 'Apakah pelanggan harus mengunduh aplikasi untuk memesan?',
    answer:
      'Tidak. Pelanggan cukup mengarahkan kamera ponsel ke kode QR di meja, dan menu digital langsung terbuka di browser mereka. Tidak ada aplikasi yang perlu dipasang dan tidak ada pendaftaran akun.',
  },
  {
    question: 'Bisakah Menuin dipakai dengan printer kasir yang sudah saya miliki?',
    answer:
      'Bisa, selama printer termal Anda memakai koneksi Bluetooth atau jaringan LAN/WiFi dengan kertas 58 mm atau 80 mm. Struk tamu dan tiket dapur bisa dicetak otomatis.',
  },
  {
    question: 'Bagaimana jika pelanggan ingin membayar tunai di kasir?',
    answer:
      'Tamu bebas memilih. Mereka dapat memesan lewat QR lalu membayar tunai di kasir, atau kasir yang menginput pesanan langsung lewat POS Menuin.',
  },
  {
    question: 'Apakah ada batasan jumlah menu atau transaksi harian?',
    answer:
      'Tidak ada batasan jumlah menu maupun jumlah transaksi pada paket Pro. Biaya berlangganan dihitung per outlet per bulan, bukan per transaksi.',
  },
  {
    question: 'Bagaimana dana dari pembayaran QRIS dicairkan?',
    answer:
      'Pembayaran online diproses melalui DOKU sebagai penyelenggara jasa pembayaran berizin Bank Indonesia, lalu diteruskan ke rekening bisnis Anda mengikuti jadwal settlement DOKU.',
  },
  {
    question: 'Apakah saya perlu membeli iPad atau perangkat khusus?',
    answer:
      'Tidak. Menuin berjalan di perangkat apa pun dengan browser modern: tablet Android, iPad, laptop, maupun ponsel. Tidak ada hardware proprietary yang wajib dibeli.',
  },
  {
    question: 'Bagaimana hak akses kasir, manajer, dan pemilik dipisahkan?',
    answer:
      'Setiap anggota tim diberi peran: Owner, Manajer, atau Kasir. Data keuangan dan pengaturan sensitif hanya terbuka untuk peran yang berhak, dan setiap pembatalan transaksi wajib disertai alasan sehingga tetap bisa ditelusuri.',
  },
  {
    question: 'Bisakah berhenti berlangganan kapan saja?',
    answer:
      'Bisa. Paket bulanan diperpanjang tiap bulan tanpa kontrak, jadi bisa dihentikan kapan pun tanpa biaya penalti. Paket tahunan berlaku sampai masa langganannya habis. Anda juga bisa menaikkan atau menurunkan paket kapan saja.',
  },
];

