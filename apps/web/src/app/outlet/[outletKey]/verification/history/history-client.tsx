'use client';

import * as React from 'react';
import { PageHeader } from '@/components/verification/shared/page-header';
import { SectionCard } from '@/components/verification/shared/section-card';
import { StatusPill } from '@/components/verification/shared/status-pill';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { History } from 'lucide-react';

interface HistoryClientProps {
  outletKey: string;
  data: any;
}

export function HistoryClient({ outletKey, data }: HistoryClientProps) {
  const { submissions = [], tenant } = data;
  const [filter, setFilter] = React.useState<'ALL' | 'UNDER_REVIEW' | 'ACTION_REQUIRED' | 'VERIFIED'>('ALL');

  const filteredSubmissions = React.useMemo(() => {
    if (filter === 'ALL') return submissions;
    if (filter === 'UNDER_REVIEW') {
      return submissions.filter(
        (s: any) =>
          s.status === 'submitted' ||
          s.status === 'under_review' ||
          s.status === 'ready_for_review' ||
          s.status === 'pending'
      );
    }
    if (filter === 'ACTION_REQUIRED') {
      return submissions.filter(
        (s: any) =>
          s.status === 'action_required' ||
          s.status === 'rejected' ||
          s.status === 'failed'
      );
    }
    if (filter === 'VERIFIED') {
      return submissions.filter(
        (s: any) => s.status === 'verified' || s.status === 'accepted' || s.status === 'active'
      );
    }
    return submissions;
  }, [submissions, filter]);

  const tabs = [
    { key: 'ALL' as const, label: 'Semua Pengajuan', count: submissions.length },
    {
      key: 'UNDER_REVIEW' as const,
      label: 'Ditinjau',
      count: submissions.filter(
        (s: any) =>
          s.status === 'submitted' ||
          s.status === 'under_review' ||
          s.status === 'ready_for_review' ||
          s.status === 'pending'
      ).length,
    },
    {
      key: 'ACTION_REQUIRED' as const,
      label: 'Perlu Revisi',
      count: submissions.filter(
        (s: any) =>
          s.status === 'action_required' ||
          s.status === 'rejected' ||
          s.status === 'failed'
      ).length,
    },
    {
      key: 'VERIFIED' as const,
      label: 'Disetujui',
      count: submissions.filter(
        (s: any) => s.status === 'verified' || s.status === 'accepted' || s.status === 'active'
      ).length,
    },
  ];

  const formatDate = (dateVal?: string | Date | null) => {
    if (!dateVal) return '-';
    const d = new Date(dateVal);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Verifikasi Bisnis \u2022 ${tenant.name}`}
        title="Riwayat Pengajuan"
        description="Jejak audit seluruh pengajuan verifikasi berkas legalitas dan kepatuhan gerai fisik."
      />

      <SectionCard>
        {/* Underline Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pt-1">
            {tabs.map((tab) => {
              const isActive = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    'relative pb-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap',
                    isActive
                      ? 'text-[#0e59f9] font-semibold'
                      : 'text-slate-500 hover:text-[#0e59f9]'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-lg font-medium transition-colors',
                      isActive ? 'bg-blue-50 text-[#0e59f9]' : 'text-slate-400'
                    )}
                  >
                    {tab.count}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeHistoryTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0e59f9] rounded-full"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submissions Table */}
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-10">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Tidak ada data pengajuan pada filter ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                  <th className="py-2.5 pr-4">Pengajuan</th>
                  <th className="py-2.5 px-4">Lingkup</th>
                  <th className="py-2.5 px-4">Tanggal Kirim</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 pl-4">Catatan Peninjau</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 pr-4 font-semibold text-slate-900 whitespace-nowrap">
                      Pengajuan #{sub.attemptNumber || 1}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {sub.submissionScope === 'BUSINESS_PROFILE' ? 'Profil Usaha' : 'Fisik Gerai'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {formatDate(sub.submittedAt)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusPill status={sub.status} />
                    </td>

                    <td className="py-3.5 pl-4 text-slate-600">
                      {sub.decisionReason ? (
                        <p className="text-xs text-rose-700 bg-rose-50/60 border border-rose-100 rounded-lg p-2 max-w-md">
                          {sub.decisionReason}
                        </p>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
