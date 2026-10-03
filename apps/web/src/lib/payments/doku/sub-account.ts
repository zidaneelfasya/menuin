import { z } from 'zod';
import { getSnapConfig } from './snap/config';
import { snapPost } from './snap/client';
import { generateExternalId } from './snap/signature';

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
  status: string | null;
  raw: unknown;
};

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
    status: parsed.data.status ?? null,
    raw: data,
  };
}
