import { db } from '@/lib/db';
import { tenants, businessProfiles, verificationAuditLogs } from '@/lib/db/schema';
import { and, asc, eq, ilike, isNull, ne, or, sql, type SQL } from 'drizzle-orm';
import type { ProviderOnboardingStatus } from '@menuin/types';
import { PROVISIONING_STALE_MS, SUB_ACCOUNT_PROVISIONING, upsertDokuOnboarding } from './doku-adapter';

/**
 * Operasi Sub Account DOKU untuk tim Menuin (BV-015, manual fallback):
 * melihat status Sub Account semua outlet, menautkan profileId secara manual
 * bila registrasi lewat API gagal/dilakukan di dashboard DOKU, dan mengubah
 * status setelah DOKU mengaktifkan atau membekukan akun.
 *
 * Fungsi di sini tidak mengecek otorisasi; pemanggil (server action admin)
 * wajib memastikan izin MANAGE_PAYMENT_PROVIDER.
 */

export const SUB_ACCOUNT_ID_PATTERN = /^SAC-[A-Za-z0-9-]{4,60}$/;
export const LINKABLE_STATUSES = ['ACTIVE', 'PENDING_REVIEW'] as const;
export const MANUAL_STATUSES = ['ACTIVE', 'PENDING_REVIEW', 'SUSPENDED'] as const;
export type LinkableStatus = (typeof LINKABLE_STATUSES)[number];
export type ManualStatus = (typeof MANUAL_STATUSES)[number];

export const SUB_ACCOUNT_FILTERS = [
  'ALL',
  'NOT_PROVISIONED',
  'PROVISIONING',
  'FAILED',
  'PENDING_REVIEW',
  'ACTIVE',
  'SUSPENDED',
] as const;
export type SubAccountFilter = (typeof SUB_ACCOUNT_FILTERS)[number];

export type AdminActor = { accountId: string; role: string };

export type SubAccountAdminResult =
  | { success: true; subAccountId: string; status: ProviderOnboardingStatus }
  | { success: false; error: string };

const MIN_NOTE_LENGTH = 5;

function filterCondition(filter: SubAccountFilter): SQL | undefined {
  switch (filter) {
    case 'ALL':
      return undefined;
    case 'NOT_PROVISIONED':
      return and(
        isNull(tenants.dokuSubAccountId),
        or(isNull(tenants.dokuSubAccountStatus), eq(tenants.dokuSubAccountStatus, 'NOT_PROVISIONED'))
      );
    default:
      return eq(tenants.dokuSubAccountStatus, filter);
  }
}

export async function listSubAccountOverview(params: { filter?: SubAccountFilter; search?: string } = {}) {
  const filter = params.filter ?? 'ALL';
  const search = params.search?.trim();
  const conditions: SQL[] = [];
  const statusCondition = filterCondition(filter);
  if (statusCondition) conditions.push(statusCondition);
  if (search) {
    const pattern = `%${search.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    conditions.push(
      or(
        ilike(tenants.name, pattern),
        ilike(tenants.outletKey, pattern),
        ilike(tenants.slug, pattern),
        ilike(tenants.dokuSubAccountId, pattern)
      )!
    );
  }

  const rows = await db
    .select({
      tenantId: tenants.id,
      tenantName: tenants.name,
      outletKey: tenants.outletKey,
      dokuSubAccountId: tenants.dokuSubAccountId,
      dokuSubAccountStatus: tenants.dokuSubAccountStatus,
      onlinePaymentEnabled: tenants.onlinePaymentEnabled,
      outletComplianceStatus: tenants.outletComplianceStatus,
      updatedAt: tenants.updatedAt,
      businessProfileId: tenants.businessProfileId,
      businessProfileName: businessProfiles.name,
      businessProfileStatus: businessProfiles.verificationStatus,
    })
    .from(tenants)
    .leftJoin(businessProfiles, eq(tenants.businessProfileId, businessProfiles.id))
    .where(conditions.length ? and(...conditions) : undefined)
    // Yang butuh tindakan tim (FAILED, macet PROVISIONING, PENDING_REVIEW) tampil paling atas.
    .orderBy(
      sql`case ${tenants.dokuSubAccountStatus}
        when 'FAILED' then 0
        when 'PROVISIONING' then 1
        when 'PENDING_REVIEW' then 2
        when 'SUSPENDED' then 3
        when 'ACTIVE' then 5
        else 4 end`,
      asc(tenants.name)
    )
    .limit(200);

  const [counts] = await db
    .select({
      all: sql<number>`count(*)::int`,
      notProvisioned: sql<number>`count(*) filter (where ${tenants.dokuSubAccountId} is null and (${tenants.dokuSubAccountStatus} is null or ${tenants.dokuSubAccountStatus} = 'NOT_PROVISIONED'))::int`,
      provisioning: sql<number>`count(*) filter (where ${tenants.dokuSubAccountStatus} = 'PROVISIONING')::int`,
      failed: sql<number>`count(*) filter (where ${tenants.dokuSubAccountStatus} = 'FAILED')::int`,
      pendingReview: sql<number>`count(*) filter (where ${tenants.dokuSubAccountStatus} = 'PENDING_REVIEW')::int`,
      active: sql<number>`count(*) filter (where ${tenants.dokuSubAccountStatus} = 'ACTIVE')::int`,
      suspended: sql<number>`count(*) filter (where ${tenants.dokuSubAccountStatus} = 'SUSPENDED')::int`,
    })
    .from(tenants);

  const staleBefore = Date.now() - PROVISIONING_STALE_MS;
  return {
    rows: rows.map((row) => ({
      ...row,
      provisioningStale:
        row.dokuSubAccountStatus === SUB_ACCOUNT_PROVISIONING && row.updatedAt.getTime() < staleBefore,
    })),
    counts,
  };
}

function validateNote(note: string): string | null {
  return note.trim().length >= MIN_NOTE_LENGTH ? null : `Catatan wajib diisi (minimal ${MIN_NOTE_LENGTH} karakter).`;
}

/**
 * Menautkan profileId Sub Account DOKU ke outlet secara manual.
 * Menimpa ID yang sudah ada hanya bila `allowOverwrite` diset.
 */
export async function linkSubAccountManually(params: {
  tenantId: string;
  subAccountId: string;
  status: LinkableStatus;
  note: string;
  allowOverwrite?: boolean;
  actor: AdminActor;
}): Promise<SubAccountAdminResult> {
  const subAccountId = params.subAccountId.trim();
  if (!SUB_ACCOUNT_ID_PATTERN.test(subAccountId)) {
    return { success: false, error: 'Format ID Sub Account tidak valid. Contoh: SAC-1234-5678901234567.' };
  }
  if (!LINKABLE_STATUSES.includes(params.status)) {
    return { success: false, error: 'Status tautan harus ACTIVE atau PENDING_REVIEW.' };
  }
  const noteError = validateNote(params.note);
  if (noteError) return { success: false, error: noteError };

  return db.transaction(async (tx) => {
    const [tenant] = await tx.select().from(tenants).where(eq(tenants.id, params.tenantId)).for('update').limit(1);
    if (!tenant) return { success: false as const, error: 'Outlet tidak ditemukan.' };
    if (!tenant.businessProfileId) {
      return { success: false as const, error: 'Outlet belum terhubung ke Profil Badan Usaha, tidak bisa ditautkan.' };
    }

    if (
      tenant.dokuSubAccountStatus === SUB_ACCOUNT_PROVISIONING &&
      tenant.updatedAt.getTime() >= Date.now() - PROVISIONING_STALE_MS
    ) {
      return {
        success: false as const,
        error: 'Pendaftaran Sub Account outlet ini sedang berjalan. Tunggu beberapa menit lalu muat ulang.',
      };
    }

    if (tenant.dokuSubAccountId && tenant.dokuSubAccountId !== subAccountId && !params.allowOverwrite) {
      return {
        success: false as const,
        error: `Outlet ini sudah memakai ${tenant.dokuSubAccountId}. Centang "Timpa ID lama" untuk menggantinya.`,
      };
    }

    const [usedBy] = await tx
      .select({ id: tenants.id, name: tenants.name })
      .from(tenants)
      .where(and(eq(tenants.dokuSubAccountId, subAccountId), ne(tenants.id, tenant.id)))
      .limit(1);
    if (usedBy) {
      return { success: false as const, error: `ID ${subAccountId} sudah dipakai outlet lain (${usedBy.name}).` };
    }

    await tx
      .update(tenants)
      .set({ dokuSubAccountId: subAccountId, dokuSubAccountStatus: params.status, updatedAt: new Date() })
      .where(eq(tenants.id, tenant.id));

    await upsertDokuOnboarding(tx, {
      businessProfileId: tenant.businessProfileId,
      tenantId: tenant.id,
      providerReference: subAccountId,
      providerStatus: params.status,
    });

    await tx.insert(verificationAuditLogs).values({
      businessProfileId: tenant.businessProfileId,
      tenantId: tenant.id,
      actorId: params.actor.accountId,
      actorRole: params.actor.role,
      action: 'DOKU_SUB_ACCOUNT_LINKED_MANUALLY',
      previousStatus: tenant.dokuSubAccountStatus,
      newStatus: params.status,
      reason: params.note.trim(),
      metadata: {
        provider: 'DOKU',
        subAccountId,
        previousSubAccountId: tenant.dokuSubAccountId,
      },
    });

    return { success: true as const, subAccountId, status: params.status };
  });
}

/** Mengubah status Sub Account yang sudah tertaut (mis. PENDING_REVIEW → ACTIVE setelah DOKU mengaktifkan). */
export async function setSubAccountStatusManually(params: {
  tenantId: string;
  status: ManualStatus;
  note: string;
  actor: AdminActor;
}): Promise<SubAccountAdminResult> {
  if (!MANUAL_STATUSES.includes(params.status)) {
    return { success: false, error: 'Status tidak valid.' };
  }
  const noteError = validateNote(params.note);
  if (noteError) return { success: false, error: noteError };

  return db.transaction(async (tx) => {
    const [tenant] = await tx.select().from(tenants).where(eq(tenants.id, params.tenantId)).for('update').limit(1);
    if (!tenant) return { success: false as const, error: 'Outlet tidak ditemukan.' };
    if (!tenant.dokuSubAccountId || !tenant.businessProfileId) {
      return { success: false as const, error: 'Outlet ini belum punya Sub Account. Tautkan ID terlebih dahulu.' };
    }
    if (tenant.dokuSubAccountStatus === params.status) {
      return { success: true as const, subAccountId: tenant.dokuSubAccountId, status: params.status };
    }

    await tx
      .update(tenants)
      .set({ dokuSubAccountStatus: params.status, updatedAt: new Date() })
      .where(eq(tenants.id, tenant.id));

    await upsertDokuOnboarding(tx, {
      businessProfileId: tenant.businessProfileId,
      tenantId: tenant.id,
      providerReference: tenant.dokuSubAccountId,
      providerStatus: params.status,
    });

    await tx.insert(verificationAuditLogs).values({
      businessProfileId: tenant.businessProfileId,
      tenantId: tenant.id,
      actorId: params.actor.accountId,
      actorRole: params.actor.role,
      action: 'DOKU_SUB_ACCOUNT_STATUS_CHANGED',
      previousStatus: tenant.dokuSubAccountStatus,
      newStatus: params.status,
      reason: params.note.trim(),
      metadata: { provider: 'DOKU', subAccountId: tenant.dokuSubAccountId },
    });

    return { success: true as const, subAccountId: tenant.dokuSubAccountId, status: params.status };
  });
}
