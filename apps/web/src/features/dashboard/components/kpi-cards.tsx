'use client';

import * as React from 'react';
import { PeriodMetrics } from '@/lib/actions/dashboard';
import { formatCurrency } from '@/lib/utils/format';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign, 
  ShoppingBag, 
  Receipt, 
  Percent,
  BadgeDollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardsProps {
  metrics: PeriodMetrics;
  periodType: 'harian' | 'bulanan' | 'tahunan';
}

export function KpiCards({ metrics, periodType }: KpiCardsProps) {
  const comparisonText = periodType === 'bulanan' 
    ? 'vs bulan lalu' 
    : periodType === 'tahunan' 
    ? 'vs tahun lalu' 
    : 'vs periode lalu';

  const renderGrowthBadge = (growth: number, unit = '%') => {
    if (growth > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-900/40">
          <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          +{growth}{unit}
        </span>
      );
    }
    if (growth < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200/60 dark:border-rose-900/40">
          <TrendingDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          {growth}{unit}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
        <Minus className="w-3 h-3 text-muted-foreground" />
        0{unit}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Gross Sales (Penjualan Bruto) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gross Sales
            </span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <BadgeDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {formatCurrency(metrics.grossSales)}
            </div>
            <div className="flex items-center gap-2 pt-1">
              {renderGrowthBadge(metrics.grossSalesGrowth)}
              <span className="text-xs text-muted-foreground">{comparisonText}</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground/80 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-3">
          Nilai penjualan bruto sebelum diskon & potongan
        </p>
      </div>

      {/* 2. Net Sales (Penjualan Bersih) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Net Sales
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {formatCurrency(metrics.netSales)}
            </div>
            <div className="flex items-center gap-2 pt-1">
              {renderGrowthBadge(metrics.netSalesGrowth)}
              <span className="text-xs text-muted-foreground">{comparisonText}</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground/80 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-3">
          Penjualan setelah potongan diskon & voucher
        </p>
      </div>

      {/* 3. Transactions (Jumlah Transaksi) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Transactions
            </span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {metrics.totalTransactions.toLocaleString('id-ID')}
            </div>
            <div className="flex items-center gap-2 pt-1">
              {renderGrowthBadge(metrics.transactionsGrowth)}
              <span className="text-xs text-muted-foreground">{comparisonText}</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground/80 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-3">
          Total pesanan yang berhasil diselesaikan
        </p>
      </div>

      {/* 4. Gross Profit (Laba Kotor Berdasarkan COGS) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gross Profit
            </span>
            <div className="p-2 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-teal-600 dark:text-teal-400">
              {formatCurrency(metrics.grossProfit)}
            </div>
            <div className="flex items-center gap-2 pt-1">
              {renderGrowthBadge(metrics.grossProfitGrowth)}
              <span className="text-xs text-muted-foreground">{comparisonText}</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground/80 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-3">
          Laba kotor berdasarkan COGS (HPP modal) yang tercatat
        </p>
      </div>

      {/* 5. Average Sale per Transaction (AOV) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Average Sale per Tx
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {formatCurrency(metrics.averageOrderValue)}
            </div>
            <div className="flex items-center gap-2 pt-1">
              {renderGrowthBadge(metrics.aovGrowth)}
              <span className="text-xs text-muted-foreground">{comparisonText}</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground/80 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-3">
          Rata-rata nilai penjualan per transaksi
        </p>
      </div>

      {/* 6. Gross Margin (Persentase Margin Laba Kotor) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gross Margin
            </span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
              {metrics.grossMargin}%
            </div>
            <div className="flex items-center gap-2 pt-1">
              {renderGrowthBadge(metrics.grossMarginGrowth, '% poin')}
              <span className="text-xs text-muted-foreground">{comparisonText}</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground/80 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-3">
          Persentase margin laba kotor terhadap penjualan
        </p>
      </div>
    </div>
  );
}
