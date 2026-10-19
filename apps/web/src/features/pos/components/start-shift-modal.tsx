import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { startShift } from '@/lib/actions/shifts';
import { formatCurrency, formatNumber, parseCurrencyInput } from '@/lib/utils/format';
import { toast } from 'sonner';
import { Banknote, Coins } from 'lucide-react';

const QUICK_DENOMINATIONS = [0, 50000, 100000, 200000, 300000, 500000, 1000000];

const BILL_VALUES = [
  { label: 'Rp 100.000', value: 100000 },
  { label: 'Rp 50.000', value: 50000 },
  { label: 'Rp 20.000', value: 20000 },
  { label: 'Rp 10.000', value: 10000 },
  { label: 'Rp 5.000', value: 5000 },
  { label: 'Rp 2.000', value: 2000 },
  { label: 'Rp 1.000', value: 1000 },
];

export function StartShiftModal({ 
  isOpen, 
  onClose,
  onSuccess
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rawAmount, setRawAmount] = React.useState('0');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Denomination calculator
  const [useCalculator, setUseCalculator] = React.useState(false);
  const [billCounts, setBillCounts] = React.useState<{ [key: number]: number }>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
  });
  const [coinAmount, setCoinAmount] = React.useState('');

  const calculatorTotal = React.useMemo(() => {
    let sum = 0;
    Object.entries(billCounts).forEach(([val, count]) => {
      sum += Number(val) * (Number(count) || 0);
    });
    sum += parseCurrencyInput(coinAmount);
    return sum;
  }, [billCounts, coinAmount]);

  React.useEffect(() => {
    if (useCalculator) {
      setRawAmount(calculatorTotal.toString());
    }
  }, [calculatorTotal, useCalculator]);

  const formattedDisplayAmount = React.useMemo(() => {
    if (!rawAmount) return '';
    const num = parseCurrencyInput(rawAmount);
    return num ? formatNumber(num) : '';
  }, [rawAmount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setRawAmount(val);
  };

  const setAmountValue = (num: number) => {
    setRawAmount(num === 0 ? '0' : num.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const amount = parseCurrencyInput(rawAmount);
    
    const result = await startShift(amount);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Shift kasir berhasil dimulai');
      onSuccess();
      onClose();
    } else {
      toast.error(result.error || 'Gagal memulai shift');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white border border-[#EAEFF8] shadow-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-4 pb-3 border-b border-[#EAEFF8] bg-slate-50/70">
            <DialogTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-[#0e59f9]" />
              Mulai Shift Kasir
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tentukan modal kas awal (uang kembalian) di laci kasir untuk mulai transaksi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-4">
            {/* Mode Switcher */}
            <div className="flex items-center justify-between p-1 bg-slate-100 border border-[#EAEFF8] rounded-xl text-xs gap-1">
              <button
                type="button"
                className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer ${!useCalculator ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                onClick={() => setUseCalculator(false)}
              >
                Input Cepat
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer ${useCalculator ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                onClick={() => setUseCalculator(true)}
              >
                Hitung Pecahan Uang
              </button>
            </div>

            {!useCalculator ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="posStartingCash" className="text-xs font-semibold text-slate-700">Modal Awal Kas (Rp)</Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400 text-sm">
                      Rp
                    </span>
                    <Input
                      id="posStartingCash"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formattedDisplayAmount}
                      onChange={handleAmountChange}
                      autoFocus
                      className="pl-11 font-financial tabular-nums text-lg font-semibold h-11 bg-white border-[#EAEFF8] focus-visible:ring-1 focus-visible:ring-[#0e59f9] rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-500 font-medium">Pilihan Cepat:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_DENOMINATIONS.map((denom) => (
                      <Button
                        key={denom}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2.5 font-financial tabular-nums border-[#EAEFF8] bg-white hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer"
                        onClick={() => setAmountValue(denom)}
                      >
                        {denom === 0 ? 'Rp 0 (Tanpa Modal)' : formatCurrency(denom)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 font-financial tabular-nums">
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {BILL_VALUES.map((bill) => (
                    <div key={bill.value} className="flex items-center justify-between gap-3 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-[#EAEFF8]">
                      <span className="font-semibold w-24 text-slate-800">{bill.label}</span>
                      <span className="text-slate-400 font-sans">×</span>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={billCounts[bill.value] || ''}
                        onChange={(e) => {
                          const qty = parseInt(e.target.value, 10) || 0;
                          setBillCounts(prev => ({ ...prev, [bill.value]: qty }));
                        }}
                        className="w-20 h-7 text-right font-semibold text-xs bg-white border-[#EAEFF8]"
                      />
                      <span className="text-slate-700 w-24 text-right font-medium font-financial tabular-nums">
                        {formatCurrency((billCounts[bill.value] || 0) * bill.value)}
                      </span>
                    </div>
                  ))}

                  {/* Coins input */}
                  <div className="flex items-center justify-between gap-3 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-[#EAEFF8]">
                    <span className="font-semibold w-24 flex items-center gap-1 font-sans text-slate-800">
                      <Coins className="w-3.5 h-3.5 text-amber-600" /> Koin / Lainnya
                    </span>
                    <span className="text-slate-400 font-sans">Rp</span>
                    <Input
                      type="text"
                      placeholder="0"
                      value={coinAmount}
                      onChange={(e) => setCoinAmount(e.target.value.replace(/\D/g, ''))}
                      className="w-36 h-7 text-right font-semibold text-xs bg-white border-[#EAEFF8]"
                    />
                  </div>
                </div>

                <div className="bg-[#0e59f9]/10 border border-[#0e59f9]/20 p-3 rounded-xl flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-800">Total Modal Dihitung:</span>
                  <span className="text-base font-semibold text-[#0e59f9] font-financial tabular-nums">
                    {formatCurrency(calculatorTotal)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 pt-3 border-t border-[#EAEFF8] bg-slate-50/70 flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="border-[#EAEFF8] hover:bg-slate-50 text-slate-700 rounded-xl text-xs h-10 font-medium cursor-pointer">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#0e59f9] hover:bg-[#0b4de0] text-white rounded-xl text-xs font-semibold h-10 shadow-xs cursor-pointer">
              {isSubmitting ? 'Memulai...' : 'Buka Shift Kasir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
