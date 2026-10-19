import { getDokuConfig } from './doku/config';

/**
 * Apakah storefront boleh menawarkan pembayaran online untuk tenant ini:
 * toggle outlet aktif, kredensial platform DOKU ada, dan Sub Account ACTIVE
 * bila diwajibkan (production).
 */
export function isOnlinePaymentAvailable(tenant: {
  onlinePaymentEnabled: boolean;
  dokuSubAccountId: string | null;
  dokuSubAccountStatus: string | null;
}): boolean {
  if (!tenant.onlinePaymentEnabled) return false;
  try {
    const config = getDokuConfig();
    return (
      !config.requireSubAccount ||
      (Boolean(tenant.dokuSubAccountId) && tenant.dokuSubAccountStatus === 'ACTIVE')
    );
  } catch {
    return false;
  }
}
