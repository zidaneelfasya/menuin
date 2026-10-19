'use server';

import { db } from '@/lib/db';
import {
  verificationSubmissions,
  businessProfiles,
  tenants,
  verificationAuditLogs,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthenticatedAccount } from '@/lib/actions/auth-context';
import { getCurrentUser } from '@/lib/actions/auth';
import { hasPermission, Role, VerificationPermissions, type RoleType } from '@menuin/permissions';

export interface CareVerificationSummary {
  submissionId: string;
  businessName: string;
  entityType: string;
  submissionScope: string;
  attemptNumber: number;
  status: string;
  submittedAt: Date;
  reviewedAt: Date | null;
  decisionReason: string | null;
  outletName: string | null;
  maskedNik: string;
  maskedTaxId: string | null;
  maskedBankAccount: string;
}

function maskString(str: string | null | undefined, visibleStart = 4, visibleEnd = 4): string {
  if (!str) return '-';
  const clean = str.trim();
  if (clean.length <= visibleStart + visibleEnd) {
    return '****';
  }
  const start = clean.slice(0, visibleStart);
  const end = clean.slice(-visibleEnd);
  return `${start}${'*'.repeat(clean.length - visibleStart - visibleEnd)}${end}`;
}

/**
 * Read-only contextual support bridge for Care agents.
 * Strictly masks sensitive PII and omits signed document access URLs.
 */
export async function getCareVerificationSummary(
  submissionId: string
): Promise<{ success: boolean; data?: CareVerificationSummary; error?: string }> {
  try {
    const user = await getCurrentUser();
    const callerRole = (user?.role as RoleType) || Role.STAFF;

    // Check care agent or admin permission
    const isAuthorized =
      hasPermission(callerRole, VerificationPermissions.CARE_VIEW_SUMMARY) ||
      hasPermission(callerRole, VerificationPermissions.VIEW_DETAIL) ||
      callerRole === Role.SYSTEM_ADMIN ||
      (callerRole as string) === 'CARE_AGENT';

    if (!isAuthorized) {
      return { success: false, error: 'Akses ditolak: Hanya agen MENUIN Care atau admin yang dapat melihat ringkasan ini.' };
    }

    const [sub] = await db
      .select({
        id: verificationSubmissions.id,
        submissionScope: verificationSubmissions.submissionScope,
        attemptNumber: verificationSubmissions.attemptNumber,
        status: verificationSubmissions.status,
        submittedAt: verificationSubmissions.submittedAt,
        reviewedAt: verificationSubmissions.reviewedAt,
        decisionReason: verificationSubmissions.decisionReason,
        businessProfileId: verificationSubmissions.businessProfileId,
        tenantId: verificationSubmissions.tenantId,
        businessName: businessProfiles.name,
        entityType: businessProfiles.entityType,
        taxId: businessProfiles.taxId,
        responsiblePersonNik: businessProfiles.responsiblePersonNik,
        bankAccountNumber: businessProfiles.bankAccountNumber,
        tenantName: tenants.name,
      })
      .from(verificationSubmissions)
      .innerJoin(businessProfiles, eq(verificationSubmissions.businessProfileId, businessProfiles.id))
      .leftJoin(tenants, eq(verificationSubmissions.tenantId, tenants.id))
      .where(eq(verificationSubmissions.id, submissionId))
      .limit(1);

    if (!sub) {
      return { success: false, error: 'Pengajuan verifikasi tidak ditemukan.' };
    }

    return {
      success: true,
      data: {
        submissionId: sub.id,
        businessName: sub.businessName,
        entityType: sub.entityType,
        submissionScope: sub.submissionScope,
        attemptNumber: sub.attemptNumber,
        status: sub.status,
        submittedAt: sub.submittedAt,
        reviewedAt: sub.reviewedAt,
        decisionReason: sub.decisionReason,
        outletName: sub.tenantName,
        maskedNik: maskString(sub.responsiblePersonNik, 4, 4),
        maskedTaxId: sub.taxId ? maskString(sub.taxId, 3, 3) : null,
        maskedBankAccount: maskString(sub.bankAccountNumber, 0, 4),
      },
    };
  } catch (err: any) {
    console.error('getCareVerificationSummary error:', err);
    return { success: false, error: err.message || 'Gagal memuat ringkasan bantuan verifikasi.' };
  }
}

/**
 * Creates a merchant care inquiry pre-linked to a verification submission.
 */
export async function createCareVerificationInquiryAction(
  outletKey: string,
  submissionId: string,
  subject: string,
  message: string
) {
  try {
    const account = await getAuthenticatedAccount();

    const [sub] = await db
      .select()
      .from(verificationSubmissions)
      .where(eq(verificationSubmissions.id, submissionId))
      .limit(1);

    if (!sub) {
      return { success: false, error: 'Pengajuan verifikasi tidak ditemukan.' };
    }

    // Log the inquiry into audit log with action CARE_INQUIRY_CREATED
    await db.insert(verificationAuditLogs).values({
      businessProfileId: sub.businessProfileId,
      tenantId: sub.tenantId,
      actorId: account.id,
      actorRole: 'MERCHANT',
      action: 'CARE_INQUIRY_CREATED',
      reason: subject,
      metadata: {
        submissionId,
        subject,
        message,
        outletKey,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('createCareVerificationInquiryAction error:', err);
    return { success: false, error: err.message || 'Gagal mengirim pesan bantuan.' };
  }
}
