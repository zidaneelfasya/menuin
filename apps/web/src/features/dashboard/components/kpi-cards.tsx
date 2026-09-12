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
  Percent
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

  const renderGrowthBadge = (growth: number) => {
    if (growth > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
          <TrendingUp className="w-3 h-3 text-emerald-600" />
          +{growth}%
        </span>
      );
    }
    if (growth < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
          <TrendingDown className="w-3 h-3 text-rose-600" />
          {growth}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
        <Minus className="w-3 h-3 text-gray-500" />
        0%
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Penjualan (Total Omzet) */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm hover:border-gray-300 transition-colors">
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Penjualan (Omzet)
          </span>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold tracking-tight text-gray-900">
            {formatCurrency(metrics.totalOmzet)}
          </div>
          <div className="flex items-center gap-2 pt-1">
            {renderGrowthBadge(metrics.omzetGrowth)}
            <span className="text-xs text-gray-500">{comparisonText}</span>
          </div>
        </div>
      </div>

      {/* 2. Pesanan (Total Transaksi) */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm hover:border-gray-300 transition-colors">
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Pesanan Selesai
          </span>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold tracking-tight text-gray-900">
            {metrics.totalTransactions.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center gap-2 pt-1">
            {renderGrowthBadge(metrics.transactionsGrowth)}
            <span className="text-xs text-gray-500">{comparisonText}</span>
          </div>
        </div>
      </div>

      {/* 3. Rata-rata Pesanan (AOV) */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm hover:border-gray-300 transition-colors">
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Rata-rata Pesanan
          </span>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold tracking-tight text-gray-900">
            {formatCurrency(metrics.averageOrderValue)}
          </div>
          <div className="flex items-center gap-2 pt-1">
            {renderGrowthBadge(metrics.aovGrowth)}
            <span className="text-xs text-gray-500">{comparisonText}</span>
          </div>
        </div>
      </div>

      {/* 4. Keuntungan (Laba Kotor) */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm hover:border-gray-300 transition-colors">
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Keuntungan Bersih
          </span>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold tracking-tight text-emerald-600">
            {formatCurrency(metrics.totalLaba)}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
              Margin {metrics.profitMargin}%
            </span>
            {renderGrowthBadge(metrics.labaGrowth)}
          </div>
        </div>
      </div>
    </div>
  );
}
