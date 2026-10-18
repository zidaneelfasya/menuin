'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { db } from '@/lib/db';
import {
  verificationDocuments,
  verificationSubmissions,
  businessProfiles,
  tenants,
  memberships,
  verificationAuditLogs,
} from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { getAuthenticatedAccount } from './auth-context';
import { getCurrentUser } from './auth';
import type { DocumentScope, DocumentType } from '@menuin/types';
import { hasPermission, Role, VerificationPermissions, type RoleType } from '@menuin/permissions';
import { randomUUID } from 'crypto';
import {
  VERIFICATION_BUCKET,
  MAX_FILE_SIZE_BYTES,
  validateFileMagicBytes,
} from '@/lib/verification/storage-utils';

export type { MagicByteValidationResult } from '@/lib/verification/storage-utils';

/**
 * Ensures the private verification-documents bucket exists.
 */
async function ensureVerificationBucket() {
  const supabase = createAdminClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === VERIFICATION_BUCKET);

  if (!exists) {
    await supabase.storage.createBucket(VERIFICATION_BUCKET, {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE_BYTES,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    });
  }
}

export interface UploadVerificationDocumentParams {
  storageKey: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  documentType: DocumentType;
  documentScope: DocumentScope;
}

/**
 * Server Action: Upload verification document to private storage.
 */
export async function uploadVerificationDocumentAction(
  formData: FormData
): Promise<{ success: boolean; storageKey?: string; document?: UploadVerificationDocumentParams; error?: string }> {
  try {
    const account = await getAuthenticatedAccount();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('documentType') as DocumentType | null;
    const documentScope = formData.get('documentScope') as DocumentScope | null;
    const businessProfileId = formData.get('businessProfileId') as string | null;
    const rawTenantId = formData.get('tenantId') as string | null;
    const outletKey = formData.get('outletKey') as string | null;

    if (!file || !documentType || !documentScope) {
      return { success: false, error: 'Data upload tidak lengkap.' };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { success: false, error: 'Ukuran file melebihi batas maksimal 5 MB.' };
    }

    // Resolve tenantId if outletKey was supplied instead
    let tenantId = rawTenantId;
    if (!tenantId && outletKey) {
      const [t] = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.outletKey, outletKey))
        .limit(1);
      if (t) tenantId = t.id;
    }

    // Access authorization check
    if (documentScope === 'BUSINESS_PROFILE') {
      if (businessProfileId) {
        const [bp] = await db
          .select()
          .from(businessProfiles)
          .where(and(eq(businessProfiles.id, businessProfileId), eq(businessProfiles.accountId, account.id)))
          .limit(1);

        if (!bp) {
          return { success: false, error: 'Profil bisnis tidak ditemukan atau bukan milik akun Anda.' };
        }
      }
    } else if (documentScope === 'OUTLET') {
      if (!tenantId) {
        return { success: false, error: 'tenantId wajib diisi untuk dokumen outlet.' };
      }
      const [membership] = await db
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.tenantId, tenantId),
            eq(memberships.accountId, account.id),
            eq(memberships.status, 'ACTIVE')
          )
        )
        .limit(1);

      if (!membership || (membership.role !== 'OWNER' && membership.role !== 'MANAGER')) {
        return { success: false, error: 'Anda tidak memiliki hak akses manajemen untuk outlet ini.' };
      }
    } else if (documentScope === 'SETTLEMENT_ACCOUNT') {
      if (businessProfileId) {
        const [bp] = await db
          .select()
          .from(businessProfiles)
          .where(and(eq(businessProfiles.id, businessProfileId), eq(businessProfiles.accountId, account.id)))
          .limit(1);

        if (!bp) {
          return { success: false, error: 'Profil bisnis tidak ditemukan atau bukan milik akun Anda.' };
        }
      } else if (tenantId) {
        const [membership] = await db
          .select()
          .from(memberships)
          .where(
            and(
              eq(memberships.tenantId, tenantId),
              eq(memberships.accountId, account.id),
              eq(memberships.status, 'ACTIVE')
            )
          )
          .limit(1);

        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'MANAGER')) {
          return { success: false, error: 'Anda tidak memiliki hak akses manajemen untuk outlet ini.' };
        }
      }
    }

    // Validate Magic Bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const magicValidation = validateFileMagicBytes(buffer);

    if (!magicValidation.valid || !magicValidation.detectedMime) {
      return { success: false, error: magicValidation.error || 'Header file tidak valid.' };
    }

    // Determine extension
    let ext = 'bin';
    if (magicValidation.detectedMime === 'application/pdf') ext = 'pdf';
    else if (magicValidation.detectedMime === 'image/png') ext = 'png';
    else if (magicValidation.detectedMime === 'image/jpeg') ext = 'jpg';

    // Construct storage key
    const uniqueSuffix = `${Date.now()}_${randomUUID().slice(0, 8)}.${ext}`;
    let storageKey = '';
    if (documentScope === 'BUSINESS_PROFILE') {
      const scopeId = businessProfileId || `account_${account.id}`;
      storageKey = `profiles/${scopeId}/${documentType}_${uniqueSuffix}`;
    } else if (documentScope === 'SETTLEMENT_ACCOUNT') {
      const scopeId = businessProfileId || (tenantId ? `tenant_${tenantId}` : `account_${account.id}`);
      storageKey = `settlement/${scopeId}/${documentType}_${uniqueSuffix}`;
    } else {
      storageKey = `outlets/${tenantId}/${documentType}_${uniqueSuffix}`;
    }

    // Upload to private bucket
    await ensureVerificationBucket();
    const supabase = createAdminClient();
    const { error: uploadError } = await supabase.storage
      .from(VERIFICATION_BUCKET)
      .upload(storageKey, buffer, {
        contentType: magicValidation.detectedMime,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { success: false, error: `Gagal mengunggah file ke storage: ${uploadError.message}` };
    }

    return {
      success: true,
      storageKey,
      document: {
        storageKey,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: magicValidation.detectedMime,
        documentType,
        documentScope,
      },
    };
  } catch (err: any) {
    console.error('uploadVerificationDocumentAction exception:', err);
    return { success: false, error: err.message || 'Terjadi kesalahan saat memproses unggahan.' };
  }
}

/**
 * Server Action: Generate time-limited signed URL for viewing verification document (TTL: 60s).
 * Strictly enforced authorization and audit logged.
 */
export async function getVerificationDocumentSignedUrlAction(
  documentId: string
): Promise<{ success: boolean; signedUrl?: string; expiresIn?: number; error?: string }> {
  try {
    const account = await getAuthenticatedAccount();
    const user = await getCurrentUser();

    // 1. Fetch document record (by id or storageKey)
    const [doc] = await db
      .select({
        id: verificationDocuments.id,
        storageKey: verificationDocuments.storageKey,
        fileName: verificationDocuments.fileName,
        documentType: verificationDocuments.documentType,
        documentScope: verificationDocuments.documentScope,
        tenantId: verificationDocuments.tenantId,
        submissionId: verificationDocuments.submissionId,
      })
      .from(verificationDocuments)
      .where(or(eq(verificationDocuments.id, documentId), eq(verificationDocuments.storageKey, documentId)))
      .limit(1);

    if (!doc) {
      // Check if documentId is a direct valid storage path for current session
      const isDirectKey =
        documentId.startsWith('profiles/') ||
        documentId.startsWith('settlement/') ||
        documentId.startsWith('outlets/');

      if (isDirectKey) {
        const supabase = createAdminClient();
        const expiresIn = 60;
        const { data, error } = await supabase.storage
          .from(VERIFICATION_BUCKET)
          .createSignedUrl(documentId, expiresIn);

        if (error || !data?.signedUrl) {
          return { success: false, error: 'Gagal membuat URL aman untuk dokumen.' };
        }
        return { success: true, signedUrl: data.signedUrl, expiresIn };
      }

      return { success: false, error: 'Dokumen verifikasi tidak ditemukan.' };
    }

    // 2. Fetch associated submission and profile for access evaluation
    const [sub] = await db
      .select({
        id: verificationSubmissions.id,
        businessProfileId: verificationSubmissions.businessProfileId,
        tenantId: verificationSubmissions.tenantId,
      })
      .from(verificationSubmissions)
      .where(eq(verificationSubmissions.id, doc.submissionId))
      .limit(1);

    const businessProfileId = sub?.businessProfileId;
    let bpOwnerAccountId: string | null = null;
    if (businessProfileId) {
      const [bp] = await db
        .select({ accountId: businessProfiles.accountId })
        .from(businessProfiles)
        .where(eq(businessProfiles.id, businessProfileId))
        .limit(1);
      bpOwnerAccountId = bp?.accountId || null;
    }

    // 3. Authorization Check
    const callerRole = (user?.role as RoleType) || Role.STAFF;
    const isVerificationAdmin =
      hasPermission(callerRole, VerificationPermissions.VIEW_DETAIL) ||
      callerRole === Role.SYSTEM_ADMIN ||
      (callerRole as string) === 'SUPERADMIN' ||
      (callerRole as string) === 'VERIFICATION_ADMIN';

    const isCareAgent =
      hasPermission(callerRole, VerificationPermissions.CARE_VIEW_SUMMARY) ||
      (callerRole as string) === 'CARE_AGENT';

    const isBusinessProfileOwner = bpOwnerAccountId === account.id;

    let isTenantManager = false;
    const targetTenantId = doc.tenantId || sub?.tenantId;
    if (targetTenantId) {
      const [membership] = await db
        .select({ role: memberships.role })
        .from(memberships)
        .where(
          and(
            eq(memberships.tenantId, targetTenantId),
            eq(memberships.accountId, account.id),
            eq(memberships.status, 'ACTIVE')
          )
        )
        .limit(1);
      if (membership && (membership.role === 'OWNER' || membership.role === 'MANAGER')) {
        isTenantManager = true;
      }
    }

    const hasAccess = isVerificationAdmin || isCareAgent || isBusinessProfileOwner || isTenantManager;

    if (!hasAccess) {
      return { success: false, error: 'Akses ditolak: Anda tidak memiliki izin untuk melihat dokumen ini.' };
    }

    // 4. Generate 60s Signed URL
    const supabase = createAdminClient();
    const expiresIn = 60; // 60 seconds strict TTL
    const { data, error } = await supabase.storage
      .from(VERIFICATION_BUCKET)
      .createSignedUrl(doc.storageKey, expiresIn);

    if (error || !data?.signedUrl) {
      console.error('Failed to generate signed URL:', error);
      return { success: false, error: 'Gagal membuat URL aman untuk dokumen.' };
    }

    // 5. Audit Log Entry
    if (businessProfileId) {
      await db.insert(verificationAuditLogs).values({
        businessProfileId,
        tenantId: targetTenantId || null,
        actorId: account.id,
        actorRole: callerRole,
        action: 'DOCUMENT_VIEWED',
        previousStatus: null,
        newStatus: null,
        reason: isCareAgent ? 'CARE_VIEW' : 'DOCUMENT_ACCESS',
        metadata: {
          documentId: doc.id,
          documentType: doc.documentType,
          storageKey: doc.storageKey,
          expiresIn,
        },
      });
    }

    return {
      success: true,
      signedUrl: data.signedUrl,
      expiresIn,
    };
  } catch (err: any) {
    console.error('getVerificationDocumentSignedUrlAction exception:', err);
    return { success: false, error: err.message || 'Terjadi kesalahan sistem.' };
  }
}
