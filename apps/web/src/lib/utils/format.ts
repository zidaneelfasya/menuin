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
      return 'QRIS Statis Toko';
    case 'QRIS_DYNAMIC':
      return 'QRIS Dinamis';
    case 'QRIS':
      return 'QRIS';
    case 'CARD':
    case 'EDC':
    case 'DEBIT':
    case 'CREDIT':
      return 'Kartu EDC';
    case 'TRANSFER':
    case 'BANK_TRANSFER':
      return 'Transfer Bank';
    case 'ONLINE':
      return 'Self QR Online';
    default:
      return method;
  }
}

export function isPaymentGatewayMethod(method?: string | null, source?: string | null): boolean {
  if (!method) return false;
  const clean = method.trim().toUpperCase();
  if (clean === 'QRIS_DYNAMIC' || clean === 'ONLINE' || clean === 'MIDTRANS' || clean === 'DOKU') return true;
  if ((source === 'QR' || source === 'WEB_ORDER' || source === 'ONLINE') && clean !== 'CASH' && clean !== 'TUNAI') return true;
  return false;
}

