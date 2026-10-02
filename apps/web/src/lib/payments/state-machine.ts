/**
 * Aturan transisi status pembayaran. Murni (tanpa I/O) agar mudah dites dan
 * dipakai bersama oleh webhook, check-status manual, dan cron rekonsiliasi.
 *
 * Prinsip:
 *  - Status hanya bergerak maju. PAID bersifat final (refund = fase terpisah).
 *  - Uang yang benar-benar masuk selalu menang: SUCCESS dari gateway tetap
 *    dicatat walau attempt sudah EXPIRED/CANCELED di sisi kita, tapi diberi
 *    flag review agar tidak ada pembayaran yang hilang tanpa jejak.
 */

export const ATTEMPT_STATUSES = ['CREATED', 'PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELED'] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

/** Status yang dilaporkan gateway, sudah dinormalisasi. */
export type ProviderOutcome = 'PAID' | 'PENDING' | 'FAILED' | 'EXPIRED';

const ACTIVE_STATUSES: ReadonlySet<AttemptStatus> = new Set(['CREATED', 'PENDING']);
const CLOSED_UNPAID_STATUSES: ReadonlySet<AttemptStatus> = new Set(['FAILED', 'EXPIRED', 'CANCELED']);

export function isActiveAttempt(status: string): boolean {
  return ACTIVE_STATUSES.has(status as AttemptStatus);
}

/** Map `transaction.status` DOKU ke outcome internal. Status tak dikenal → null (abaikan). */
export function mapDokuStatus(status: string | null | undefined): ProviderOutcome | null {
  switch ((status || '').trim().toUpperCase()) {
    case 'SUCCESS':
      return 'PAID';
    case 'PENDING':
      return 'PENDING';
    case 'FAILED':
      return 'FAILED';
    case 'EXPIRED':
      return 'EXPIRED';
    default:
      return null;
  }
}

export type AttemptTransition = {
  next: AttemptStatus;
  changed: boolean;
  /** SUCCESS datang setelah attempt ditutup (expired/canceled/failed) di sisi kita. */
  latePayment: boolean;
};

export function decideAttemptTransition(current: AttemptStatus, outcome: ProviderOutcome): AttemptTransition {
  const stay = { next: current, changed: false, latePayment: false };

  if (current === 'PAID') return stay;

  switch (outcome) {
    case 'PAID':
      return { next: 'PAID', changed: true, latePayment: CLOSED_UNPAID_STATUSES.has(current) };
    case 'FAILED':
    case 'EXPIRED':
      return ACTIVE_STATUSES.has(current) ? { next: outcome, changed: true, latePayment: false } : stay;
    case 'PENDING':
      return current === 'CREATED' ? { next: 'PENDING', changed: true, latePayment: false } : stay;
  }
}

export type ReviewReason =
  | 'LATE_PAYMENT'
  | 'ALREADY_PAID_OTHER_METHOD'
  | 'ORDER_CLOSED_BEFORE_PAYMENT'
  | 'AMOUNT_MISMATCH';

const CLOSED_ORDER_STATUSES = new Set(['CANCELLED', 'CANCELED', 'FAILED', 'REJECTED', 'VOID', 'VOIDED']);

export type OrderSnapshot = {
  status: string;
  paymentStatus: string;
  orderProcessType: string;
  /** POS / ONLINE / QR. Order POS yang lunas langsung masuk dapur (PROCESSING). */
  source?: string | null;
};

export type OrderUpdateOnPaid = {
  /** null = transaksi tidak perlu diubah. */
  update: { paymentStatus: 'PAID'; status: string; paymentMethod: string } | null;
  reviewReason: ReviewReason | null;
};

/** Efek ke tabel transactions ketika sebuah attempt berubah menjadi PAID. */
export function decideOrderUpdateOnPaid(
  order: OrderSnapshot,
  latePayment: boolean,
  /** Metode yang dicatat saat lunas: ONLINE (Checkout storefront) atau QRIS_DYNAMIC (POS). */
  paidMethod: string = 'ONLINE'
): OrderUpdateOnPaid {
  if (order.paymentStatus === 'PAID') {
    // Sudah dibayar lewat jalur lain (mis. kasir) → pelanggan bayar dua kali.
    return { update: null, reviewReason: 'ALREADY_PAID_OTHER_METHOD' };
  }

  const currentStatus = (order.status || '').toUpperCase();
  if (CLOSED_ORDER_STATUSES.has(currentStatus)) {
    return {
      update: { paymentStatus: 'PAID', status: order.status, paymentMethod: paidMethod },
      reviewReason: 'ORDER_CLOSED_BEFORE_PAYMENT',
    };
  }

  let nextStatus = order.status;
  if (currentStatus === 'PENDING') {
    if ((order.source || '').toUpperCase() === 'POS') nextStatus = 'PROCESSING';
    else nextStatus = order.orderProcessType === 'AUTO' ? 'COMPLETED' : 'NEW';
  }

  return {
    update: { paymentStatus: 'PAID', status: nextStatus, paymentMethod: paidMethod },
    reviewReason: latePayment ? 'LATE_PAYMENT' : null,
  };
}

export type SubscriptionUpdateOnPaid = {
  activate: boolean;
  reviewReason: ReviewReason | null;
};

/** Efek ke tagihan langganan ketika attempt-nya berubah menjadi PAID. */
export function decideSubscriptionOnPaid(invoiceStatus: string, latePayment: boolean): SubscriptionUpdateOnPaid {
  if (invoiceStatus === 'PAID') {
    // Tagihan ini sudah lunas lewat attempt lain → pelanggan bayar dua kali.
    return { activate: false, reviewReason: 'ALREADY_PAID_OTHER_METHOD' };
  }
  if (invoiceStatus === 'CANCELED') {
    // Tagihan dibatalkan (mis. ganti paket) tapi uang tetap masuk: tetap aktifkan.
    return { activate: true, reviewReason: 'LATE_PAYMENT' };
  }
  return { activate: true, reviewReason: latePayment ? 'LATE_PAYMENT' : null };
}
