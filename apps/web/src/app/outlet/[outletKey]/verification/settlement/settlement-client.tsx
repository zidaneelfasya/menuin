'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/verification/shared/page-header';
import { SectionCard } from '@/components/verification/shared/section-card';
import { StatusPill } from '@/components/verification/shared/status-pill';
import { Plus, Landmark, Loader2 } from 'lucide-react';
import {
  setDefaultSettlementAccountAction,
  linkOutletSettlementAccountAction,
} from '@/lib/actions/settlement-accounts';
import { toast } from 'sonner';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

interface SettlementClientProps {
  outletKey: string;
  data: any;
}

export function SettlementClient({ outletKey, data }: SettlementClientProps) {
  const router = useRouter();
  const { businessProfile, settlementAccounts = [], activeSettlementAccount, tenant, isOwner = true } = data;
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  // Determine section review status
  const saSection = data.sectionReviewsMap?.['SETTLEMENT'];
  const sectionStatus: 'verified' | 'action_required' | 'under_review' | 'incomplete' = saSection
    ? saSection.status === 'APPROVED'
      ? 'verified'
      : saSection.status === 'CHANGES_REQUESTED'
      ? 'action_required'
      : 'under_review'
    : activeSettlementAccount?.verificationStatus === 'verified'
    ? 'verified'
    : activeSettlementAccount?.verificationStatus === 'rejected' ||
      activeSettlementAccount?.verificationStatus === 'action_required'
    ? 'action_required'
    : activeSettlementAccount?.verificationStatus === 'pending'
    ? 'under_review'
    : 'incomplete';

  const handleSetDefault = async (accountId: string) => {
    if (!isOwner) {
      toast.error('Hanya Pemilik (Owner) yang dapat mengubah rekening utama.');
      return;
    }
    setProcessingId(accountId);
    try {
      const res = await setDefaultSettlementAccountAction(accountId);
      if (res.success) {
        toast.success('Rekening utama profil bisnis berhasil diperbarui.');
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal mengubah rekening utama.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleLinkToOutlet = async (accountId: string) => {
    if (!isOwner) {
      toast.error('Hanya Pemilik (Owner) yang dapat mengatur rekening outlet.');
      return;
    }
    setProcessingId(accountId);
    try {
      const res = await linkOutletSettlementAccountAction(outletKey, accountId);
      if (res.success) {
        toast.success('Rekening penampungan untuk outlet ini berhasil diatur.');
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal menautkan rekening ke outlet.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setProcessingId(null);
    }
  };

  if (!businessProfile) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={`Verifikasi Bisnis \u2022 ${tenant.name}`}
          title="Rekening Settlement"
          description="Rekening bank penampungan pencairan hasil transaksi QRIS dinamis."
        />
        <div className="bg-white rounded-2xl border-none shadow-sm-md hover:shadow-md transition-all p-8 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0e59f9] flex items-center justify-center mx-auto">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Profil Usaha Belum Didaftarkan
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Daftarkan profil bisnis terlebih dahulu untuk menambahkan rekening bank settlement penampungan.
            </p>
          </div>
          {isOwner ? (
            <Link
              href={`/outlet/${outletKey}/verification/onboarding?step=1`}
              className="inline-flex items-center justify-center h-9 px-5 rounded-full bg-[#0e59f9] text-white text-xs font-semibold hover:bg-[#0b4de0] transition-colors shadow-md"
            >
              Mulai Pengisian
            </Link>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-50 border-none shadow-xs text-xs text-slate-500">
              Pendaftaran rekening hanya dapat dilakukan oleh Pemilik (Owner) outlet.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Verifikasi Bisnis • ${tenant.name}`}
        title="Rekening Settlement"
        description="Rekening bank penampungan pencairan dana transaksi QRIS dinamis. Rekening dapat digunakan bersama oleh banyak outlet."
        badge={
          activeSettlementAccount ? (
            <StatusPill status={sectionStatus} />
          ) : undefined
        }
      >
        {isOwner && (
          <Link
            href={`/outlet/${outletKey}/verification/onboarding?step=3`}
            className="h-9 px-4 rounded-full bg-[#0e59f9] text-white hover:bg-[#0b4de0] text-xs font-semibold shadow-md inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Rekening</span>
          </Link>
        )}
      </PageHeader>

      <SectionCard
        eyebrow="Daftar Rekening Bank"
        title="Rekening Terdaftar"
        description="Pilih rekening bank penampungan yang akan digunakan untuk pencairan dana outlet ini."
        verificationStatus={sectionStatus}
        statusNote={saSection?.note || activeSettlementAccount?.verificationNotes}
      >
        {settlementAccounts.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            Belum ada rekening settlement yang terdaftar.
          </p>
        ) : (
          <div className="rounded-2xl border-none shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank & Nomor Rekening</TableHead>
                  <TableHead>Nama Pemilik</TableHead>
                  <TableHead>Kecocokan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Penggunaan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlementAccounts.map((acc: any) => {
                  const isCurrentOutletAccount = activeSettlementAccount?.id === acc.id;
                  const isBusy = processingId === acc.id;

                  return (
                    <TableRow key={acc.id}>
                      <TableCell className="font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            {acc.bankName}
                          </span>
                          <span>{acc.bankAccountNumberMasked}</span>
                        </div>
                      </TableCell>

                      <TableCell className="font-medium text-slate-700">
                        {acc.bankAccountHolder}
                      </TableCell>

                      <TableCell>
                        {acc.nameMatchScore !== null && acc.nameMatchScore !== undefined ? (
                          <span
                            className={`text-[11px] font-semibold ${
                              acc.nameMatchScore >= 80 ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {acc.nameMatchScore}% Cocok
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <StatusPill status={acc.verificationStatus} />
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {acc.isDefault && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#0e59f9]">
                              Utama
                            </span>
                          )}
                          {isCurrentOutletAccount && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                              Outlet Ini
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        {isOwner ? (
                          <div className="flex items-center justify-end gap-2">
                            {!acc.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSetDefault(acc.id)}
                                disabled={isBusy}
                                className="text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer disabled:opacity-50"
                              >
                                {isBusy ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  'Set Utama'
                                )}
                              </button>
                            )}
                            {!isCurrentOutletAccount && (
                              <button
                                type="button"
                                onClick={() => handleLinkToOutlet(acc.id)}
                                disabled={isBusy}
                                className="text-xs font-semibold text-[#0e59f9] hover:underline cursor-pointer disabled:opacity-50 ml-2"
                              >
                                Gunakan
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Mode Lihat</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
