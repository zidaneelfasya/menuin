export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}

export function parseCurrencyInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

export function formatDate(dateString: Date | string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatPaymentMethodLabel(method?: string | null): string {
  if (!method) return 'Tunai';
  const clean = method.trim().toUpperCase();
  switch (clean) {
    case 'CASH':
    case 'TUNAI':
      return 'Tunai';
    case 'QRIS_STATIC':
      return 'QRIS Statis';
    case 'QRIS_DYNAMIC':
      return 'QRIS Dinamis';
    case 'QRIS':
      return 'QRIS';
    case 'CARD':
    case 'EDC':
    case 'DEBIT':
    case 'DEBIT_CARD':
      return 'Kartu Debit';
    case 'CREDIT':
    case 'CREDIT_CARD':
      return 'Kartu Kredit';
    case 'TRANSFER':
    case 'BANK_TRANSFER':
      return 'Transfer Bank';
    case 'ONLINE':
      return 'Online Payment';
    default:
      return method.replace(/_/g, ' ');
  }
}

export function formatOrderTypeLabel(orderType?: string | null): string {
  if (!orderType) return 'Makan di Tempat';
  const clean = orderType.trim().toUpperCase();
  switch (clean) {
    case 'DINE_IN':
    case 'DINEIN':
      return 'Makan di Tempat';
    case 'TAKEAWAY':
    case 'TAKE_AWAY':
      return 'Bawa Pulang';
    case 'DELIVERY':
    case 'DELIV':
      return 'Pesan Antar';
    case 'GRABFOOD':
    case 'GRAB_FOOD':
      return 'GrabFood';
    case 'GOFOOD':
    case 'GO_FOOD':
      return 'GoFood';
    case 'SHOPEEFOOD':
    case 'SHOPEE_FOOD':
      return 'ShopeeFood';
    default:
      return orderType.replace(/_/g, ' ');
  }
}

export function formatOrderSourceLabel(source?: string | null): string {
  if (!source) return 'POS Kasir';
  const clean = source.trim().toUpperCase();
  switch (clean) {
    case 'POS':
    case 'POS_CASHIER':
      return 'POS Kasir';
    case 'ONLINE':
    case 'WEB_ORDER':
    case 'STOREFRONT':
    case 'QR':
      return 'Self Order QR';
    default:
      return source.replace(/_/g, ' ');
  }
}

export function isPaymentGatewayMethod(method?: string | null, source?: string | null): boolean {
  if (!method) return false;
  const clean = method.trim().toUpperCase();
  if (clean === 'QRIS_DYNAMIC' || clean === 'ONLINE' || clean === 'MIDTRANS' || clean === 'DOKU') return true;
  if ((source === 'QR' || source === 'WEB_ORDER' || source === 'ONLINE') && clean !== 'CASH' && clean !== 'TUNAI') return true;
  return false;
}

