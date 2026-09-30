import { z } from 'zod';
import { dokuRequest } from './client';

/**
 * DOKU Sub Account (Model A: Menuin = Platform, tiap outlet = Sub Account).
 *   POST /sac-merchant/v1/accounts → { account: { id: "SAC-xxxx", status, ... } }
 */

const createSubAccountResponseSchema = z.object({
  account: z.object({
    id: z.string().min(1),
    status: z.string().optional(),
  }).passthrough(),
}).passthrough();

export type CreateSubAccountInput = {
  name: string;
  email: string;
  type?: 'STANDARD';
};

export type CreateSubAccountResult = {
  accountId: string;
  status: string | null;
  raw: unknown;
};

export async function createSubAccount(input: CreateSubAccountInput): Promise<CreateSubAccountResult> {
  const res = await dokuRequest<unknown>({
    method: 'POST',
    path: '/sac-merchant/v1/accounts',
    body: {
      account: {
        name: input.name.trim().slice(0, 64),
        email: input.email.trim().toLowerCase(),
        type: input.type ?? 'STANDARD',
      },
    },
  });

  const parsed = createSubAccountResponseSchema.safeParse(res.data);
  if (!parsed.success) {
    throw new Error('Respons pembuatan Sub Account DOKU tidak memuat account.id');
  }
  return {
    accountId: parsed.data.account.id,
    status: parsed.data.account.status ?? null,
    raw: res.data,
  };
}
