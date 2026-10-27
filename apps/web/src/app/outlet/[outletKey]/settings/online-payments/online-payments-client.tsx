'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { IconAlertTriangle, IconFileUpload, IconLoader2, IconReceiptRefund } from '@tabler/icons-react';
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
      <div className="bg-white border-none rounded-2xl p-6 sm:p-8 shadow-sm-md hover:shadow-md transition-all space-y-6">
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shrink-0">
            <IconReceiptRefund className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Transaksi Online</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pembayaran lewat DOKU (pesanan online & QRIS kasir). Refund dilakukan di dashboard DOKU, lalu dicatat di sini agar laporan tetap akurat.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center bg-slate-100 p-1 rounded-full border-none shadow-sm-md">
          {[
            { key: 'REVIEW', label: `Perlu Ditinjau${reviewCount ? ` (${reviewCount})` : ''}`, href: pathname },
            { key: 'ALL', label: 'Semua Pembayaran', href: `${pathname}?view=all` },
          ].map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              replace
              className={cn(
                'px-4 py-2 text-xs font-semibold rounded-full transition-all',
                view === tab.key ? 'bg-[#0e59f9] text-white shadow-sm-md' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center font-medium">
            {view === 'REVIEW' ? 'Tidak ada pembayaran yang perlu ditinjau.' : 'Belum ada pembayaran online.'}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
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
          <p className="text-sm font-semibold text-slate-900">
            {row.orderNumber || '-'}
            {row.customerName ? <span className="font-normal text-slate-500"> · {row.customerName}</span> : null}
          </p>
          <p className="text-xs text-slate-500 break-all">
            {productLabel(row.product)} · {row.invoiceNumber}
            {row.paymentChannel ? ` · ${row.paymentChannel}` : ''}
          </p>
          <p className="text-xs text-slate-400">Dibayar: {dateFmt(row.paidAt)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(row.amount)}</p>
          {row.feeAmount !== null && (
            <p className="text-[11px] text-slate-400 font-medium">
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
        <div className="rounded-2xl bg-amber-50/80 p-4 border-none shadow-xs space-y-1.5">
          <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
            <IconAlertTriangle className="w-4 h-4 text-amber-600" /> {reason.title}
          </p>
          <p className="text-xs text-amber-900/90 leading-relaxed">{reason.explanation}</p>
          <p className="text-xs text-amber-900/90">
            <span className="font-semibold">Saran:</span> {reason.recommendation}
          </p>
        </div>
      )}

      {(canRefund || (showReview && row.requiresReview && !row.reviewedAt)) && (
        <div className="flex flex-wrap gap-2">
          {canRefund && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRefund}
              className="rounded-full border-none bg-white shadow-sm-md hover:bg-slate-100 text-slate-700 text-xs font-semibold px-4 h-8"
            >
              Catat Refund
            </Button>
          )}
          {showReview && row.requiresReview && !row.reviewedAt && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onResolve}
              className="rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold px-4 h-8"
            >
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
        'text-[11px] font-semibold px-2.5 py-0.5 rounded-full border-none',
        tone === 'violet' ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-700'
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
      <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl bg-white p-6 sm:p-7">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-900">Catat Refund</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 leading-relaxed">
            Lakukan refund di dashboard DOKU terlebih dahulu, lalu catat di sini. Pesanan {row.orderNumber || ''} · {formatCurrency(row.amount)}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="refund-amount" className="text-xs font-semibold text-slate-700">Nominal refund</Label>
            <Input
              id="refund-amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-full bg-slate-50 border-none shadow-sm-md h-10 px-4 focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus:outline-none"
            />
            {amountNum > row.amount && <p className="text-xs text-red-500 font-medium">Melebihi nominal pembayaran.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refund-ref" className="text-xs font-semibold text-slate-700">Nomor referensi refund DOKU</Label>
            <Input
              id="refund-ref"
              value={reference}
              maxLength={100}
              onChange={(e) => setReference(e.target.value)}
              className="rounded-full bg-slate-50 border-none shadow-sm-md h-10 px-4 focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refund-note" className="text-xs font-semibold text-slate-700">Catatan (opsional)</Label>
            <Textarea
              id="refund-note"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-2xl bg-slate-50 border-none shadow-md p-3.5 focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus:outline-none resize-none"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border-none bg-white shadow-sm-md hover:bg-slate-100 text-slate-700 font-semibold px-5 h-9"
          >
            Batal
          </Button>
          <Button
            onClick={submit}
            disabled={saving || !reference.trim() || !amountNum || amountNum > row.amount}
            className="rounded-full bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-md font-semibold px-5 h-9"
          >
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
      <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl bg-white p-6 sm:p-7">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-900">Selesai Tanpa Refund</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 leading-relaxed">
            Jelaskan kenapa pembayaran ini tidak perlu direfund (mis. pesanan tetap dilayani).
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Textarea
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tuliskan alasan..."
            className="rounded-2xl bg-slate-50 border-none shadow-md p-3.5 focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus:outline-none resize-none"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border-none bg-white shadow-sm-md hover:bg-slate-100 text-slate-700 font-semibold px-5 h-9"
          >
            Batal
          </Button>
          <Button
            onClick={submit}
            disabled={saving || note.trim().length < 3}
            className="rounded-full bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-md font-semibold px-5 h-9"
          >
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
    <div className="bg-white border-none rounded-2xl p-6 sm:p-8 shadow-sm-md hover:shadow-md transition-all space-y-6">
      <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shrink-0">
          <IconFileUpload className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900">Rekonsiliasi Settlement</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Unggah laporan settlement (CSV) dari dashboard DOKU. Fee estimasi 0,7% akan diganti fee riil per transaksi,
            dan laporan keuangan ikut diperbarui. Aman diunggah ulang.
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-full border-none bg-white shadow-sm-md hover:bg-slate-100 text-slate-700 font-semibold px-5 h-9"
      >
        {uploading ? <IconLoader2 className="w-4 h-4 mr-2 animate-spin" /> : <IconFileUpload className="w-4 h-4 mr-2" />}
        Unggah CSV Settlement
      </Button>

      {summary && (
        <div className="text-xs space-y-1 rounded-2xl bg-slate-50 p-4 border-none shadow-xs text-slate-700">
          <p><span className="font-semibold text-slate-900">{summary.updated}</span> diperbarui · {summary.unchanged} sudah sesuai</p>
          {summary.notFound.length > 0 && <p className="text-slate-500">{summary.notFound.length} invoice tidak ditemukan di outlet ini</p>}
          {summary.notPaid.length > 0 && <p className="text-slate-500">{summary.notPaid.length} invoice belum berstatus lunas</p>}
          {summary.mismatched.map((m) => (
            <p key={m.invoiceNumber} className="text-amber-800 font-medium">{m.invoiceNumber}: {m.reason}</p>
          ))}
        </div>
      )}
      {parseErrors.length > 0 && (
        <div className="text-xs space-y-0.5 text-amber-800 rounded-2xl bg-amber-50/60 p-4">
          {parseErrors.map((e, i) => (
            <p key={i}>Baris {e.line}{e.invoiceNumber ? ` (${e.invoiceNumber})` : ''}: {e.reason}</p>
          ))}
        </div>
      )}
    </div>
  );
}
