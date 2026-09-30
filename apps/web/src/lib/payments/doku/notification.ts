import { z } from 'zod';

/**
 * Payload HTTP Notification DOKU (Checkout / Non-SNAP). Hanya field yang kita
 * butuhkan yang divalidasi; sisanya dibiarkan (passthrough) dan disimpan mentah.
 */
export const dokuNotificationSchema = z.object({
  order: z.object({
    invoice_number: z.string().min(1).max(64),
    amount: z.coerce.number(),
  }).passthrough(),
  transaction: z.object({
    status: z.string().min(1),
    date: z.string().optional(),
    original_request_id: z.string().optional(),
  }).passthrough(),
  service: z.object({ id: z.string() }).passthrough().optional(),
  acquirer: z.object({ id: z.string() }).passthrough().optional(),
  channel: z.object({ id: z.string() }).passthrough().optional(),
  additional_info: z.object({
    account: z.object({ id: z.string() }).passthrough().optional(),
  }).passthrough().optional(),
}).passthrough();

export type DokuNotification = z.infer<typeof dokuNotificationSchema>;

export type NotificationHeaders = {
  clientId: string;
  requestId: string;
  requestTimestamp: string;
  signature: string;
};

export function readNotificationHeaders(headers: Headers): NotificationHeaders | null {
  const clientId = headers.get('client-id');
  const requestId = headers.get('request-id');
  const requestTimestamp = headers.get('request-timestamp');
  const signature = headers.get('signature');
  if (!clientId || !requestId || !requestTimestamp || !signature) return null;
  if (requestId.length > 128 || clientId.length > 128 || requestTimestamp.length > 64) return null;
  return { clientId, requestId, requestTimestamp, signature };
}
