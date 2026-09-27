'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, parseCurrencyInput } from '@/lib/utils/format';
import { endShift, getActiveShift } from '@/lib/actions/shifts';
import { toast } from 'sonner';
import { 
  Clock, 
  User, 
  Receipt, 
  DollarSign, 
  Banknote, 
  CreditCard, 
  AlertTriangle, 
  Loader2, 
  LogOut 
} from 'lucide-react';

interface ShiftSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftData: any;
  onShiftClosed: () => void;
}

export function ShiftSummaryModal({
  isOpen,
  onClose,
  shiftData,
  onShiftClosed,
}: ShiftSummaryModalProps) {
  const [actualCashStr, setActualCashStr] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isClosingMode, setIsClosingMode] = React.useState(false);
  const [liveShift, setLiveShift] = React.useState<any>(shiftData);

  // Refresh latest shift metrics when opened
  React.useEffect(() => {
    if (isOpen) {
      setIsClosingMode(false);
      setActualCashStr('');
      getActiveShift().then((res) => {
        if (res.success && res.data) {
          setLiveShift(res.data);
        }
      });
    }
  }, [isOpen]);

  const shift = liveShift || shiftData;
  const metrics = shift?.metrics || {};

  const startingCash = Number(shift?.startingCash || 0);
  const totalSales = Number(metrics.totalSales || 0);
  const totalTransactions = Number(metrics.totalTransactions || 0);
  const totalCashSales = Number(metrics.totalCashSales || 0);
  const totalNonCashSales = Number(metrics.totalNonCashSales || 0);
  const expectedCash = Number(metrics.expectedCash ?? (startingCash + totalCashSales));

  const actualCash = parseCurrencyInput(actualCashStr);
  const cashDifference = actualCash - expectedCash;

  const handleCloseShift = async () => {
    if (!shift?.id) return;
    setIsSubmitting(true);

    const res = await endShift(shift.id, actualCash);
    setIsSubmitting(false);

    if (res.success) {
      toast.success('Shift kasir berhasil ditutup');
      onShiftClosed();
      onClose();
    } else {
      toast.error(res.error || 'Gagal menutup shift');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl bg-white dark:bg-slate-950 border border-border/80 shadow-xl">
        <DialogHeader className="p-4 pb-3 border-b bg-slate-50/70 dark:bg-slate-900/50">
          <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Ringkasan Shift Kasir
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5" />
              {shift?.cashierName || 'Kasir'}
            </span>
            <span>•</span>
            <span>Shift Aktif</span>
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-3.5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] text-muted-foreground block font-medium">Total Penjualan</span>
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(totalSales)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] text-muted-foreground block font-medium">Total Transaksi</span>
              <span className="text-sm font-semibold text-foreground">
                {totalTransactions} Transaksi
              </span>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-blue-600" /> Modal Kas Awal
              </span>
              <span className="font-medium text-foreground">{formatCurrency(startingCash)}</span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Penjualan Tunai
              </span>
              <span className="font-medium text-foreground">+{formatCurrency(totalCashSales)}</span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-600" /> Non-Tunai (QRIS/Kartu)
              </span>
              <span className="font-medium text-foreground">+{formatCurrency(totalNonCashSales)}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center font-medium">
              <span className="text-slate-800 dark:text-slate-200 font-semibold">Estimasi Kas di Laci</span>
              <span className="font-semibold text-sm text-blue-600 dark:text-blue-400">
                {formatCurrency(expectedCash)}
              </span>
            </div>
          </div>

          {/* End Shift Mode */}
          {isClosingMode ? (
            <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2.5">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Hitung Uang Fisik Kasir</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Hitung uang tunai fisik yang ada di laci kasir saat ini untuk verifikasi selisih.
              </p>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Uang Fisik Dihitung (Rp)</Label>
                <Input
                  type="text"
                  placeholder="0"
                  value={actualCashStr}
                  onChange={(e) => setActualCashStr(e.target.value.replace(/\D/g, ''))}
                  className="h-9 text-xs bg-white dark:bg-slate-900 font-mono"
                  autoFocus
                />
              </div>

              {actualCashStr !== '' && (
                <div className="flex justify-between items-center text-xs pt-1 border-t border-amber-200 dark:border-amber-800/50">
                  <span className="text-muted-foreground font-medium">Selisih Kas:</span>
                  <span
                    className={`font-semibold ${
                      cashDifference === 0
                        ? 'text-emerald-700'
                        : cashDifference > 0
                        ? 'text-blue-600'
                        : 'text-destructive'
                    }`}
                  >
                    {cashDifference === 0
                      ? 'Cocok (Rp 0)'
                      : cashDifference > 0
                      ? `Lebih +${formatCurrency(cashDifference)}`
                      : `Kurang -${formatCurrency(Math.abs(cashDifference))}`}
                  </span>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Modal Actions */}
        <div className="p-4 pt-3 border-t bg-slate-50/70 dark:bg-slate-900/50 flex gap-2">
          {isClosingMode ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsClosingMode(false)}
                disabled={isSubmitting}
                className="flex-1 h-10 text-xs rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleCloseShift}
                disabled={isSubmitting}
                className="flex-1 h-10 text-xs rounded-xl font-semibold gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                <span>Konfirmasi Tutup Shift</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-10 text-xs rounded-xl"
              >
                Tutup Jendela
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsClosingMode(true)}
                className="flex-1 h-10 text-xs rounded-xl font-semibold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Tutup Kasir / Akhiri Shift</span>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
