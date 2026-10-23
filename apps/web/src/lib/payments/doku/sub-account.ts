import { z } from 'zod';
import { getSnapConfig } from './snap/config';
import { snapPost } from './snap/client';
import { generateExternalId } from './snap/signature';
import type { ProviderOnboardingStatus } from '@menuin/types';

/**
 * DOKU Sub Account V2 (Model A: Menuin = Platform, tiap outlet = Sub Account).
 *   POST /sub-account/v2.0/register (SNAP: token B2B + signature simetris)
 *   Body  : { partnerReferenceNo, type, email, name, parentProfileId = Client ID platform }
 *   Respons: { responseCode: "200xxxx", profileId: "SAC-xxxx", ... }
 *
 * Akun V2 tampil di dashboard DOKU (Wallet as a Service → Sub Account V2) dan
 * profileId-nya dipakai di `additional_info.account.id` Checkout.
 */
export const SUB_ACCOUNT_REGISTER_PATH = '/sub-account/v2.0/register';

const registerResponseSchema = z.object({
  profileId: z.string().min(1),
  status: z.string().optional(),
}).passthrough();

export type CreateSubAccountInput = {
  name: string;
  email: string;
  type?: 'DEFAULT' | 'STANDARD';
};

export type CreateSubAccountResult = {
  accountId: string;
  /** Status internal hasil pemetaan `status` DOKU (lihat mapDokuSubAccountStatus). */
  status: ProviderOnboardingStatus;
  /** Status mentah dari DOKU, untuk log/audit. */
  providerStatus: string | null;
  raw: unknown;
};

const ACTIVE_STATUSES = new Set(['ACTIVE', 'ACTIVATED', 'SUCCESS', 'APPROVED', 'VERIFIED']);
const SUSPENDED_STATUSES = new Set(['SUSPENDED', 'BLOCKED', 'FROZEN', 'INACTIVE', 'DISABLED']);
const FAILED_STATUSES = new Set(['FAILED', 'REJECTED', 'DECLINED']);

/**
 * Memetakan `status` Sub Account dari DOKU ke status internal.
 * Registrasi sukses tanpa field status dianggap ACTIVE (profileId sudah terbit).
 * Status yang tidak dikenal dianggap PENDING_REVIEW, bukan ACTIVE, supaya
 * pembayaran tidak dibuka ke akun yang belum jelas statusnya.
 */
export function mapDokuSubAccountStatus(status: string | null | undefined): ProviderOnboardingStatus {
  if (status === null || status === undefined || status.trim() === '') return 'ACTIVE';
  const normalized = status.trim().toUpperCase();
  if (ACTIVE_STATUSES.has(normalized)) return 'ACTIVE';
  if (SUSPENDED_STATUSES.has(normalized)) return 'SUSPENDED';
  if (FAILED_STATUSES.has(normalized)) return 'FAILED';
  return 'PENDING_REVIEW';
}

export async function createSubAccount(input: CreateSubAccountInput): Promise<CreateSubAccountResult> {
  const config = getSnapConfig();
  const data = await snapPost(SUB_ACCOUNT_REGISTER_PATH, {
    partnerReferenceNo: generateExternalId(),
    type: input.type ?? 'DEFAULT',
    email: input.email.trim().toLowerCase(),
    name: input.name.trim().slice(0, 64),
    parentProfileId: config.clientId,
  });

  const parsed = registerResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Respons registrasi Sub Account DOKU tidak memuat profileId');
  }
  return {
    accountId: parsed.data.profileId,
    status: mapDokuSubAccountStatus(parsed.data.status),
    providerStatus: parsed.data.status ?? null,
    raw: data,
  };
}
