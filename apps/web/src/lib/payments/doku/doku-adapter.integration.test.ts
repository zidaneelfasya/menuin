/**
 * Integration test provisioning Sub Account DOKU: DB sungguhan, API DOKU di-mock.
 * Hanya jalan jika TEST_DATABASE_URL diset ke database UJI.
 */
import crypto from 'crypto';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const TEST_DB = process.env.TEST_DATABASE_URL;
if (TEST_DB) process.env.DATABASE_URL = TEST_DB;

const createSubAccount = vi.fn();
vi.mock('./sub-account', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./sub-account')>();
  return { ...actual, createSubAccount: (...args: unknown[]) => createSubAccount(...args) };
});

describe.skipIf(!TEST_DB)('provisionDokuSubAccountForTenant (integration)', async () => {
  const { db } = await import('@/lib/db');
  const schema = await import('@/lib/db/schema');
  const { eq } = await import('drizzle-orm');
  const { provisionDokuSubAccountForTenant } = await import('./doku-adapter');
  const { DokuApiError } = await import('./client');

  const admin = await import('./sub-account-admin');

  const authUserIds: string[] = [];
  let lastAccountId = '';

  async function setup(opts: { verified?: boolean } = {}) {
    const verified = opts.verified ?? true;
    const key = `it-sac-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const authUserId = crypto.randomUUID();
    authUserIds.push(authUserId);
    await db.insert(schema.authUsers).values({ id: authUserId });
    const [account] = await db
      .insert(schema.accounts)
      .values({ authUserId, email: `${key}@example.com`, name: 'Owner IT' })
      .returning();
    const [profile] = await db
      .insert(schema.businessProfiles)
      .values({
        accountId: account.id,
        name: 'PT Kopi IT',
        entityType: 'PT',
        responsiblePersonName: 'Owner IT',
        responsiblePersonNik: '3201010101010001',
        responsiblePersonContact: `${key}@example.com`,
        verificationStatus: verified ? 'verified' : 'ready_for_review',
      })
      .returning();
    const [settlement] = await db
      .insert(schema.settlementAccounts)
      .values({
        businessProfileId: profile.id,
        bankName: 'BCA',
        bankAccountNumber: '1234567890',
        bankAccountNumberMasked: '******7890',
        bankAccountHolder: 'PT Kopi IT',
        verificationStatus: 'verified',
        isDefault: true,
      })
      .returning();
    const [tenant] = await db
      .insert(schema.tenants)
      .values({
        name: 'IT Sub Account',
        outletKey: key,
        slug: key,
        businessProfileId: profile.id,
        settlementAccountId: settlement.id,
        outletComplianceStatus: 'verified',
      })
      .returning();
    lastAccountId = account.id;
    return tenant.id;
  }

  const tenantOf = async (id: string) =>
    (await db.select().from(schema.tenants).where(eq(schema.tenants.id, id)))[0];

  afterAll(async () => {
    // accounts → business_profiles → settlement/onboarding/audit ikut terhapus (cascade).
    for (const id of authUserIds) {
      const [account] = await db.select().from(schema.accounts).where(eq(schema.accounts.authUserId, id));
      if (account) {
        const profiles = await db
          .select()
          .from(schema.businessProfiles)
          .where(eq(schema.businessProfiles.accountId, account.id));
        for (const p of profiles) {
          await db.delete(schema.tenants).where(eq(schema.tenants.businessProfileId, p.id));
        }
      }
      await db.delete(schema.authUsers).where(eq(schema.authUsers.id, id));
    }
  });

  beforeEach(() => {
    createSubAccount.mockReset();
    createSubAccount.mockResolvedValue({ accountId: 'SAC-IT-0001', status: 'ACTIVE', providerStatus: null, raw: {} });
  });

  it('stores the DOKU profileId as ACTIVE without inventing QRIS merchant data', async () => {
    const tenantId = await setup();
    const res = await provisionDokuSubAccountForTenant(tenantId);

    expect(res).toMatchObject({ success: true, subAccountId: 'SAC-IT-0001', status: 'ACTIVE' });
    expect(await tenantOf(tenantId)).toMatchObject({
      dokuSubAccountId: 'SAC-IT-0001',
      dokuSubAccountStatus: 'ACTIVE',
      onlinePaymentEnabled: true,
      dokuQrisMerchantId: null,
      dokuQrisTerminalId: null,
    });
    const [onboarding] = await db
      .select()
      .from(schema.providerOnboardings)
      .where(eq(schema.providerOnboardings.tenantId, tenantId));
    expect(onboarding).toMatchObject({ providerReference: 'SAC-IT-0001', providerStatus: 'ACTIVE' });
  });

  it('DOKU failure marks FAILED with no fake id, and a retry can succeed', async () => {
    const tenantId = await setup();
    createSubAccount.mockRejectedValueOnce(new DokuApiError('boom', 500, { responseMessage: 'error' }, 'req-1'));

    const failed = await provisionDokuSubAccountForTenant(tenantId);
    expect(failed).toMatchObject({ success: false, status: 'FAILED' });
    expect(await tenantOf(tenantId)).toMatchObject({ dokuSubAccountId: null, dokuSubAccountStatus: 'FAILED' });

    const retried = await provisionDokuSubAccountForTenant(tenantId);
    expect(retried).toMatchObject({ success: true, subAccountId: 'SAC-IT-0001' });
    expect(createSubAccount).toHaveBeenCalledTimes(2);
  });

  it('a non-active DOKU status is stored but not treated as active, and never re-registered', async () => {
    const tenantId = await setup();
    createSubAccount.mockResolvedValueOnce({
      accountId: 'SAC-IT-PENDING',
      status: 'PENDING_REVIEW',
      providerStatus: 'PENDING',
      raw: {},
    });

    const first = await provisionDokuSubAccountForTenant(tenantId);
    expect(first).toMatchObject({ success: false, subAccountId: 'SAC-IT-PENDING', status: 'PENDING_REVIEW' });
    expect(await tenantOf(tenantId)).toMatchObject({
      dokuSubAccountId: 'SAC-IT-PENDING',
      dokuSubAccountStatus: 'PENDING_REVIEW',
      onlinePaymentEnabled: false,
    });

    const second = await provisionDokuSubAccountForTenant(tenantId);
    expect(second).toMatchObject({ success: false, status: 'PENDING_REVIEW' });
    expect(createSubAccount).toHaveBeenCalledTimes(1);
  });

  it('parallel activations register only one Sub Account', async () => {
    const tenantId = await setup();
    createSubAccount.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 50));
      return { accountId: 'SAC-IT-PARALLEL', status: 'ACTIVE', providerStatus: null, raw: {} };
    });

    const results = await Promise.all([1, 2, 3, 4].map(() => provisionDokuSubAccountForTenant(tenantId)));
    expect(createSubAccount).toHaveBeenCalledTimes(1);
    expect(results.filter((r) => r.success)).toHaveLength(1);
    expect(await tenantOf(tenantId)).toMatchObject({ dokuSubAccountId: 'SAC-IT-PARALLEL' });
  });

  it('refuses to call DOKU while the business profile is not verified', async () => {
    const tenantId = await setup({ verified: false });
    const res = await provisionDokuSubAccountForTenant(tenantId);
    expect(res.success).toBe(false);
    expect(createSubAccount).not.toHaveBeenCalled();
    expect(await tenantOf(tenantId)).toMatchObject({ dokuSubAccountId: null, dokuSubAccountStatus: null });
  });

  describe('manual admin operations', () => {
    const actor = () => ({ accountId: lastAccountId, role: 'SYSTEM_ADMIN' });
    const auditOf = (tenantId: string) =>
      db.select().from(schema.verificationAuditLogs).where(eq(schema.verificationAuditLogs.tenantId, tenantId));

    it('links a Sub Account manually with an audit entry and onboarding row', async () => {
      const tenantId = await setup();
      const res = await admin.linkSubAccountManually({
        tenantId,
        subAccountId: 'SAC-MANUAL-0001',
        status: 'ACTIVE',
        note: 'API timeout, dibuat di dashboard DOKU',
        actor: actor(),
      });

      expect(res).toMatchObject({ success: true, subAccountId: 'SAC-MANUAL-0001', status: 'ACTIVE' });
      expect(await tenantOf(tenantId)).toMatchObject({
        dokuSubAccountId: 'SAC-MANUAL-0001',
        dokuSubAccountStatus: 'ACTIVE',
      });
      const [onboarding] = await db
        .select()
        .from(schema.providerOnboardings)
        .where(eq(schema.providerOnboardings.tenantId, tenantId));
      expect(onboarding).toMatchObject({ providerReference: 'SAC-MANUAL-0001', providerStatus: 'ACTIVE' });
      const [log] = await auditOf(tenantId);
      expect(log).toMatchObject({
        action: 'DOKU_SUB_ACCOUNT_LINKED_MANUALLY',
        actorId: lastAccountId,
        actorRole: 'SYSTEM_ADMIN',
        newStatus: 'ACTIVE',
        reason: 'API timeout, dibuat di dashboard DOKU',
      });
    });

    it('rejects a bad id, a missing note, and an id already used by another outlet', async () => {
      const first = await setup();
      const second = await setup();
      const base = { status: 'ACTIVE' as const, note: 'catatan ops', actor: actor() };

      expect(await admin.linkSubAccountManually({ ...base, tenantId: first, subAccountId: 'bukan-sac' }))
        .toMatchObject({ success: false, error: expect.stringMatching(/Format/) });
      expect(await admin.linkSubAccountManually({ ...base, tenantId: first, subAccountId: 'SAC-DUP-0001', note: ' ' }))
        .toMatchObject({ success: false, error: expect.stringMatching(/Catatan/) });

      expect(await admin.linkSubAccountManually({ ...base, tenantId: first, subAccountId: 'SAC-DUP-0001' }))
        .toMatchObject({ success: true });
      expect(await admin.linkSubAccountManually({ ...base, tenantId: second, subAccountId: 'SAC-DUP-0001' }))
        .toMatchObject({ success: false, error: expect.stringMatching(/dipakai outlet lain/) });
      expect(await tenantOf(second)).toMatchObject({ dokuSubAccountId: null });
    });

    it('replacing an existing id requires allowOverwrite', async () => {
      const tenantId = await setup();
      const base = { tenantId, status: 'ACTIVE' as const, note: 'catatan ops', actor: actor() };
      await admin.linkSubAccountManually({ ...base, subAccountId: 'SAC-OLD-0001' });

      expect(await admin.linkSubAccountManually({ ...base, subAccountId: 'SAC-NEW-0001' }))
        .toMatchObject({ success: false, error: expect.stringMatching(/Timpa ID lama/) });
      expect(await tenantOf(tenantId)).toMatchObject({ dokuSubAccountId: 'SAC-OLD-0001' });

      expect(await admin.linkSubAccountManually({ ...base, subAccountId: 'SAC-NEW-0001', allowOverwrite: true }))
        .toMatchObject({ success: true });
      expect(await tenantOf(tenantId)).toMatchObject({ dokuSubAccountId: 'SAC-NEW-0001' });
    });

    it('refuses to link while a fresh API provisioning is running', async () => {
      const tenantId = await setup();
      await db.update(schema.tenants).set({ dokuSubAccountStatus: 'PROVISIONING', updatedAt: new Date() }).where(eq(schema.tenants.id, tenantId));

      expect(await admin.linkSubAccountManually({
        tenantId, subAccountId: 'SAC-RACE-0001', status: 'ACTIVE', note: 'catatan ops', actor: actor(),
      })).toMatchObject({ success: false, error: expect.stringMatching(/sedang berjalan/) });
    });

    it('promotes PENDING_REVIEW to ACTIVE, which then unblocks the adapter', async () => {
      const tenantId = await setup();
      createSubAccount.mockResolvedValueOnce({ accountId: 'SAC-IT-PROMOTE', status: 'PENDING_REVIEW', providerStatus: 'PENDING', raw: {} });
      await provisionDokuSubAccountForTenant(tenantId);

      const res = await admin.setSubAccountStatusManually({
        tenantId, status: 'ACTIVE', note: 'DOKU sudah mengaktifkan akun', actor: actor(),
      });
      expect(res).toMatchObject({ success: true, status: 'ACTIVE' });
      expect(await provisionDokuSubAccountForTenant(tenantId)).toMatchObject({ success: true, subAccountId: 'SAC-IT-PROMOTE' });
      expect(createSubAccount).toHaveBeenCalledTimes(1);
      expect((await auditOf(tenantId)).map((l) => l.action)).toContain('DOKU_SUB_ACCOUNT_STATUS_CHANGED');
    });

    it('cannot change status of an outlet without a Sub Account', async () => {
      const tenantId = await setup();
      expect(await admin.setSubAccountStatusManually({
        tenantId, status: 'ACTIVE', note: 'catatan ops', actor: actor(),
      })).toMatchObject({ success: false });
    });

    it('overview filters by status and flags stale provisioning', async () => {
      const stuck = await setup();
      await db
        .update(schema.tenants)
        .set({ dokuSubAccountStatus: 'PROVISIONING', updatedAt: new Date(Date.now() - 10 * 60_000) })
        .where(eq(schema.tenants.id, stuck));

      const { rows, counts } = await admin.listSubAccountOverview({ filter: 'PROVISIONING' });
      const row = rows.find((r) => r.tenantId === stuck);
      expect(row).toMatchObject({ provisioningStale: true, businessProfileStatus: 'verified' });
      expect(rows.every((r) => r.dokuSubAccountStatus === 'PROVISIONING')).toBe(true);
      expect(counts.provisioning).toBeGreaterThanOrEqual(1);
    });
  });
});
