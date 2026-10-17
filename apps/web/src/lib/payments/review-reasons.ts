/** Penjelasan alasan review untuk ditampilkan ke pemilik outlet (tanpa I/O, aman untuk client). */
export const REVIEW_REASON_INFO: Record<string, { title: string; explanation: string; recommendation: string }> = {
  ALREADY_PAID_OTHER_METHOD: {
    title: 'Pembayaran ganda',
    explanation: 'Pesanan sudah lunas lewat metode lain (mis. kasir), lalu pembayaran online ini juga masuk.',
    recommendation: 'Refund pembayaran online ini ke pelanggan lewat dashboard DOKU, lalu catat refund-nya di sini.',
  },
  LATE_PAYMENT: {
    title: 'Pembayaran setelah sesi ditutup',
    explanation: 'Pelanggan membayar setelah sesi pembayaran kedaluwarsa atau setelah beralih ke bayar di kasir.',
    recommendation: 'Pastikan pelanggan tidak ditagih dua kali di kasir. Jika pesanan dilayani, tandai selesai tanpa refund.',
  },
  ORDER_CLOSED_BEFORE_PAYMENT: {
    title: 'Pesanan sudah dibatalkan',
    explanation: 'Uang masuk untuk pesanan yang sudah dibatalkan/ditolak.',
    recommendation: 'Hubungi pelanggan: layani pesanannya, atau refund lewat dashboard DOKU lalu catat di sini.',
  },
  AMOUNT_MISMATCH: {
    title: 'Nominal tidak cocok',
    explanation: 'Nominal yang dilaporkan DOKU berbeda dari nominal pesanan, sehingga pesanan TIDAK ditandai lunas.',
    recommendation: 'Cek transaksi di dashboard DOKU dan hubungi tim Menuin sebelum mengambil tindakan.',
  },
  SUB_ACCOUNT_MISMATCH: {
    title: 'Akun penerima tidak cocok',
    explanation: 'Notifikasi DOKU menyebut akun penerima yang berbeda dari akun outlet ini.',
    recommendation: 'Jangan layani dulu. Hubungi tim Menuin untuk pengecekan.',
  },
};

export function reviewReasonInfo(reason: string | null | undefined) {
  return (
    (reason && REVIEW_REASON_INFO[reason]) || {
      title: 'Perlu ditinjau',
      explanation: 'Pembayaran ini ditandai sistem untuk dicek manual.',
      recommendation: 'Cek detail transaksi di dashboard DOKU.',
    }
  );
}
