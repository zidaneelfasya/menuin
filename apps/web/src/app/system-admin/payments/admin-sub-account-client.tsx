'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { IconLink, IconRefresh, IconAdjustments, IconRotateClockwise, IconLoader2 } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppTable, type AppTableColumn } from '@/components/ui/app-table';
import { cn } from '@/lib/utils';
import {
  linkSubAccountAction,
  retrySubAccountProvisioningAction,
  setSubAccountStatusAction,
} from '@/lib/actions/admin-payments';

interface SubAccountRow {
  tenantId: string;
  tenantName: string;
  outletKey: string;
  dokuSubAccountId: string | null;
  dokuSubAccountStatus: string | null;
  onlinePaymentEnabled: boolean;
  outletComplianceStatus: string;
  updatedAt: string;
  businessProfileId: string | null;
  businessProfileName: string | null;
  businessProfileStatus: string | null;
  provisioningStale: boolean;
}

interface AdminSubAccountClientProps {
  rows: SubAccountRow[];
  counts: {
    all: number;
    notProvisioned: number;
    provisioning: number;
    failed: number;
    pendingReview: number;
    active: number;
    suspended: number;
  };
  initialStatus: string;
}

type DialogState =
  | { kind: 'link'; row: SubAccountRow }
  | { kind: 'status'; row: SubAccountRow }
  | null;

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Aktif',
  PENDING_REVIEW: 'Menunggu DOKU',
  PROVISIONING: 'Sedang Didaftarkan',
  FAILED: 'Gagal',
  SUSPENDED: 'Dibekukan',
  NOT_PROVISIONED: 'Belum Terdaftar',
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100/80 text-emerald-700',
  PENDING_REVIEW: 'bg-sky-100/80 text-sky-700',
  PROVISIONING: 'bg-purple-100/80 text-purple-700',
  FAILED: 'bg-rose-100/70 text-rose-700',
  SUSPENDED: 'bg-amber-100/80 text-amber-700',
  NOT_PROVISIONED: 'bg-slate-100 text-slate-600',
};

function StatusBadge({ status }: { status: string | null }) {
  const key = status || 'NOT_PROVISIONED';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-xl text-[11px] font-medium whitespace-nowrap',
        STATUS_STYLE[key] ?? 'bg-slate-100 text-slate-600'
      )}
    >
      {STATUS_LABEL[key] ?? key}
    </span>
  );
}

function PillarChip({ label, verified }: { label: string; verified: boolean }) {
  return (
    <span
      title={`${label}: ${verified ? 'Terverifikasi' : 'Belum terverifikasi'}`}
      className={cn(
        'px-2 py-0.5 rounded-xl text-[11px] font-medium whitespace-nowrap',
        verified ? 'bg-emerald-100/80 text-emerald-700' : 'bg-slate-100 text-slate-500'
      )}
    >
      {label}
    </span>
  );
}

export function AdminSubAccountClient({ rows, counts, initialStatus }: AdminSubAccountClientProps) {
  const router = useRouter();
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [pending, startTransition] = React.useTransition();
  const [retryingId, setRetryingId] = React.useState<string | null>(null);

  // Form state (dipakai bergantian oleh dialog tautkan & ubah status)
  const [subAccountId, setSubAccountId] = React.useState('');
  const [status, setStatus] = React.useState('ACTIVE');
  const [note, setNote] = React.useState('');
  const [allowOverwrite, setAllowOverwrite] = React.useState(false);

  function openDialog(next: NonNullable<DialogState>) {
    setSubAccountId(next.kind === 'link' ? next.row.dokuSubAccountId ?? '' : '');
    setStatus(next.kind === 'status' && next.row.dokuSubAccountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
    setNote('');
    setAllowOverwrite(false);
    setDialog(next);
  }

  function setFilter(key: string) {
    router.push(key === 'ALL' ? '/system-admin/payments' : `/system-admin/payments?status=${key}`);
  }

  function submitDialog() {
    if (!dialog) return;
    const tenantId = dialog.row.tenantId;
    startTransition(async () => {
      const res =
        dialog.kind === 'link'
          ? await linkSubAccountAction({ tenantId, subAccountId, status, note, allowOverwrite })
          : await setSubAccountStatusAction({ tenantId, status, note });
      if (res.success) {
        toast.success(dialog.kind === 'link' ? `Sub Account ${res.subAccountId} ditautkan.` : 'Status Sub Account diperbarui.');
        setDialog(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function retry(row: SubAccountRow) {
    if (!window.confirm(`Daftarkan ulang Sub Account DOKU untuk ${row.tenantName} lewat API?`)) return;
    setRetryingId(row.tenantId);
    startTransition(async () => {
      const res = await retrySubAccountProvisioningAction({ tenantId: row.tenantId });
      setRetryingId(null);
      if (res.success) toast.success(`Sub Account ${res.subAccountId} aktif.`);
      else toast.error(res.error);
      router.refresh();
    });
  }

  const columns: AppTableColumn<SubAccountRow>[] = [
    {
      key: 'outlet',
      header: 'Outlet',
      render: (row) => (
        <div className="min-w-0">
          <span className="font-semibold text-slate-900 block truncate">{row.tenantName}</span>
          <span className="block text-[11px] text-slate-400 font-mono">{row.outletKey}</span>
          {row.businessProfileName && (
            <span className="block text-[11px] text-slate-500 truncate">{row.businessProfileName}</span>
          )}
        </div>
      ),
    },
    {
      key: 'pillars',
      header: 'Verifikasi',
      render: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <PillarChip label="Badan Usaha" verified={row.businessProfileStatus === 'verified'} />
          <PillarChip label="Gerai" verified={row.outletComplianceStatus === 'verified'} />
        </div>
      ),
    },
    {
      key: 'subAccount',
      header: 'Sub Account DOKU',
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge status={row.dokuSubAccountStatus} />
            {row.provisioningStale && (
              <span className="text-[10px] font-medium text-rose-600">macet &gt; 2 menit</span>
            )}
          </div>
          {row.dokuSubAccountId && (
            <span className="block font-mono text-[11px] text-slate-600">{row.dokuSubAccountId}</span>
          )}
        </div>
      ),
    },
    {
      key: 'online',
      header: 'Bayar Online',
      render: (row) => (
        <span className="text-xs text-slate-600">{row.onlinePaymentEnabled ? 'Dinyalakan' : 'Mati'}</span>
      ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (row) => {
        const busyProvisioning = row.dokuSubAccountStatus === 'PROVISIONING' && !row.provisioningStale;
        return (
          <div className="flex items-center justify-end gap-1.5 flex-wrap">
            {!row.dokuSubAccountId && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={pending || busyProvisioning || !row.businessProfileId}
                onClick={() => retry(row)}
              >
                {retryingId === row.tenantId ? (
                  <IconLoader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <IconRotateClockwise className="w-3.5 h-3.5 mr-1" />
                )}
                Daftar Ulang
              </Button>
            )}
            {row.dokuSubAccountId && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={pending}
                onClick={() => openDialog({ kind: 'status', row })}
              >
                <IconAdjustments className="w-3.5 h-3.5 mr-1" />
                Ubah Status
              </Button>
            )}
            <Button
              size="sm"
              className="text-xs bg-[#0e59f9] hover:bg-[#0e59f9]/90 text-white"
              disabled={pending || busyProvisioning || !row.businessProfileId}
              onClick={() => openDialog({ kind: 'link', row })}
            >
              <IconLink className="w-3.5 h-3.5 mr-1" />
              {row.dokuSubAccountId ? 'Ganti ID' : 'Tautkan'}
            </Button>
          </div>
        );
      },
    },
  ];

  const tabs = [
    { key: 'ALL', label: 'Semua', count: counts.all },
    { key: 'FAILED', label: 'Gagal', count: counts.failed },
    { key: 'PROVISIONING', label: 'Sedang Didaftarkan', count: counts.provisioning },
    { key: 'PENDING_REVIEW', label: 'Menunggu DOKU', count: counts.pendingReview },
    { key: 'NOT_PROVISIONED', label: 'Belum Terdaftar', count: counts.notProvisioned },
    { key: 'ACTIVE', label: 'Aktif', count: counts.active },
    { key: 'SUSPENDED', label: 'Dibekukan', count: counts.suspended },
  ];

  const statusOptions =
    dialog?.kind === 'link'
      ? [
          { value: 'ACTIVE', label: 'Aktif — dana langsung diarahkan ke Sub Account ini' },
          { value: 'PENDING_REVIEW', label: 'Menunggu DOKU — tautkan dulu, aktifkan nanti' },
        ]
      : [
          { value: 'ACTIVE', label: 'Aktif' },
          { value: 'PENDING_REVIEW', label: 'Menunggu DOKU' },
          { value: 'SUSPENDED', label: 'Dibekukan — pembayaran online outlet berhenti' },
        ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Akun Pembayaran Outlet
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Status Sub Account DOKU tiap outlet. Tautkan ID secara manual bila pendaftaran lewat API gagal atau
            akun dibuat langsung di dashboard DOKU.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.refresh()} className="text-xs font-medium">
          <IconRefresh className="w-3.5 h-3.5 mr-1" />
          Segarkan
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer',
              initialStatus === tab.key
                ? 'bg-[#0e59f9] text-white shadow-2xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-semibold',
                initialStatus === tab.key ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <AppTable
        columns={columns}
        data={rows}
        keyExtractor={(row) => row.tenantId}
        searchKey={(row) =>
          `${row.tenantName} ${row.outletKey} ${row.businessProfileName ?? ''} ${row.dokuSubAccountId ?? ''}`
        }
        searchPlaceholder="Cari outlet, badan usaha, atau ID Sub Account..."
        headerTheme="blue"
        pageSize={10}
        emptyTitle="Tidak ada outlet"
        emptyDescription="Tidak ada outlet yang cocok dengan filter atau kata kunci yang dipilih."
      />

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && !pending && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          {dialog && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {dialog.kind === 'link' ? 'Tautkan Sub Account Manual' : 'Ubah Status Sub Account'}
                </DialogTitle>
                <DialogDescription>
                  {dialog.row.tenantName}
                  {dialog.row.dokuSubAccountId ? ` · ${dialog.row.dokuSubAccountId}` : ''}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {dialog.kind === 'link' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="sac-id" className="text-xs">ID Sub Account (profileId DOKU)</Label>
                    <Input
                      id="sac-id"
                      value={subAccountId}
                      onChange={(e) => setSubAccountId(e.target.value)}
                      placeholder="SAC-1234-5678901234567"
                      className="font-mono text-xs"
                      autoComplete="off"
                    />
                    <p className="text-[11px] text-neutral-500">
                      Salin dari dashboard DOKU → Sub Account. Pastikan nama dan rekening akun sesuai outlet ini.
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <div className="space-y-1.5">
                    {statusOptions.map((opt) => (
                      <label key={opt.value} className="flex items-start gap-2 text-xs text-neutral-700 cursor-pointer">
                        <input
                          type="radio"
                          name="sac-status"
                          value={opt.value}
                          checked={status === opt.value}
                          onChange={() => setStatus(opt.value)}
                          className="mt-0.5"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sac-note" className="text-xs">Catatan (wajib, masuk audit log)</Label>
                  <Textarea
                    id="sac-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Mis. API register timeout, akun dibuat manual di dashboard DOKU oleh tim ops."
                    className="text-xs min-h-20"
                  />
                </div>

                {dialog.kind === 'link' && dialog.row.dokuSubAccountId && (
                  <label className="flex items-start gap-2 text-xs text-rose-700 cursor-pointer">
                    <Checkbox
                      checked={allowOverwrite}
                      onCheckedChange={(checked) => setAllowOverwrite(checked === true)}
                      className="mt-0.5"
                    />
                    <span>
                      Timpa ID lama ({dialog.row.dokuSubAccountId}). Pembayaran baru akan masuk ke ID yang baru.
                    </span>
                  </label>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" disabled={pending} onClick={() => setDialog(null)}>
                  Batal
                </Button>
                <Button
                  size="sm"
                  className="bg-[#0e59f9] hover:bg-[#0e59f9]/90 text-white"
                  disabled={pending || note.trim().length < 5 || (dialog.kind === 'link' && !subAccountId.trim())}
                  onClick={submitDialog}
                >
                  {pending && <IconLoader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                  Simpan
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
