'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { IconAlertTriangle, IconFileUpload, IconLoader2 } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format';
import {
  importSettlementCsv,
  recordOnlinePaymentRefund,
  resolveOnlinePaymentReview,
} from '@/lib/actions/online-payments';
import { reviewReasonInfo } from '@/lib/payments/review-reasons';

export type OnlinePaymentRow = {
  id: string;
  invoiceNumber: string;
  product: string;
  status: string;
  amount: number;
  paymentChannel: string | null;
  paidAt: string | null;
  createdAt: string;
  feeAmount: number | null;
  netAmount: number | null;
  feeSource: string | null;
  settledAt: string | null;
  requiresReview: boolean;
  reviewReason: string | null;
  reviewResolution: string | null;
  reviewedAt: string | null;
  refundedAmount: number | null;
  refundReference: string | null;
  orderNumber: string | null;
  orderStatus: string;
  orderPaymentStatus: string;
  customerName: string | null;
};

type Props = {
  view: 'REVIEW' | 'ALL';
  rows: OnlinePaymentRow[];
  reviewCount: number;
  canImportSettlement: boolean;
};

const dateFmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-';

const productLabel = (p: string) => (p === 'SNAP_QRIS' ? 'QRIS Kasir' : 'Online');

export function OnlinePaymentsClient({ view, rows, reviewCount, canImportSettlement }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [refundTarget, setRefundTarget] = React.useState<OnlinePaymentRow | null>(null);
  const [resolveTarget, setResolveTarget] = React.useState<OnlinePaymentRow | null>(null);

  const refresh = () => router.refresh();

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">Transaksi Online</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Pembayaran lewat DOKU (pesanan online & QRIS kasir). Refund dilakukan di dashboard DOKU, lalu dicatat di sini agar laporan tetap akurat.
          </p>
        </div>

        <div className="flex gap-2 border-b border-border/60">
          {[
            { key: 'REVIEW', label: `Perlu Ditinjau${reviewCount ? ` (${reviewCount})` : ''}`, href: pathname },
            { key: 'ALL', label: 'Semua Pembayaran', href: `${pathname}?view=all` },
          ].map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              replace
              className={cn(
                'px-3 py-2 text-sm font-medium -mb-px border-b-2 transition-colors',
                view === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {view === 'REVIEW' ? 'Tidak ada pembayaran yang perlu ditinjau.' : 'Belum ada pembayaran online.'}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {rows.map((row) => (
              <PaymentItem
                key={row.id}
                row={row}
                showReview={view === 'REVIEW'}
                onRefund={() => setRefundTarget(row)}
                onResolve={() => setResolveTarget(row)}
              />
            ))}
          </ul>
        )}
      </div>

      {canImportSettlement && <SettlementImportCard onImported={refresh} />}

      <RefundDialog row={refundTarget} onClose={() => setRefundTarget(null)} onDone={refresh} />
      <ResolveDialog row={resolveTarget} onClose={() => setResolveTarget(null)} onDone={refresh} />
    </div>
  );
}

function PaymentItem({
  row,
  showReview,
  onRefund,
  onResolve,
}: {
  row: OnlinePaymentRow;
  showReview: boolean;
  onRefund: () => void;
  onResolve: () => void;
}) {
  const reason = row.requiresReview ? reviewReasonInfo(row.reviewReason) : null;
  const canRefund = row.status === 'PAID' && !row.refundedAmount && row.reviewReason !== 'AMOUNT_MISMATCH';

  return (
    <li className="py-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-semibold text-foreground">
            {row.orderNumber || '-'}
            {row.customerName ? <span className="font-normal text-muted-foreground"> · {row.customerName}</span> : null}
          </p>
          <p className="text-xs text-muted-foreground break-all">
            {productLabel(row.product)} · {row.invoiceNumber}
            {row.paymentChannel ? ` · ${row.paymentChannel}` : ''}
          </p>
          <p className="text-xs text-muted-foreground">Dibayar: {dateFmt(row.paidAt)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold">{formatCurrency(row.amount)}</p>
          {row.feeAmount !== null && (
            <p className="text-[11px] text-muted-foreground">
              Fee {formatCurrency(row.feeAmount)} · {row.feeSource === 'SETTLEMENT' ? 'settlement' : 'estimasi'}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-1 mt-1">
            {row.status !== 'PAID' && <Badge tone="slate">{row.status}</Badge>}
            {row.refundedAmount ? <Badge tone="violet">Refund {formatCurrency(row.refundedAmount)}</Badge> : null}
            {row.orderPaymentStatus === 'REFUNDED' && <Badge tone="violet">Pesanan direfund</Badge>}
          </div>
        </div>
      </div>

      {showReview && reason && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
            <IconAlertTriangle className="w-4 h-4" /> {reason.title}
          </p>
          <p className="text-xs text-amber-900/90">{reason.explanation}</p>
          <p className="text-xs text-amber-900/90">
            <span className="font-semibold">Saran:</span> {reason.recommendation}
          </p>
        </div>
      )}

      {(canRefund || (showReview && row.requiresReview && !row.reviewedAt)) && (
        <div className="flex flex-wrap gap-2">
          {canRefund && (
            <Button size="sm" variant="outline" onClick={onRefund} className="rounded-lg text-xs">
              Catat Refund
            </Button>
          )}
          {showReview && row.requiresReview && !row.reviewedAt && (
            <Button size="sm" variant="ghost" onClick={onResolve} className="rounded-lg text-xs">
              Selesai Tanpa Refund
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

function Badge({ tone, children }: { tone: 'slate' | 'violet'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'text-[10px] font-semibold px-2 py-0.5 rounded-full',
        tone === 'violet' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-700'
      )}
    >
      {children}
    </span>
  );
}

function RefundDialog({ row, onClose, onDone }: { row: OnlinePaymentRow | null; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = React.useState('');
  const [reference, setReference] = React.useState('');
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setAmount(row ? String(row.amount) : '');
    setReference('');
    setNote('');
  }, [row]);

  if (!row) return null;
  const amountNum = Number(amount.replace(/[^\d]/g, ''));

  const submit = async () => {
    setSaving(true);
    try {
      const res = await recordOnlinePaymentRefund({ attemptId: row.id, amount: amountNum, reference, note: note || undefined });
      if (res.error) toast.error(res.error);
      else {
        toast.success('Refund dicatat');
        onClose();
        onDone();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Catat Refund</DialogTitle>
          <DialogDescription>
            Lakukan refund di dashboard DOKU terlebih dahulu, lalu catat di sini. Pesanan {row.orderNumber || ''} · {formatCurrency(row.amount)}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="refund-amount">Nominal refund</Label>
            <Input id="refund-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
            {amountNum > row.amount && <p className="text-xs text-red-500">Melebihi nominal pembayaran.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refund-ref">Nomor referensi refund DOKU</Label>
            <Input id="refund-ref" value={reference} maxLength={100} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refund-note">Catatan (opsional)</Label>
            <Textarea id="refund-note" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
          <Button onClick={submit} disabled={saving || !reference.trim() || !amountNum || amountNum > row.amount}>
            {saving ? <IconLoader2 className="w-4 h-4 animate-spin" /> : 'Simpan Refund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResolveDialog({ row, onClose, onDone }: { row: OnlinePaymentRow | null; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => setNote(''), [row]);
  if (!row) return null;

  const submit = async () => {
    setSaving(true);
    try {
      const res = await resolveOnlinePaymentReview({ attemptId: row.id, note });
      if (res.error) toast.error(res.error);
      else {
        toast.success('Ditandai selesai');
        onClose();
        onDone();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Selesai Tanpa Refund</DialogTitle>
          <DialogDescription>Jelaskan kenapa pembayaran ini tidak perlu direfund (mis. pesanan tetap dilayani).</DialogDescription>
        </DialogHeader>
        <Textarea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Catatan" />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
          <Button onClick={submit} disabled={saving || note.trim().length < 3}>
            {saving ? <IconLoader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ImportResult = Awaited<ReturnType<typeof importSettlementCsv>>;

function SettlementImportCard({ onImported }: { onImported: () => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await importSettlementCsv(fd);
      setResult(res);
      if (res.success) {
        toast.success('Laporan settlement diproses');
        onImported();
      } else toast.error(res.error || 'Gagal mengimpor');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const summary = result && 'summary' in result ? result.summary : null;
  const parseErrors = result && 'parseErrors' in result ? result.parseErrors ?? [] : [];

  return (
    <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
      <div>
        <h3 className="text-base font-bold tracking-tight">Rekonsiliasi Settlement</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Unggah laporan settlement (CSV) dari dashboard DOKU. Fee estimasi 0,7% akan diganti fee riil per transaksi,
          dan laporan keuangan ikut diperbarui. Aman diunggah ulang.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading} className="rounded-xl">
        {uploading ? <IconLoader2 className="w-4 h-4 mr-2 animate-spin" /> : <IconFileUpload className="w-4 h-4 mr-2" />}
        Unggah CSV Settlement
      </Button>

      {summary && (
        <div className="text-xs space-y-1 rounded-xl bg-muted/50 p-3">
          <p><span className="font-semibold">{summary.updated}</span> diperbarui · {summary.unchanged} sudah sesuai</p>
          {summary.notFound.length > 0 && <p>{summary.notFound.length} invoice tidak ditemukan di outlet ini</p>}
          {summary.notPaid.length > 0 && <p>{summary.notPaid.length} invoice belum berstatus lunas</p>}
          {summary.mismatched.map((m) => (
            <p key={m.invoiceNumber} className="text-amber-800">{m.invoiceNumber}: {m.reason}</p>
          ))}
        </div>
      )}
      {parseErrors.length > 0 && (
        <div className="text-xs space-y-0.5 text-amber-800">
          {parseErrors.map((e, i) => (
            <p key={i}>Baris {e.line}{e.invoiceNumber ? ` (${e.invoiceNumber})` : ''}: {e.reason}</p>
          ))}
        </div>
      )}
    </div>
  );
}
