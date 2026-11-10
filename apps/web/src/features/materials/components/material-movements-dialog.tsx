'use client';

import * as React from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RefreshCw, 
  Calendar, 
  Clock, 
  User, 
  History,
  X 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getRawMaterialMovements, RawMaterialMovementItem } from '@/lib/actions/materials';
import { cn } from '@/lib/utils';

interface MaterialMovementsDialogProps {
  materialId?: string | null;
  materialName?: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type FilterType = 'ALL' | 'IN' | 'OUT' | 'ADJUSTMENT';

export function MaterialMovementsDialog({
  materialId,
  materialName,
  isOpen,
  onOpenChange,
}: MaterialMovementsDialogProps) {
  const [movements, setMovements] = React.useState<RawMaterialMovementItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [filterType, setFilterType] = React.useState<FilterType>('ALL');

  const loadMovements = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getRawMaterialMovements({
        rawMaterialId: materialId || undefined,
        limit: 100,
      });
      if (res.success) {
        setMovements(res.data);
      }
    } catch (e) {
      console.error('Failed to load movements:', e);
    } finally {
      setIsLoading(false);
    }
  }, [materialId]);

  React.useEffect(() => {
    if (isOpen) {
      loadMovements();
    }
  }, [isOpen, loadMovements]);

  const filteredMovements = React.useMemo(() => {
    if (filterType === 'ALL') return movements;
    return movements.filter((m) => m.type === filterType);
  }, [movements, filterType]);

  const formatLogDate = (date: Date | string) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '-';
      const datePart = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
      const timePart = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
      return `${datePart}, ${timePart} WIB`;
    } catch {
      return '-';
    }
  };

  const getReasonLabel = (cat: string | null, reasonText: string | null) => {
    if (reasonText && reasonText.trim()) return reasonText;
    switch (cat) {
      case 'RESTOCK_PURCHASE':
        return 'Pembelian Supplier / Restok';
      case 'RETURN_IN':
        return 'Retur Masuk';
      case 'PRODUCTION_USED':
        return 'Terpakai Produksi / Jualan';
      case 'WASTE_EXPIRED':
        return 'Basi / Kedaluwarsa (Waste)';
      case 'DAMAGE_SPOILED':
        return 'Rusak / Tumpah / Pecah';
      case 'OPNAME_CORRECTION_ADD':
        return 'Koreksi Lebih (+ Opname)';
      case 'OPNAME_CORRECTION_SUB':
        return 'Koreksi Kurang (- Opname)';
      case 'RESTOCK_BATCH':
        return 'Stok Awal Penambahan';
      default:
        return 'Penyesuaian Stok';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-6 rounded-3xl border-none shadow-2xl bg-white max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="space-y-1 pb-2 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-slate-900 tracking-normal flex items-center gap-2">
              <History className="h-4.5 w-4.5 text-[#0e59f9]" />
              <span>{materialName ? `Riwayat Mutasi: ${materialName}` : 'Log Riwayat Mutasi Stok Bahan'}</span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Catatan kronologis keluar-masuk bahan baku, penyesuaian opname, dan pemakaian operasional.
          </DialogDescription>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 pt-2">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border-none",
                filterType === 'ALL'
                  ? "bg-[#0e59f9] text-white shadow-xs font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              )}
            >
              Semua ({movements.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('IN')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border-none",
                filterType === 'IN'
                  ? "bg-emerald-600 text-white shadow-xs font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              )}
            >
              Stok Masuk
            </button>
            <button
              type="button"
              onClick={() => setFilterType('OUT')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border-none",
                filterType === 'OUT'
                  ? "bg-rose-600 text-white shadow-xs font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              )}
            >
              Stok Keluar
            </button>
            <button
              type="button"
              onClick={() => setFilterType('ADJUSTMENT')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border-none",
                filterType === 'ADJUSTMENT'
                  ? "bg-blue-600 text-white shadow-xs font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              )}
            >
              Opname
            </button>
          </div>
        </DialogHeader>

        {/* Movements Timeline List */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2 divide-y divide-slate-100/80">
          {isLoading && movements.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Memuat catatan mutasi...
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-700">Belum ada riwayat mutasi</p>
              <p className="text-[11px] text-slate-400">Semua perubahan stok masuk dan keluar akan tercatat di sini secara otomatis.</p>
            </div>
          ) : (
            filteredMovements.map((log) => {
              const isEntry = log.type === 'IN';
              const isExit = log.type === 'OUT';
              const isAdj = log.type === 'ADJUSTMENT';

              return (
                <div key={log.id} className="py-3 px-1 flex items-start justify-between gap-3 group hover:bg-slate-50/50 rounded-2xl transition-colors">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Direction Icon Badge */}
                    <div className="pt-0.5 shrink-0">
                      {isEntry ? (
                        <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <ArrowUpCircle className="h-4.5 w-4.5" />
                        </div>
                      ) : isExit ? (
                        <div className="h-8 w-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                          <ArrowDownCircle className="h-4.5 w-4.5" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-50 text-[#0e59f9] flex items-center justify-center">
                          <RefreshCw className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Movement Details */}
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {log.materialName}
                        </span>
                        <span className={cn(
                          "px-2 py-0.2 rounded-full text-[10px] font-semibold border-none",
                          isEntry ? "bg-emerald-50 text-emerald-700" :
                          isExit ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"
                        )}>
                          {isEntry ? 'Masuk' : isExit ? 'Keluar' : 'Opname'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-1">
                        {getReasonLabel(log.reasonCategory, log.reason)}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{formatLogDate(log.createdAt)}</span>
                        <span>•</span>
                        <span>Oleh: {log.actorName || 'Owner'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Stock Progression */}
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "text-sm font-semibold tabular-nums font-numeric",
                      isEntry ? "text-emerald-600" : isExit ? "text-rose-600" : "text-slate-800"
                    )}>
                      {isEntry ? `+${log.quantity}` : isExit ? `-${log.quantity}` : `${log.quantity}`} {log.materialUnit}
                    </p>
                    <p className="text-[11px] text-slate-400 tabular-nums font-numeric">
                      {log.previousStock} → {log.currentStock} {log.materialUnit}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs border-none shadow-sm-md cursor-pointer transition-all active:scale-[0.98] select-none"
          >
            Tutup
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
