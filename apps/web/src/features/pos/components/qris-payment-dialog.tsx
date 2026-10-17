'use client';

import * as React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, RefreshCw, QrCode, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import { cancelPosQris, getPosQrisStatus, regeneratePosQris, type PosQrisSession } from '@/lib/actions/pos-qris';

const POLL_INTERVAL_MS = 3_000;

type Props = {
  session: PosQrisSession | null;
  /** Pembayaran terkonfirmasi DOKU. */
  onPaid: (transactionId: string) => void;
  /** Kasir membatalkan; keranjang tetap utuh agar bisa pilih metode lain. */
  onCancelled: () => void;
};

function useCountdown(expiresAt: string | null) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!expiresAt) return { expired: false, label: '' };
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return { expired: remaining === 0, label: `${minutes}:${seconds.toString().padStart(2, '0')}` };
}

export function QrisPaymentDialog({ session, onPaid, onCancelled }: Props) {
  const [qr, setQr] = React.useState<{ qrContent: string; expiresAt: string | null } | null>(null);
  const [busy, setBusy] = React.useState<'cancel' | 'regenerate' | 'check' | null>(null);
  const [paid, setPaid] = React.useState(false);
  const doneRef = React.useRef(false);

  React.useEffect(() => {
    setQr(session ? { qrContent: session.qrContent, expiresAt: session.expiresAt } : null);
    setPaid(false);
    doneRef.current = false;
  }, [session]);

  const { expired, label } = useCountdown(qr?.expiresAt ?? null);

  const markPaid = React.useCallback(() => {
    if (!session || doneRef.current) return;
    doneRef.current = true;
    setPaid(true);
    toast.success('Pembayaran QRIS diterima');
    // Beri jeda singkat agar kasir melihat konfirmasi sebelum struk muncul.
    setTimeout(() => onPaid(session.transactionId), 900);
  }, [session, onPaid]);

  const checkStatus = React.useCallback(async () => {
    if (!session || doneRef.current) return;
    const res = await getPosQrisStatus(session.transactionId);
    if ('paymentStatus' in res && res.paymentStatus === 'PAID') markPaid();
  }, [session, markPaid]);

  // Polling selama QR tampil. Tetap berjalan sebentar setelah kedaluwarsa untuk
  // menangkap pembayaran di detik terakhir.
  React.useEffect(() => {
    if (!session || paid) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (stopped) return;
      try {
        await checkStatus();
      } finally {
        if (!stopped) timer = setTimeout(tick, POLL_INTERVAL_MS);
      }
    };
    timer = setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [session, paid, checkStatus]);

  if (!session) return null;

  const handleManualCheck = async () => {
    setBusy('check');
    try {
      await checkStatus();
      if (!doneRef.current) toast.info('Belum ada pembayaran masuk.');
    } finally {
      setBusy(null);
    }
  };

  const handleRegenerate = async () => {
    setBusy('regenerate');
    try {
      const res = await regeneratePosQris(session.transactionId);
      if ('error' in res && res.error) {
        toast.error(res.error);
      } else if (res.success && res.paid) {
        markPaid();
      } else if (res.success && !res.paid) {
        setQr({ qrContent: res.qrContent, expiresAt: res.expiresAt });
      }
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    setBusy('cancel');
    try {
      const res = await cancelPosQris(session.transactionId);
      if ('error' in res && res.error) {
        toast.error(res.error);
      } else if (res.success && res.paid) {
        toast.info('Ternyata pelanggan sudah membayar.');
        markPaid();
      } else {
        toast.info('QRIS dibatalkan. Silakan pilih metode pembayaran lain.');
        onCancelled();
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        className="max-w-[380px] p-0 overflow-hidden rounded-2xl"
      >
        <DialogHeader className="p-4 pb-3 border-b bg-slate-50/70 dark:bg-slate-900/50">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <QrCode className="w-4 h-4 text-blue-600" /> Bayar dengan QRIS
          </DialogTitle>
          <DialogDescription className="text-xs">
            {session.orderNumber ? `Pesanan ${session.orderNumber} • ` : ''}Pindai dengan aplikasi bank atau e-wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 flex flex-col items-center gap-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold tracking-tight">{formatCurrency(session.amount)}</p>
          </div>

          <div className="relative rounded-xl border bg-white p-3">
            {qr && (
              <QRCodeSVG
                value={qr.qrContent}
                size={232}
                level="M"
                marginSize={0}
                className={paid || expired ? 'opacity-20' : undefined}
                aria-label="Kode QRIS pembayaran"
              />
            )}
            {paid && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-14 h-14" />
                <span className="text-sm font-semibold">Pembayaran diterima</span>
              </div>
            )}
            {!paid && expired && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-foreground bg-white/90 rounded-lg px-3 py-1.5">QR kedaluwarsa</span>
              </div>
            )}
          </div>

          {!paid && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              {expired ? (
                'Buat QR baru bila pelanggan belum membayar.'
              ) : (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> Menunggu pembayaran • berlaku {label}
                </>
              )}
            </p>
          )}
        </div>

        {!paid && (
          <div className="p-4 pt-3 border-t bg-slate-50/70 dark:bg-slate-900/50 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleCancel} disabled={busy !== null}>
              {busy === 'cancel' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Batalkan'}
            </Button>
            {expired ? (
              <Button className="flex-1" onClick={handleRegenerate} disabled={busy !== null}>
                {busy === 'regenerate' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat QR Baru'}
              </Button>
            ) : (
              <Button variant="secondary" className="flex-1" onClick={handleManualCheck} disabled={busy !== null}>
                {busy === 'check' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4 mr-1.5" /> Cek Status</>}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
