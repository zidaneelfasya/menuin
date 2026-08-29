'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: (cashReceived: number, change: number, customerDetails?: any) => Promise<void>;
  posSettings: any;
}

export function PaymentModal({ isOpen, onClose, totalAmount, onConfirm, posSettings }: PaymentModalProps) {
  const [cashReceivedStr, setCashReceivedStr] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [customerName, setCustomerName] = React.useState('');
  const [tableNumber, setTableNumber] = React.useState('');
  const [orderType, setOrderType] = React.useState(
    posSettings?.posOrderTypeSelection === 'MANUAL' ? '' : (posSettings?.posOrderTypeSelection || 'DINE_IN')
  );

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCashReceivedStr('');
      setIsProcessing(false);
      setCustomerName('');
      setTableNumber('');
      setOrderType(posSettings?.posOrderTypeSelection === 'MANUAL' ? '' : (posSettings?.posOrderTypeSelection || 'DINE_IN'));
    }
  }, [isOpen, posSettings]);

  const cashReceived = parseInt(cashReceivedStr.replace(/\D/g, ''), 10) || 0;
  const change = cashReceived - totalAmount;

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setCashReceivedStr(rawValue);
  };

  const handleExactChange = () => {
    setCashReceivedStr(totalAmount.toString());
  };

  const handlePreset = (amount: number) => {
    setCashReceivedStr(amount.toString());
  };

  const requireCustomerName = posSettings?.customerNameRequired;
  const requireTableNumber = posSettings?.tableNumberRequired;
  const isSufficient = cashReceived >= totalAmount && 
                       (!requireCustomerName || customerName.trim() !== '') && 
                       (!requireTableNumber || orderType !== 'DINE_IN' || tableNumber.trim() !== '') && 
                       orderType !== '';

  const handleSubmit = async () => {
    if (!isSufficient) return;
    setIsProcessing(true);
    await onConfirm(cashReceived, change, {
      customerName: customerName || null,
      tableNumber: tableNumber || null,
      orderType
    });
    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isSufficient) {
      handleSubmit();
    }
  };

  // Generate suggested quick cash amounts based on total
  const suggestedAmounts = React.useMemo(() => {
    const amounts = new Set<number>();
    
    // Nearest 10k, 20k, 50k, 100k
    if (totalAmount < 20000) amounts.add(20000);
    if (totalAmount < 50000) amounts.add(50000);
    if (totalAmount < 100000) amounts.add(100000);

    const nearest10k = Math.ceil(totalAmount / 10000) * 10000;
    const nearest50k = Math.ceil(totalAmount / 50000) * 50000;
    const nearest100k = Math.ceil(totalAmount / 100000) * 100000;

    if (nearest10k > totalAmount) amounts.add(nearest10k);
    if (nearest50k > totalAmount) amounts.add(nearest50k);
    if (nearest100k > totalAmount) amounts.add(nearest100k);

    return Array.from(amounts).sort((a, b) => a - b).slice(0, 3);
  }, [totalAmount]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Pembayaran</DialogTitle>
          <DialogDescription className="text-center">
            Masukkan jumlah uang yang diterima dari pelanggan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4 max-h-[60vh] overflow-y-auto px-2">
          <div className="bg-muted p-4 rounded-xl text-center">
            <span className="text-sm font-medium text-muted-foreground block mb-1">Total Tagihan</span>
            <span className="text-4xl font-extrabold text-primary">{formatCurrency(totalAmount)}</span>
          </div>

          {(posSettings?.customerNameRequired || posSettings?.tableNumberRequired || posSettings?.posKitchenSync) && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border">
              {posSettings?.posOrderTypeSelection === 'MANUAL' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Tipe Pesanan <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant={orderType === 'DINE_IN' ? 'default' : 'outline'} 
                      onClick={() => setOrderType('DINE_IN')}
                      className="flex-1"
                    >
                      Dine-In
                    </Button>
                    <Button 
                      type="button" 
                      variant={orderType === 'TAKEAWAY' ? 'default' : 'outline'} 
                      onClick={() => setOrderType('TAKEAWAY')}
                      className="flex-1"
                    >
                      Take Away
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Nama Pelanggan {posSettings?.customerNameRequired && <span className="text-red-500">*</span>}</label>
                <Input 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Misal: Budi"
                />
              </div>

              {orderType === 'DINE_IN' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Nomor Meja {posSettings?.tableNumberRequired && <span className="text-red-500">*</span>}</label>
                  <Input 
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Misal: Meja 5"
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-semibold">Uang Diterima</label>
            <Input
              type="text"
              autoFocus
              value={cashReceivedStr ? formatCurrency(cashReceived).replace('Rp', '').trim() : ''}
              onChange={handleCashChange}
              onKeyDown={handleKeyDown}
              className="text-right text-2xl font-bold h-14"
              placeholder="0"
              disabled={isProcessing}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleExactChange} className="flex-1" disabled={isProcessing}>
                Uang Pas
              </Button>
              {suggestedAmounts.map((amt) => (
                <Button key={amt} type="button" variant="outline" onClick={() => handlePreset(amt)} className="flex-1" disabled={isProcessing}>
                  {formatCurrency(amt)}
                </Button>
              ))}
            </div>
          </div>

          {cashReceived > 0 && (
            <div className={`p-4 rounded-xl text-center ${isSufficient ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
              <span className="text-sm font-medium block mb-1">
                {isSufficient ? 'Kembalian' : 'Uang Kurang'}
              </span>
              <span className="text-3xl font-extrabold">
                {formatCurrency(Math.abs(change))}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 h-12" disabled={isProcessing}>
            Batal
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            className="flex-1 h-12 text-lg font-bold" 
            disabled={!isSufficient || isProcessing}
          >
            {isProcessing ? 'Memproses...' : 'Selesai & Cetak'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
