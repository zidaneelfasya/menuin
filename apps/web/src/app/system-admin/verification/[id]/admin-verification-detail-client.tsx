'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconArrowLeft,
  IconArrowRight,
  IconShieldCheck,
  IconBuildingStore,
  IconUserCheck,
  IconBuildingBank,
  IconMapPin,
  IconFileText,
  IconExternalLink,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconClock,
  IconPhoto,
  IconLock,
  IconRefresh,
  IconHistory,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  claimVerificationReviewAction,
  submitVerificationDecisionAction,
  adminReopenVerificationAction,
} from '@/lib/actions/admin-verification';
import { getVerificationDocumentSignedUrlAction } from '@/lib/actions/verification-storage';

interface DocumentReviewState {
  documentId: string;
  status: 'ACCEPTED' | 'REJECTED';
  note: string;
}

interface SectionReviewState {
  status: 'APPROVED' | 'CHANGES_REQUESTED';
  note: string;
  flaggedFields: string[];
}

interface AdminVerificationDetailClientProps {
  submissionId: string;
  initialData: any;
}

export function AdminVerificationDetailClient({
  submissionId,
  initialData,
}: AdminVerificationDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const {
    submission,
    documents = [],
    sectionReviews = [],
    auditHistory = [],
    settlementAccounts = [],
    isSuperseded = false,
    isDecisionIssued = false,
    newerSubmissionId = null,
    newerAttemptNumber = null,
  } = initialData;

  const isFormLocked =
    isSuperseded ||
    (isDecisionIssued && submission.status === 'action_required') ||
    submission.status === 'verified';
  const snapshot = submission.submissionSnapshot || {};

  // Find linked or active settlement account
  const activeSettlementAcc =
    settlementAccounts.find((a: any) => a.id === submission.tenantSettlementAccountId) ||
    settlementAccounts[0] ||
    null;

  // Initialize Section Reviews state
  const [sectionsState, setSectionsState] = React.useState<Record<string, SectionReviewState>>(() => {
    const map: Record<string, SectionReviewState> = {
      BUSINESS_PROFILE: { status: 'APPROVED', note: '', flaggedFields: [] },
      REPRESENTATIVE: { status: 'APPROVED', note: '', flaggedFields: [] },
      SETTLEMENT: { status: 'APPROVED', note: '', flaggedFields: [] },
      OUTLET: { status: 'APPROVED', note: '', flaggedFields: [] },
    };

    sectionReviews.forEach((sr: any) => {
      if (map[sr.section]) {
        map[sr.section] = {
          status: sr.status === 'CHANGES_REQUESTED' ? 'CHANGES_REQUESTED' : 'APPROVED',
          note: sr.note || '',
          flaggedFields: Array.isArray(sr.flaggedFields) ? sr.flaggedFields : [],
        };
      }
    });

    return map;
  });

  // Initialize Document Review state
  const [docReviews, setDocReviews] = React.useState<Record<string, DocumentReviewState>>(() => {
    const map: Record<string, DocumentReviewState> = {};
    documents.forEach((d: any) => {
      map[d.id] = {
        documentId: d.id,
        status: d.reviewStatus === 'REJECTED' ? 'REJECTED' : 'ACCEPTED',
        note: d.reviewNote || '',
      };
    });
    return map;
  });

  // Reopen Modal state
  const [isReopenModalOpen, setIsReopenModalOpen] = React.useState(false);
  const [reopenNote, setReopenNote] = React.useState('');

  // Permanent Reject Modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');

  // Overall Decision State
  const [decision, setDecision] = React.useState<'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'>(() => {
    if (submission.decision === 'REJECT' || submission.status === 'rejected') return 'REJECT';
    if (submission.decision === 'REQUEST_CHANGES' || submission.status === 'action_required') return 'REQUEST_CHANGES';
    const hasInitialChanges = sectionReviews.some((sr: any) => sr.status === 'CHANGES_REQUESTED');
    const hasInitialRejectedDocs = documents.some((d: any) => d.reviewStatus === 'REJECTED');
    if (hasInitialChanges || hasInitialRejectedDocs) return 'REQUEST_CHANGES';
    return 'APPROVE';
  });
  const [decisionReason, setDecisionReason] = React.useState(submission.decisionReason || '');
  const [internalNotes, setInternalNotes] = React.useState(submission.internalNotes || '');

  // Handler to update section status
  const handleUpdateSectionStatus = (
    sectionKey: 'BUSINESS_PROFILE' | 'REPRESENTATIVE' | 'SETTLEMENT' | 'OUTLET',
    newStatus: 'APPROVED' | 'CHANGES_REQUESTED',
    sectionTitle: string
  ) => {
    setSectionsState((prev) => {
      const updated = {
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          status: newStatus,
          flaggedFields: newStatus === 'APPROVED' ? [] : prev[sectionKey].flaggedFields,
        },
      };

      if (newStatus === 'CHANGES_REQUESTED') {
        setDecision((d) => (d === 'REJECT' ? 'REJECT' : 'REQUEST_CHANGES'));
      } else {
        const hasAnyChanges = Object.values(updated).some((s) => s.status === 'CHANGES_REQUESTED');
        const hasAnyDocRejected = Object.values(docReviews).some((d) => d.status === 'REJECTED');
        if (!hasAnyChanges && !hasAnyDocRejected) {
          setDecision((d) => (d === 'REJECT' ? 'REJECT' : 'APPROVE'));
        }
      }

      return updated;
    });

    if (newStatus === 'APPROVED') {
      toast.success(`${sectionTitle} ditandai: Sesuai`, { duration: 1500 });
    } else {
      toast.warning(`${sectionTitle} ditandai: Perlu Perbaikan`, { duration: 2000 });
    }
  };

  // Handler to toggle manual field check flag (e.g. NIB, NPWP, NIK, etc.)
  const handleToggleFieldFlag = (
    sectionKey: 'BUSINESS_PROFILE' | 'REPRESENTATIVE' | 'SETTLEMENT' | 'OUTLET',
    fieldKey: string,
    fieldLabel: string,
    isFlagged: boolean
  ) => {
    setSectionsState((prev) => {
      const currentFlags = prev[sectionKey]?.flaggedFields || [];
      let updatedFlags: string[];
      let updatedStatus = prev[sectionKey]?.status;

      if (isFlagged) {
        updatedFlags = Array.from(new Set([...currentFlags, fieldKey]));
        updatedStatus = 'CHANGES_REQUESTED';
        setDecision((d) => (d === 'REJECT' ? 'REJECT' : 'REQUEST_CHANGES'));
        toast.warning(`${fieldLabel} ditandai: Perlu Perbaikan`, { duration: 2000 });
      } else {
        updatedFlags = currentFlags.filter((f) => f !== fieldKey);
        toast.success(`${fieldLabel} ditandai: Sesuai`, { duration: 1500 });
      }

      return {
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          status: updatedStatus,
          flaggedFields: updatedFlags,
        },
      };
    });
  };

  // Helper renderer for verified text fields with [Sesuai] & [Flag] micro-controls
  const renderFieldWithCheck = (
    sectionKey: 'BUSINESS_PROFILE' | 'REPRESENTATIVE' | 'SETTLEMENT' | 'OUTLET',
    fieldKey: string,
    label: string,
    value: React.ReactNode,
    className?: string
  ) => {
    const isFlagged = sectionsState[sectionKey]?.flaggedFields?.includes(fieldKey);
    return (
      <div
        className={cn(
          'p-3 rounded-lg border transition-all text-xs',
          isFlagged
            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
            : 'bg-slate-50/60 border-slate-200/80 hover:border-slate-300 text-slate-900',
          className
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-slate-500 block font-medium">{label}</span>
            <div className={cn('font-semibold text-xs sm:text-sm mt-0.5 break-words', isFlagged ? 'text-rose-950' : 'text-slate-900')}>
              {value || '-'}
            </div>
            {isFlagged && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 mt-1.5">
                <IconAlertCircle className="w-3 h-3" />
                Ditandai tidak sesuai / perlu perbaikan
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
            <button
              type="button"
              disabled={isFormLocked}
              title={isFormLocked ? 'Data terkunci (Mode Baca)' : 'Tandai data sesuai'}
              onClick={() => handleToggleFieldFlag(sectionKey, fieldKey, label, false)}
              className={cn(
                'p-1.5 rounded text-xs transition-colors',
                isFormLocked ? 'cursor-default opacity-80' : 'cursor-pointer',
                !isFlagged
                  ? 'bg-emerald-100 text-emerald-800 font-medium'
                  : 'bg-white border border-slate-200 text-slate-400 hover:text-emerald-700 hover:bg-slate-100'
              )}
            >
              <IconCheck className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={isFormLocked}
              title={isFormLocked ? 'Data terkunci (Mode Baca)' : 'Tandai data salah / minta perbaikan'}
              onClick={() => handleToggleFieldFlag(sectionKey, fieldKey, label, true)}
              className={cn(
                'p-1.5 rounded text-xs transition-colors',
                isFormLocked ? 'cursor-default opacity-80' : 'cursor-pointer',
                isFlagged
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-slate-100'
              )}
            >
              <IconX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Handler to update document review status
  const handleUpdateDocStatus = (
    docId: string,
    newStatus: 'ACCEPTED' | 'REJECTED',
    docType: string,
    parentSectionKey?: 'BUSINESS_PROFILE' | 'REPRESENTATIVE' | 'SETTLEMENT' | 'OUTLET'
  ) => {
    setDocReviews((prevDocs) => {
      const updatedDocs = {
        ...prevDocs,
        [docId]: { ...prevDocs[docId], status: newStatus },
      };

      setSectionsState((prevSections) => {
        let updatedSections = prevSections;
        if (newStatus === 'REJECTED' && parentSectionKey && prevSections[parentSectionKey]) {
          updatedSections = {
            ...prevSections,
            [parentSectionKey]: {
              ...prevSections[parentSectionKey],
              status: 'CHANGES_REQUESTED',
            },
          };
          setDecision((d) => (d === 'REJECT' ? 'REJECT' : 'REQUEST_CHANGES'));
        } else if (newStatus === 'ACCEPTED') {
          const hasAnyChanges = Object.values(updatedSections).some((s) => s.status === 'CHANGES_REQUESTED');
          const hasAnyRejected = Object.values(updatedDocs).some((d) => d.status === 'REJECTED');
          if (!hasAnyChanges && !hasAnyRejected) {
            setDecision((d) => (d === 'REJECT' ? 'REJECT' : 'APPROVE'));
          }
        }
        return updatedSections;
      });

      return updatedDocs;
    });

    if (newStatus === 'ACCEPTED') {
      toast.success(`Dokumen ${docType} diterima`, { duration: 1500 });
    } else {
      toast.error(`Dokumen ${docType} ditolak (bagian terkait ditandai perlu perbaikan)`, { duration: 2500 });
    }
  };

  // Quick Action: Accept & Approve All
  const handleApproveAll = () => {
    setSectionsState((prev) => {
      const copy: Record<string, SectionReviewState> = {};
      Object.keys(prev).forEach((k) => {
        copy[k] = { ...prev[k], status: 'APPROVED', flaggedFields: [] };
      });
      return copy;
    });
    setDocReviews((prev) => {
      const copy: Record<string, DocumentReviewState> = {};
      Object.keys(prev).forEach((k) => {
        copy[k] = { ...prev[k], status: 'ACCEPTED' };
      });
      return copy;
    });
    setDecision('APPROVE');
    toast.success('Seluruh 4 bagian, dokumen legalitas, dan data form teks ditandai Sesuai.', { duration: 2000 });
  };

  // Decision selector handler with direct user feedback
  const handleSelectDecision = (newDecision: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT') => {
    setDecision(newDecision);
    if (newDecision === 'APPROVE') {
      toast.success('Pilihan keputusan: Setujui Pengajuan (Approve)', { duration: 1500 });
    } else if (newDecision === 'REQUEST_CHANGES') {
      toast.info('Pilihan keputusan: Minta Perbaikan (Merchant dapat merevisi)', { duration: 2000 });
    } else {
      toast.warning('Pilihan keputusan: Tolak Permanen (Reject)', { duration: 2000 });
    }
  };

  // Preview signed URL (TTL 60s)
  async function handlePreviewDocument(docId: string) {
    const res = await getVerificationDocumentSignedUrlAction(docId);
    if (res.success && res.signedUrl) {
      window.open(res.signedUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error(res.error || 'Gagal membuka pratinjau dokumen.');
    }
  }

  // Claim review
  async function handleClaimReview() {
    startTransition(async () => {
      const res = await claimVerificationReviewAction(submissionId);
      if (res.success) {
        toast.success('Pemeriksaan berhasil dimulai.');
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal memulai pemeriksaan.');
      }
    });
  }

  // Handle Reopening Locked Submission
  async function handleReopenSubmission() {
    if (!reopenNote.trim()) {
      toast.error('Harap cantumkan alasan pembukaan kembali pengajuan.');
      return;
    }
    startTransition(async () => {
      const res = await adminReopenVerificationAction(submissionId, reopenNote);
      if (res.success) {
        toast.success('Pengajuan berhasil dibuka kembali untuk merchant.');
        setIsReopenModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal membuka kembali pengajuan.');
      }
    });
  }

  // Submit Final Review Decision
  async function handleSubmitDecision(e: React.FormEvent) {
    e.preventDefault();

    let finalReason = decisionReason.trim();
    if (decision === 'REQUEST_CHANGES' && !finalReason) {
      // Auto-compile summary from section notes if empty
      const notesList = Object.entries(sectionsState)
        .filter(([_, s]) => s.status === 'CHANGES_REQUESTED' && s.note.trim())
        .map(([k, s]) => `${k}: ${s.note}`);
      if (notesList.length > 0) {
        finalReason = notesList.join('; ');
        setDecisionReason(finalReason);
      } else {
        toast.error('Harap isi alasan perbaikan yang wajib dilakukan merchant.');
        return;
      }
    }

    if (decision === 'REJECT' && !finalReason) {
      toast.error('Harap cantumkan alasan penolakan permanen.');
      return;
    }

    const sectionReviewsArray = Object.entries(sectionsState).map(([section, val]) => ({
      section: section as any,
      status: val.status,
      note: val.note || null,
      flaggedFields: val.flaggedFields.length > 0 ? val.flaggedFields : null,
    }));

    const docReviewsArray = Object.values(docReviews);

    startTransition(async () => {
      const res = await submitVerificationDecisionAction(submissionId, {
        decision,
        reason: finalReason,
        internalNotes,
        documentReviews: docReviewsArray,
        sectionReviews: sectionReviewsArray,
      });

      if (res.success) {
        toast.success(`Keputusan verifikasi (${decision}) berhasil disimpan.`);
        router.push('/system-admin/verification');
      } else {
        toast.error(res.error || 'Gagal menyimpan keputusan verifikasi.');
      }
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xl text-[11px] font-medium border-none bg-emerald-100/80 text-emerald-700">
            Terverifikasi
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xl text-[11px] font-medium border-none bg-purple-100/80 text-purple-700">
            Sedang Ditinjau
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xl text-[11px] font-medium border-none bg-sky-100/80 text-sky-700">
            Antrean Baru
          </span>
        );
      case 'action_required':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xl text-[11px] font-medium border-none bg-amber-100/80 text-amber-700">
            Perlu Perbaikan
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xl text-[11px] font-medium border-none bg-rose-100/70 text-rose-700">
            Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xl text-[11px] font-medium border-none bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  }

  const submittedDate = submission.submittedAt
    ? new Date(submission.submittedAt)
    : submission.createdAt
    ? new Date(submission.createdAt)
    : null;
  const isValidSubmittedDate =
    submittedDate && !isNaN(submittedDate.getTime()) && submittedDate.getFullYear() > 1970;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <Link
            href="/system-admin/verification"
            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
          >
            <IconArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-neutral-900">
                Pemeriksaan: {submission.businessProfileName}
              </h1>
              {getStatusBadge(submission.status)}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Outlet: {submission.tenantName || 'Semua Outlet'} • Pengajuan ke-{submission.attemptNumber} • Diajukan:{' '}
              {isValidSubmittedDate
                ? submittedDate.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Baru saja'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isFormLocked && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApproveAll}
              className="text-xs font-semibold text-emerald-700 bg-emerald-50/60 border-emerald-300 hover:bg-emerald-100/80 transition-colors shadow-2xs"
            >
              <IconCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Terima Semua &amp; Tandai Sesuai
            </Button>
          )}

          {!isSuperseded && (submission.status === 'rejected' || submission.status === 'action_required') && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReopenModalOpen(true)}
              className="text-xs font-medium text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              <IconRefresh className="w-3.5 h-3.5 mr-1" />
              Buka Kembali Pengajuan
            </Button>
          )}

          {!isFormLocked && submission.status === 'submitted' && (
            <Button
              type="button"
              onClick={handleClaimReview}
              disabled={isPending}
              className="bg-[#0e59f9] hover:bg-[#0e59f9]/90 text-white text-xs font-medium"
            >
              Mulai Periksa Pengajuan Ini
            </Button>
          )}
        </div>
      </div>

      {/* Lifecycle & Immutability Banners */}
      {isSuperseded && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
              <IconLock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-900 text-sm">
                  Pengajuan Ini Telah Digantikan (Arsip Riwayat Ke-{submission.attemptNumber})
                </h4>
                <span className="px-2 py-0.5 rounded-xl text-[10px] font-medium bg-slate-200 text-slate-700">
                  Read-Only Archive
                </span>
              </div>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Merchant telah memperbarui data dan mengirimkan{' '}
                <strong>Pengajuan Ke-{newerAttemptNumber || 'Terbaru'}</strong>. Formulir ini dikunci sebagai arsip riwayat audit dan tidak dapat diubah lagi.
              </p>
            </div>
          </div>
          {newerSubmissionId && (
            <Link
              href={`/system-admin/verification/${newerSubmissionId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e59f9] hover:bg-[#0e59f9]/90 text-white text-xs font-semibold shrink-0 transition-colors shadow-2xs"
            >
              <span>Buka Pengajuan Terkini (Ke-{newerAttemptNumber})</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {!isSuperseded && isDecisionIssued && submission.status === 'action_required' && (
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <IconClock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-amber-950 text-sm">
                Keputusan Telah Dikirim ke Merchant (Menunggu Revisi)
              </h4>
              <span className="px-2 py-0.5 rounded-xl text-[10px] font-medium bg-amber-100 text-amber-800">
                Menunggu Perbaikan
              </span>
            </div>
            <p className="text-amber-800/90 mt-1 leading-relaxed">
              Permintaan perbaikan telah diterbitkan ke merchant. Formulir dikunci dalam mode baca untuk mencegah perubahan sepihak sampai merchant mengajukan perbaikan data baru.
            </p>
          </div>
        </div>
      )}

      {!isSuperseded && submission.status === 'verified' && (
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
            <IconCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-emerald-950 text-sm">
                Pengajuan Terverifikasi &amp; Aktif
              </h4>
              <span className="px-2 py-0.5 rounded-xl text-[10px] font-medium bg-emerald-100 text-emerald-800">
                Selesai
              </span>
            </div>
            <p className="text-emerald-800/90 mt-1 leading-relaxed">
              Seluruh data bisnis dan kepatuhan outlet telah disetujui. Merchant telah memenuhi persyaratan verifikasi operasional.
            </p>
          </div>
        </div>
      )}

      {/* Main 4-Section Review Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 4 Sequential Section Cards (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Guide / Instruction Banner for Admin */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2.5">
            <IconShieldCheck className="w-4 h-4 text-[#0e59f9] flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold block text-blue-950">
                Pemeriksaan Komprehensif: Dokumen &amp; Field Formulir Teks
              </span>
              <p className="text-blue-800/90 leading-relaxed text-[11px]">
                Anda dapat memvalidasi setiap berkas dokumen terlampir maupun field formulir teks (seperti NIB, NPWP, NIK, Rekening Bank, dan Alamat). Gunakan tombol centang hijau untuk menandai data Sesuai, atau tombol silang merah jika data memerlukan perbaikan dari merchant.
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SEKSI 1: PROFIL USAHA & LEGALITAS                         */}
          {/* ========================================================= */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
            {/* Card Header with Section Status Toggle */}
            <div className="p-4 bg-slate-50 border-b border-neutral-200 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0e59f9]/10 text-[#0e59f9] flex items-center justify-center flex-shrink-0">
                  <IconBuildingStore className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Bagian 1: Profil Usaha &amp; Legalitas
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bentuk entitas badan hukum, NIB 13 digit, dan NPWP usaha
                  </p>
                </div>
              </div>

              {/* Status Toggle Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isFormLocked}
                  onClick={() =>
                    handleUpdateSectionStatus('BUSINESS_PROFILE', 'APPROVED', 'Bagian 1: Profil Usaha & Legalitas')
                  }
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors',
                    isFormLocked ? 'cursor-default' : 'cursor-pointer',
                    sectionsState.BUSINESS_PROFILE.status === 'APPROVED'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  )}
                >
                  <IconCheck className="w-3.5 h-3.5" />
                  <span>Sesuai</span>
                </button>
                <button
                  type="button"
                  disabled={isFormLocked}
                  onClick={() =>
                    handleUpdateSectionStatus('BUSINESS_PROFILE', 'CHANGES_REQUESTED', 'Bagian 1: Profil Usaha & Legalitas')
                  }
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors',
                    isFormLocked ? 'cursor-default' : 'cursor-pointer',
                    sectionsState.BUSINESS_PROFILE.status === 'CHANGES_REQUESTED'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  )}
                >
                  <IconX className="w-3.5 h-3.5" />
                  <span>Perlu Perbaikan</span>
                </button>
              </div>
            </div>

            {/* Card Content Data */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {renderFieldWithCheck(
                  'BUSINESS_PROFILE',
                  'name',
                  'Nama Legal Badan Usaha',
                  snapshot.profile?.name || submission.businessProfileName
                )}
                {renderFieldWithCheck(
                  'BUSINESS_PROFILE',
                  'entityType',
                  'Bentuk Entitas Hukum',
                  snapshot.profile?.entityType || submission.businessEntityType
                )}
                {renderFieldWithCheck(
                  'BUSINESS_PROFILE',
                  'businessLicenseNumber',
                  'Nomor Induk Berusaha (NIB)',
                  snapshot.profile?.businessLicenseNumber || submission.businessProfileLicenseNumber
                )}
                {renderFieldWithCheck(
                  'BUSINESS_PROFILE',
                  'taxId',
                  'Nomor Pokok Wajib Pajak (NPWP)',
                  snapshot.profile?.taxId || submission.businessProfileTaxId
                )}
              </div>

              {/* Documents attached for Business Profile */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">Dokumen Legalitas Terlampir:</span>
                {documents.filter((d: any) => ['NIB', 'NPWP', 'AKTA'].includes(d.documentType)).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Tidak ada lampiran dokumen untuk profil ini.</p>
                ) : (
                  documents
                    .filter((d: any) => ['NIB', 'NPWP', 'AKTA'].includes(d.documentType))
                    .map((doc: any) => {
                      const review = docReviews[doc.id] || { status: 'ACCEPTED', note: '' };
                      return (
                        <div
                          key={doc.id}
                          className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex items-center gap-2.5">
                            <IconFileText className="w-4 h-4 text-[#0e59f9] flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900 block truncate">
                                {doc.documentType}: {doc.fileName}
                              </span>
                              <button
                                type="button"
                                onClick={() => handlePreviewDocument(doc.id)}
                                className="text-[11px] text-[#0e59f9] hover:underline inline-flex items-center gap-1 mt-0.5 cursor-pointer font-medium"
                              >
                                <span>Buka Dokumen</span>
                                <IconExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              disabled={isFormLocked}
                              onClick={() =>
                                handleUpdateDocStatus(doc.id, 'ACCEPTED', doc.documentType, 'BUSINESS_PROFILE')
                              }
                              className={cn(
                                'px-2.5 py-1 rounded text-[11px] font-semibold transition-colors',
                                isFormLocked ? 'cursor-default' : 'cursor-pointer',
                                review.status === 'ACCEPTED'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                              )}
                            >
                              Terima
                            </button>
                            <button
                              type="button"
                              disabled={isFormLocked}
                              onClick={() =>
                                handleUpdateDocStatus(doc.id, 'REJECTED', doc.documentType, 'BUSINESS_PROFILE')
                              }
                              className={cn(
                                'px-2.5 py-1 rounded text-[11px] font-semibold transition-colors',
                                isFormLocked ? 'cursor-default' : 'cursor-pointer',
                                review.status === 'REJECTED'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                              )}
                            >
                              Tolak
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Rejection / Note Input if Changes Requested */}
              {sectionsState.BUSINESS_PROFILE.status === 'CHANGES_REQUESTED' && (
                <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
                  <Label className="text-xs font-semibold text-amber-900 block">
                    Catatan Perbaikan Profil Usaha untuk Merchant (Wajib):
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="Contoh: Dokumen NIB buram dan tidak terbaca jelas pada nomor izin..."
                    value={sectionsState.BUSINESS_PROFILE.note}
                    onChange={(e) =>
                      setSectionsState((prev) => ({
                        ...prev,
                        BUSINESS_PROFILE: { ...prev.BUSINESS_PROFILE, note: e.target.value },
                      }))
                    }
                    className="text-xs bg-white border-amber-200"
                  />
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-amber-800">
                    <span className="font-medium">Centang temuan:</span>
                    {['NIB Tidak Valid / Kadaluarsa', 'NPWP Tidak Cocok', 'Dokumen Buram / Terpotong'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = sectionsState.BUSINESS_PROFILE.note;
                          setSectionsState((prev) => ({
                            ...prev,
                            BUSINESS_PROFILE: {
                              ...prev.BUSINESS_PROFILE,
                              note: current ? `${current}. ${tag}` : tag,
                            },
                          }));
                        }}
                        className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer font-medium"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* SEKSI 2: PERWAKILAN BISNIS (PENANGGUNG JAWAB)             */}
          {/* ========================================================= */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
            <div className="p-4 bg-slate-50 border-b border-neutral-200 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0e59f9]/10 text-[#0e59f9] flex items-center justify-center flex-shrink-0">
                  <IconUserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Bagian 2: Informasi Perwakilan Bisnis
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Identitas resmi penanggung jawab usaha / direktur utama sesuai e-KTP
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isFormLocked}
                  onClick={() =>
                    handleUpdateSectionStatus('REPRESENTATIVE', 'APPROVED', 'Bagian 2: Informasi Perwakilan Bisnis')
                  }
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors',
                    isFormLocked ? 'cursor-default' : 'cursor-pointer',
                    sectionsState.REPRESENTATIVE.status === 'APPROVED'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  )}
                >
                  <IconCheck className="w-3.5 h-3.5" />
                  <span>Sesuai</span>
                </button>
                <button
                  type="button"
                  disabled={isFormLocked}
                  onClick={() =>
                    handleUpdateSectionStatus('REPRESENTATIVE', 'CHANGES_REQUESTED', 'Bagian 2: Informasi Perwakilan Bisnis')
                  }
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors',
                    isFormLocked ? 'cursor-default' : 'cursor-pointer',
                    sectionsState.REPRESENTATIVE.status === 'CHANGES_REQUESTED'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  )}
                >
                  <IconX className="w-3.5 h-3.5" />
                  <span>Perlu Perbaikan</span>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {renderFieldWithCheck(
                  'REPRESENTATIVE',
                  'responsiblePersonName',
                  'Nama Lengkap Penanggung Jawab',
                  snapshot.representative?.responsiblePersonName ||
                    submission.businessProfileResponsiblePersonName ||
                    '-'
                )}
                {renderFieldWithCheck(
                  'REPRESENTATIVE',
                  'responsiblePersonPosition',
                  'Jabatan di Perusahaan',
                  snapshot.representative?.responsiblePersonPosition || 'Pemilik'
                )}
                {renderFieldWithCheck(
                  'REPRESENTATIVE',
                  'responsiblePersonNik',
                  'NIK e-KTP (16 Digit)',
                  snapshot.representative?.responsiblePersonNik ||
                    submission.businessProfileResponsiblePersonNik ||
                    '-'
                )}
                {renderFieldWithCheck(
                  'REPRESENTATIVE',
                  'responsiblePersonPhone',
                  'Kontak Telepon / WhatsApp',
                  snapshot.representative?.responsiblePersonPhone ||
                    snapshot.representative?.responsiblePersonContact ||
                    submission.businessProfileResponsiblePersonContact ||
                    '-'
                )}
                {renderFieldWithCheck(
                  'REPRESENTATIVE',
                  'responsiblePersonEmail',
                  'Email',
                  snapshot.representative?.responsiblePersonEmail || '-'
                )}
                {renderFieldWithCheck(
                  'REPRESENTATIVE',
                  'responsiblePersonNationality',
                  'Kewarganegaraan',
                  snapshot.representative?.responsiblePersonNationality || 'Indonesia'
                )}
              </div>

              {/* KTP Document */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">Dokumen e-KTP Penanggung Jawab:</span>
                {documents.filter((d: any) => d.documentType === 'KTP').map((doc: any) => {
                  const review = docReviews[doc.id] || { status: 'ACCEPTED', note: '' };
                  return (
                    <div
                      key={doc.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <IconFileText className="w-4 h-4 text-[#0e59f9] flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 block truncate">
                            e-KTP: {doc.fileName}
                          </span>
                          <button
                            type="button"
                            onClick={() => handlePreviewDocument(doc.id)}
                            className="text-[11px] text-[#0e59f9] hover:underline inline-flex items-center gap-1 mt-0.5 cursor-pointer font-medium"
                          >
                            <span>Lihat Foto e-KTP</span>
                            <IconExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          disabled={isFormLocked}
                          onClick={() =>
                            handleUpdateDocStatus(doc.id, 'ACCEPTED', doc.documentType, 'REPRESENTATIVE')
                          }
                          className={cn(
                            'px-2.5 py-1 rounded text-[11px] font-semibold transition-colors',
                            isFormLocked ? 'cursor-default' : 'cursor-pointer',
                            review.status === 'ACCEPTED'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          )}
                        >
                          Terima
                        </button>
                        <button
                          type="button"
                          disabled={isFormLocked}
                          onClick={() =>
                            handleUpdateDocStatus(doc.id, 'REJECTED', doc.documentType, 'REPRESENTATIVE')
                          }
                          className={cn(
                            'px-2.5 py-1 rounded text-[11px] font-semibold transition-colors',
                            isFormLocked ? 'cursor-default' : 'cursor-pointer',
                            review.status === 'REJECTED'
                              ? 'bg-rose-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          )}
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {sectionsState.REPRESENTATIVE.status === 'CHANGES_REQUESTED' && (
                <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
                  <Label className="text-xs font-semibold text-amber-900 block">
                    Catatan Perbaikan Perwakilan Bisnis untuk Merchant:
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="Contoh: Foto e-KTP buram dan NIK tidak terbaca jelas..."
                    value={sectionsState.REPRESENTATIVE.note}
                    onChange={(e) =>
                      setSectionsState((prev) => ({
                        ...prev,
                        REPRESENTATIVE: { ...prev.REPRESENTATIVE, note: e.target.value },
                      }))
                    }
                    className="text-xs bg-white border-amber-200"
                  />
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-amber-800">
                    <span className="font-medium">Centang temuan:</span>
                    {['NIK Tidak Cocok dengan KTP', 'Foto KTP Buram / Terpotong', 'KTP Bukan Asli / Fotokopi'].map(
                      (tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const current = sectionsState.REPRESENTATIVE.note;
                            setSectionsState((prev) => ({
                              ...prev,
                              REPRESENTATIVE: {
                                ...prev.REPRESENTATIVE,
                                note: current ? `${current}. ${tag}` : tag,
                              },
                            }));
                          }}
                          className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer font-medium"
                        >
                          + {tag}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* SEKSI 3: REKENING SETTLEMENT BANK                         */}
          {/* ========================================================= */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
            <div className="p-4 bg-slate-50 border-b border-neutral-200 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0e59f9]/10 text-[#0e59f9] flex items-center justify-center flex-shrink-0">
                  <IconBuildingBank className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Bagian 3: Rekening Settlement Bank
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Rekening pencairan dana otomatis hasil transaksi pembayaran QRIS
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isFormLocked}
                  onClick={() =>
                    handleUpdateSectionStatus('SETTLEMENT', 'APPROVED', 'Bagian 3: Rekening Settlement Bank')
                  }
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors',
                    isFormLocked ? 'cursor-default' : 'cursor-pointer',
                    sectionsState.SETTLEMENT.status === 'APPROVED'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  )}
                >
                  <IconCheck className="w-3.5 h-3.5" />
                  <span>Sesuai</span>
                </button>
                <button
                  type="button"
                  disabled={isFormLocked}
                  onClick={() =>
                    handleUpdateSectionStatus('SETTLEMENT', 'CHANGES_REQUESTED', 'Bagian 3: Rekening Settlement Bank')
                  }
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors',
                    isFormLocked ? 'cursor-default' : 'cursor-pointer',
                    sectionsState.SETTLEMENT.status === 'CHANGES_REQUESTED'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  )}
                >
                  <IconX className="w-3.5 h-3.5" />
                  <span>Perlu Perbaikan</span>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {renderFieldWithCheck(
                  'SETTLEMENT',
                  'bankName',
                  'Nama Bank',
                  activeSettlementAcc?.bankName || snapshot.settlement?.bankName || '-'
                )}
                {renderFieldWithCheck(
                  'SETTLEMENT',
                  'bankAccountNumber',
                  'Nomor Rekening',
                  activeSettlementAcc?.bankAccountNumberMasked || snapshot.settlement?.bankAccountNumber || '-'
                )}
                {renderFieldWithCheck(
                  'SETTLEMENT',
                  'bankAccountHolder',
                  'Nama Pemilik Rekening',
                  activeSettlementAcc?.bankAccountHolder || snapshot.settlement?.bankAccountHolder || '-'
                )}
                <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/60 text-xs">
                  <span className="text-[11px] text-slate-500 block font-medium">Status Rekening Terdaftar</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {activeSettlementAcc?.verificationStatus || 'Baru diajukan'}
                  </span>
                </div>
              </div>

              {sectionsState.SETTLEMENT.status === 'CHANGES_REQUESTED' && (
                <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
                  <Label className="text-xs font-semibold text-amber-900 block">
                    Catatan Penolakan Rekening Bank:
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="Contoh: Nama pemilik rekening tidak cocok dengan nama badan usaha atau direktur..."
                    value={sectionsState.SETTLEMENT.note}
                    onChange={(e) =>
                      setSectionsState((prev) => ({
                        ...prev,
                        SETTLEMENT: { ...prev.SETTLEMENT, note: e.target.value },
                      }))
                    }
                    className="text-xs bg-white border-amber-200"
                  />
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-amber-800">
                    <span className="font-medium">Centang temuan:</span>
                    {['Nama Rekening Tidak Sesuai KTP/PT', 'Nomor Rekening Tidak Valid', 'Buku Tabungan Belum Dilampirkan'].map(
                      (tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const current = sectionsState.SETTLEMENT.note;
                            setSectionsState((prev) => ({
                              ...prev,
                              SETTLEMENT: {
                                ...prev.SETTLEMENT,
                                note: current ? `${current}. ${tag}` : tag,
                              },
                            }));
                          }}
                          className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer font-medium"
                        >
                          + {tag}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* SEKSI 4: KEPATUHAN LOKASI & FISIK GERAI                   */}
          {/* ========================================================= */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
            <div className="p-4 bg-slate-50 border-b border-neutral-200 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0e59f9]/10 text-[#0e59f9] flex items-center justify-center flex-shrink-0">
                  <IconMapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Bagian 4: Kepatuhan Lokasi Fisik Gerai
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Alamat operasional fisik, titik koordinat GPS, foto fasad dan meja kasir
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isFormLocked}
                  onClick={() =>
                    handleUpdateSectionStatus('OUTLET', 'APPROVED', 'Bagian 4: Kepatuhan Lokasi Fisik Gerai')
                  }
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors',
                    isFormLocked ? 'cursor-default' : 'cursor-pointer',
                    sectionsState.OUTLET.status === 'APPROVED'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  )}
                >
                  <IconCheck className="w-3.5 h-3.5" />
                  <span>Sesuai</span>
                </button>
                <button
                  type="button"
                  disabled={isFormLocked}
                  onClick={() =>
                    handleUpdateSectionStatus('OUTLET', 'CHANGES_REQUESTED', 'Bagian 4: Kepatuhan Lokasi Fisik Gerai')
                  }
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors',
                    isFormLocked ? 'cursor-default' : 'cursor-pointer',
                    sectionsState.OUTLET.status === 'CHANGES_REQUESTED'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  )}
                >
                  <IconX className="w-3.5 h-3.5" />
                  <span>Perlu Perbaikan</span>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {renderFieldWithCheck(
                  'OUTLET',
                  'outletAddress',
                  'Alamat Lengkap Gerai',
                  snapshot.outlet?.address || submission.tenantAddress || '-',
                  'sm:col-span-2'
                )}
                {renderFieldWithCheck(
                  'OUTLET',
                  'outletDistrict',
                  'Wilayah / Daerah',
                  `${snapshot.outlet?.district ? `${snapshot.outlet.district}, ` : ''}${snapshot.outlet?.city || submission.tenantCity || ''}, ${snapshot.outlet?.province || ''} ${snapshot.outlet?.postalCode || submission.tenantPostalCode || ''}`
                )}
                {renderFieldWithCheck(
                  'OUTLET',
                  'outletCoordinates',
                  'Koordinat GPS / Maps Link',
                  snapshot.outlet?.mapsUrl || submission.tenantMapsUrl ? (
                    <a
                      href={snapshot.outlet?.mapsUrl || submission.tenantMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#0e59f9] hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      <span>Lihat di Google Maps</span>
                      <IconExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : snapshot.outlet?.latitude && snapshot.outlet?.longitude ? (
                    `${snapshot.outlet.latitude}, ${snapshot.outlet.longitude}`
                  ) : (
                    '-'
                  )
                )}
              </div>

              {/* Photos attached for Outlet */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">Foto Fisik Gerai Terlampir:</span>
                {documents.filter((d: any) => ['FOTO_TAMPAK_DEPAN', 'FOTO_KASIR', 'IZIN_LOKASI'].includes(d.documentType)).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Tidak ada foto outlet terlampir.</p>
                ) : (
                  documents
                    .filter((d: any) => ['FOTO_TAMPAK_DEPAN', 'FOTO_KASIR', 'IZIN_LOKASI'].includes(d.documentType))
                    .map((doc: any) => {
                      const review = docReviews[doc.id] || { status: 'ACCEPTED', note: '' };
                      return (
                        <div
                          key={doc.id}
                          className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex items-center gap-2.5">
                            <IconPhoto className="w-4 h-4 text-[#0e59f9] flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900 block truncate">
                                {doc.documentType === 'FOTO_TAMPAK_DEPAN'
                                  ? 'Foto Tampak Depan (Fasad)'
                                  : doc.documentType === 'FOTO_KASIR'
                                  ? 'Foto Meja Kasir / Operasional'
                                  : doc.documentType}
                                : {doc.fileName}
                              </span>
                              <button
                                type="button"
                                onClick={() => handlePreviewDocument(doc.id)}
                                className="text-[11px] text-[#0e59f9] hover:underline inline-flex items-center gap-1 mt-0.5 cursor-pointer font-medium"
                              >
                                <span>Lihat Foto Penuh</span>
                                <IconExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              disabled={isFormLocked}
                              onClick={() =>
                                handleUpdateDocStatus(doc.id, 'ACCEPTED', doc.documentType, 'OUTLET')
                              }
                              className={cn(
                                'px-2.5 py-1 rounded text-[11px] font-semibold transition-colors',
                                isFormLocked ? 'cursor-default' : 'cursor-pointer',
                                review.status === 'ACCEPTED'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                              )}
                            >
                              Terima
                            </button>
                            <button
                              type="button"
                              disabled={isFormLocked}
                              onClick={() =>
                                handleUpdateDocStatus(doc.id, 'REJECTED', doc.documentType, 'OUTLET')
                              }
                              className={cn(
                                'px-2.5 py-1 rounded text-[11px] font-semibold transition-colors',
                                isFormLocked ? 'cursor-default' : 'cursor-pointer',
                                review.status === 'REJECTED'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                              )}
                            >
                              Tolak
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {sectionsState.OUTLET.status === 'CHANGES_REQUESTED' && (
                <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
                  <Label className="text-xs font-semibold text-amber-900 block">
                    Catatan Perbaikan Kepatuhan Gerai:
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="Contoh: Foto tampak depan tidak memperlihatkan plang nama toko secara jelas..."
                    value={sectionsState.OUTLET.note}
                    onChange={(e) =>
                      setSectionsState((prev) => ({
                        ...prev,
                        OUTLET: { ...prev.OUTLET, note: e.target.value },
                      }))
                    }
                    className="text-xs bg-white border-amber-200"
                  />
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-amber-800">
                    <span className="font-medium">Centang temuan:</span>
                    {['Fasad / Plang Toko Tidak Jelas', 'Foto Meja Kasir Buram', 'Titik Koordinat Tidak Sesuai'].map(
                      (tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const current = sectionsState.OUTLET.note;
                            setSectionsState((prev) => ({
                              ...prev,
                              OUTLET: {
                                ...prev.OUTLET,
                                note: current ? `${current}. ${tag}` : tag,
                              },
                            }));
                          }}
                          className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer font-medium"
                        >
                          + {tag}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Review Decision Console (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {isFormLocked ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4 sticky top-6 shadow-2xs">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <IconLock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">
                    {isSuperseded ? 'Arsip Pengajuan Riwayat' : 'Keputusan Terkunci'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {isSuperseded ? `Digantikan Ke-${newerAttemptNumber}` : 'Status Final Pengajuan'}
                  </p>
                </div>
              </div>

              {isSuperseded ? (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Pengajuan ini adalah arsip audit riwayat. Merchant telah memperbarui data pada{' '}
                    <strong>Pengajuan Ke-{newerAttemptNumber}</strong>. Keputusan hanya dapat diproses pada pengajuan terkini.
                  </p>
                  {newerSubmissionId && (
                    <Link
                      href={`/system-admin/verification/${newerSubmissionId}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0e59f9] hover:bg-[#0e59f9]/90 text-white text-xs font-semibold transition-colors shadow-2xs"
                    >
                      <span>Tinjau Pengajuan Terkini (Ke-{newerAttemptNumber})</span>
                      <IconArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-normal">Status Pengajuan</span>
                    <div className="mt-1">{getStatusBadge(submission.status)}</div>
                  </div>

                  {submission.decisionReason && (
                    <div>
                      <span className="text-[11px] text-slate-400 block font-normal">Catatan untuk Merchant</span>
                      <p className="text-xs font-medium text-slate-800 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
                        {submission.decisionReason}
                      </p>
                    </div>
                  )}

                  {submission.internalNotes && (
                    <div>
                      <span className="text-[11px] text-slate-400 block font-normal">Catatan Internal</span>
                      <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
                        {submission.internalNotes}
                      </p>
                    </div>
                  )}

                  {submission.status === 'action_required' && (
                    <div className="p-3 rounded-lg bg-amber-50 text-amber-800 text-[11px] leading-relaxed border border-amber-200/60">
                      Menunggu merchant mengunggah perbaikan data melalui portal merchant. Form akan diperbarui secara otomatis ketika data perbaikan masuk.
                    </div>
                  )}

                  {submission.status === 'verified' && (
                    <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] leading-relaxed border border-emerald-200/60">
                      Pengajuan telah disetujui. Merchant telah siap untuk aktivasi metode pembayaran QRIS.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSubmitDecision}
              className="bg-white rounded-xl border border-neutral-200 p-5 space-y-5 sticky top-6 shadow-2xs"
            >
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                  <IconShieldCheck className="w-4 h-4 text-[#0e59f9]" />
                  Ringkasan Keputusan Kepatuhan
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Evaluasi otomatis berdasarkan status 4 bagian pengajuan di sebelah kiri.
                </p>
              </div>

              {/* Decision Radio Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">Pilihan Keputusan Akhir:</label>

                <div
                  onClick={() => handleSelectDecision('APPROVE')}
                  className={cn(
                    'p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between',
                    decision === 'APPROVE'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-semibold ring-1 ring-emerald-500/30'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <div>
                    <span className="block">Setujui Pengajuan (Approve)</span>
                    <span className="text-[11px] text-emerald-700 font-normal">
                      Seluruh 4 bagian lolos verifikasi kepatuhan.
                    </span>
                  </div>
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0',
                      decision === 'APPROVE' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                    )}
                  >
                    {decision === 'APPROVE' && <IconCheck className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>

                <div
                  onClick={() => handleSelectDecision('REQUEST_CHANGES')}
                  className={cn(
                    'p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between',
                    decision === 'REQUEST_CHANGES'
                      ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-semibold ring-1 ring-amber-500/30'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <div>
                    <span className="block">Minta Perbaikan (Request Changes)</span>
                    <span className="text-[11px] text-amber-700 font-normal">
                      Merchant dapat memperbaiki bagian yang ditandai.
                    </span>
                  </div>
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0',
                      decision === 'REQUEST_CHANGES' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
                    )}
                  >
                    {decision === 'REQUEST_CHANGES' && <IconCheck className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>

                <div
                  onClick={() => handleSelectDecision('REJECT')}
                  className={cn(
                    'p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between',
                    decision === 'REJECT'
                      ? 'border-rose-500 bg-rose-50/50 text-rose-950 font-semibold ring-1 ring-rose-500/30'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <div>
                    <span className="block">Tolak Permanen (Reject)</span>
                    <span className="text-[11px] text-rose-700 font-normal">
                      Hanya untuk indikasi fraud / merchant terkunci.
                    </span>
                  </div>
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0',
                      decision === 'REJECT' ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300'
                    )}
                  >
                    {decision === 'REJECT' && <IconCheck className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
              </div>

              {/* Decision Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Pesan Resmi untuk Merchant {decision === 'REQUEST_CHANGES' || decision === 'REJECT' ? '*' : '(Opsional)'}
                </Label>
                <Textarea
                  rows={3}
                  placeholder={
                    decision === 'APPROVE'
                      ? 'Pesan selamat atau petunjuk aktivasi pembayaran...'
                      : 'Rincian perbaikan yang harus dipenuhi oleh merchant...'
                  }
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Internal Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Catatan Internal Admin (Opsional)</Label>
                <Textarea
                  rows={2}
                  placeholder="Catatan rahasia tim kepatuhan..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className={cn(
                  'w-full text-xs font-semibold h-9 shadow-xs',
                  decision === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : decision === 'REQUEST_CHANGES'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                )}
              >
                {isPending
                  ? 'Menyimpan Keputusan...'
                  : decision === 'APPROVE'
                  ? 'Setujui Pengajuan Ini'
                  : decision === 'REQUEST_CHANGES'
                  ? 'Kirim Permintaan Perbaikan'
                  : 'Tolak Permanen'}
              </Button>
            </form>
          )}

          {/* Audit History Timeline */}
          {auditHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs pb-2 border-b border-slate-100">
                <IconHistory className="w-3.5 h-3.5 text-slate-500" />
                <span>Riwayat Audit Verifikasi</span>
              </div>
              <div className="space-y-3">
                {auditHistory.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="text-xs flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-800 block text-[11px]">
                        {log.action} ({log.actorRole})
                      </span>
                      {log.reason && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{log.reason}</p>
                      )}
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(log.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Buka Kembali Pengajuan (Admin Reopen) */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-neutral-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Buka Kembali Pengajuan Merchant</h3>
              <p className="text-xs text-slate-500 mt-1">
                Aksi ini membuka kembali akses onboarding untuk merchant agar dapat memperbaiki data dan mengajukan ulang verifikasi.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Alasan Pembukaan Kembali *</Label>
              <Textarea
                rows={3}
                placeholder="Contoh: Merchant telah mengonfirmasi bahwa data NIB dan rekening baru sudah disiapkan..."
                value={reopenNote}
                onChange={(e) => setReopenNote(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsReopenModalOpen(false)}
                disabled={isPending}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleReopenSubmission}
                disabled={isPending}
                className="bg-[#0e59f9] hover:bg-[#0e59f9]/90 text-white text-xs font-medium"
              >
                {isPending ? 'Membuka...' : 'Buka Kembali Sekarang'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
