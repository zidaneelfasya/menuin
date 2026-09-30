import { getDokuConfig } from './doku/config';

/**
 * Apakah storefront boleh menawarkan pembayaran online untuk tenant ini:
 * toggle outlet aktif, kredensial platform DOKU ada, dan Sub Account tersedia
 * bila diwajibkan (production).
 */
export function isOnlinePaymentAvailable(tenant: {
  onlinePaymentEnabled: boolean;
  dokuSubAccountId: string | null;
}): boolean {
  if (!tenant.onlinePaymentEnabled) return false;
  try {
    const config = getDokuConfig();
    return !config.requireSubAccount || Boolean(tenant.dokuSubAccountId);
  } catch {
    return false;
  }
}
