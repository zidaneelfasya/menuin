'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconSearch,
  IconShieldCheck,
  IconBuildingStore,
  IconMapPin,
  IconArrowRight,
  IconRefresh,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AppTable, type AppTableColumn } from '@/components/ui/app-table';

interface QueueItem {
  id: string;
  submissionScope: string;
  attemptNumber: number;
  status: string;
  submittedAt: string | Date;
  createdAt?: string | Date | null;
  reviewedAt: string | Date | null;
  reviewedBy: string | null;
  decisionReason: string | null;
  businessProfileId: string;
  businessProfileName: string;
  businessEntityType: string;
  tenantId: string | null;
  tenantName: string | null;
  reviewerName: string | null;
  sectionReviews?: Array<{
    section: string;
    status: string;
    note?: string | null;
  }>;
}

interface AdminVerificationQueueClientProps {
  initialQueue: QueueItem[];
  initialCounts: {
    all: number;
    submitted: number;
    under_review: number;
    action_required: number;
    verified: number;
    rejected: number;
  };
  initialStatus: string;
  initialScope: string;
  initialSearch: string;
}

export function AdminVerificationQueueClient({
  initialQueue,
  initialCounts,
  initialStatus,
  initialScope,
  initialSearch,
}: AdminVerificationQueueClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState(initialStatus);
  const [scopeFilter, setScopeFilter] = React.useState(initialScope);

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

  // Filter queue items in memory based on statusFilter and scopeFilter
  const filteredQueue = React.useMemo(() => {
    return initialQueue.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (scopeFilter !== 'ALL' && item.submissionScope !== scopeFilter) return false;
      return true;
    });
  }, [initialQueue, statusFilter, scopeFilter]);

  // AppTable Column Configurations
  const columns: AppTableColumn<QueueItem>[] = [
    {
      key: 'businessProfile',
      header: 'Badan Usaha / Merek',
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 block truncate">{item.businessProfileName}</span>
          <span className="block text-[11px] text-slate-400 font-normal">{item.businessEntityType}</span>
        </div>
      ),
    },
    {
      key: 'tenant',
      header: 'Outlet Terkait',
      render: (item) => (
        <span className="text-slate-700 font-medium text-xs">
          {item.tenantName || 'Semua Outlet (Induk)'}
        </span>
      ),
    },
    {
      key: 'sectionProgress',
      header: 'Progres Bagian',
      render: (item) => {
        const reviews = item.sectionReviews || [];
        const getSec = (sec: string) => reviews.find((r) => r.section === sec);
        const pSec = getSec('BUSINESS_PROFILE');
        const rSec = getSec('REPRESENTATIVE');
        const sSec = getSec('SETTLEMENT');
        const oSec = getSec('OUTLET');

        const renderChip = (label: string, sec?: any) => {
          if (!sec || sec.status === 'PENDING') {
            return (
              <span
                key={label}
                title={`${label}: Menunggu Peninjauan`}
                className="px-2 py-0.5 rounded-xl text-[11px] font-medium border-none bg-slate-100 text-slate-600 whitespace-nowrap"
              >
                {label}
              </span>
            );
          }
          if (sec.status === 'APPROVED' || sec.status === 'INHERITED') {
            return (
              <span
                key={label}
                title={`${label}: Disetujui`}
                className="px-2 py-0.5 rounded-xl text-[11px] font-medium border-none bg-emerald-100/80 text-emerald-700 whitespace-nowrap"
              >
                {label}
              </span>
            );
          }
          return (
            <span
              key={label}
              title={`${label}: Perlu Perbaikan`}
              className="px-2 py-0.5 rounded-xl text-[11px] font-medium border-none bg-amber-100/80 text-amber-700 whitespace-nowrap"
            >
              {label}
            </span>
          );
        };

        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {renderChip('Profil', pSec)}
            {renderChip('PIC', rSec)}
            {renderChip('Bank', sSec)}
            {renderChip('Gerai', oSec)}
          </div>
        );
      },
    },
    {
      key: 'attemptNumber',
      header: 'Pengajuan',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-700">Ke-{item.attemptNumber}</span>
          {item.attemptNumber > 1 && (
            <span className="px-2 py-0.5 rounded-xl text-[10px] font-medium border-none bg-amber-100/80 text-amber-700 whitespace-nowrap">
              Revisi
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Waktu Masuk',
      render: (item) => {
        const dateVal = item.submittedAt
          ? new Date(item.submittedAt)
          : item.createdAt
          ? new Date(item.createdAt)
          : null;
        const isValidDate = dateVal && !isNaN(dateVal.getTime()) && dateVal.getFullYear() > 1970;

        return (
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {isValidDate
              ? dateVal.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Baru saja'}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: 'reviewer',
      header: 'Reviewer',
      render: (item) => (
        <span className="text-xs text-slate-600">{item.reviewerName || '-'}</span>
      ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (item) => (
        <Link
          href={`/system-admin/verification/${item.id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0e59f9] hover:bg-[#0e59f9]/90 text-white text-xs font-semibold transition-colors shadow-2xs"
        >
          <span>Periksa</span>
          <IconArrowRight className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Antrean Verifikasi Kepatuhan
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Tinjau 4 Bagian Pengajuan: Profil Usaha, Perwakilan Bisnis, Rekening Settlement, dan Kepatuhan Lokasi Gerai.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
            className="text-xs font-medium"
          >
            <IconRefresh className="w-3.5 h-3.5 mr-1" />
            Segarkan
          </Button>
        </div>
      </div>

      {/* Filter Status Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        {[
          { key: 'ALL', label: 'Semua Pengajuan', count: initialCounts.all },
          { key: 'submitted', label: 'Antrean Baru', count: initialCounts.submitted },
          { key: 'under_review', label: 'Sedang Ditinjau', count: initialCounts.under_review },
          { key: 'action_required', label: 'Perlu Perbaikan', count: initialCounts.action_required },
          { key: 'verified', label: 'Terverifikasi', count: initialCounts.verified },
          { key: 'rejected', label: 'Ditolak', count: initialCounts.rejected },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer',
              statusFilter === tab.key
                ? 'bg-[#0e59f9] text-white shadow-2xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-semibold',
                statusFilter === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-neutral-100 text-neutral-500'
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Table via AppTable */}
      <AppTable
        columns={columns}
        data={filteredQueue}
        searchKey={(item) => `${item.businessProfileName} ${item.tenantName || ''} ${item.reviewerName || ''}`}
        searchPlaceholder="Cari badan usaha, outlet, atau reviewer..."
        headerTheme="blue"
        pageSize={10}
        emptyTitle="Tidak ada pengajuan verifikasi"
        emptyDescription="Tidak ada pengajuan yang cocok dengan filter atau kata kunci pencarian yang dipilih."
      />
    </div>
  );
}
