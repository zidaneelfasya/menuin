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
import { formatCurrency } from '@/lib/utils/format';
import { Check, Printer, ChefHat, ReceiptText, Plus } from 'lucide-react';
import { ReceiptData, TenantReceiptSettings } from './receipt-printer';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
  posSettings?: TenantReceiptSettings | null;
  onPrint: (mode: 'all' | 'customer' | 'kitchen') => void;
}

export function PaymentSuccessModal({
  isOpen,
  onClose,
  receiptData,
  posSettings,
  onPrint,
}: PaymentSuccessModalProps) {
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!receiptData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] p-6 bg-white border border-slate-200 shadow-xl rounded-2xl">
        <DialogHeader className="space-y-2 text-center pb-2 border-b border-slate-100">
          <div className="mx-auto w-11 h-11 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Check className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Transaksi Berhasil
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-mono mt-0.5">
              #{receiptData.transactionId.substring(0, 8).toUpperCase()}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* DETAILS CARD */}
        <div className="my-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5 text-xs text-slate-600">
          <div className="flex justify-between items-center">
            <span>Metode Pembayaran</span>
            <span className="font-semibold text-slate-800">
              {receiptData.paymentMethod || 'TUNAI'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span>Total Tagihan</span>
            <span className="font-bold text-sm text-slate-900">
              {formatCurrency(receiptData.totalAmount)}
            </span>
          </div>

          {receiptData.change > 0 && (
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-blue-700">
              <span className="font-semibold">Uang Kembalian</span>
              <span className="font-bold text-sm">
                {formatCurrency(receiptData.change)}
              </span>
            </div>
          )}
        </div>

        {/* PRINT ACTIONS */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={() => onPrint('customer')}
              className="h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2"
            >
              <ReceiptText className="w-4 h-4" />
              Cetak Struk
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => onPrint('kitchen')}
              className="h-11 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-2"
            >
              <ChefHat className="w-4 h-4 text-slate-600" />
              Tiket Dapur
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => onPrint('all')}
            className="w-full h-9 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium flex items-center justify-center gap-1.5 rounded-lg"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Keduanya (Struk + Dapur)
          </Button>
        </div>

        {/* NEW ORDER */}
        <div className="pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full h-11 border-slate-300 hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Transaksi Baru (Enter)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
