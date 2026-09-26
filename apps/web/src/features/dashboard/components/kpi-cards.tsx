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
  Package,
  CreditCard,
  Info
} from 'lucide-react';

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
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
          <TrendingUp className="w-3 h-3 text-emerald-600" />
          +{growth}{unit}
        </span>
      );
    }
    if (growth < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/70">
          <TrendingDown className="w-3 h-3 text-rose-600" />
          {growth}{unit}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
        <Minus className="w-3 h-3 text-gray-400" />
        0{unit}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Net Revenue - Primary Revenue Driver */}
      <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs hover:border-gray-300 transition-colors flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Net Revenue
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold tracking-tight text-gray-900">
              {formatCurrency(metrics.netSales)}
            </div>
            <div className="flex items-center gap-2 pt-1">
              {renderGrowthBadge(metrics.netSalesGrowth)}
              <span className="text-xs text-gray-500">{comparisonText}</span>
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100 mt-3 flex items-center justify-between text-[11px] text-gray-500">
          <span>Gross: {formatCurrency(metrics.grossSales)}</span>
          {metrics.totalDiscount > 0 && (
            <span className="text-rose-600 font-medium">Diskon: -{formatCurrency(metrics.totalDiscount)}</span>
          )}
        </div>
      </div>

      {/* 2. COGS (Cost of Goods Sold / HPP Modal Bahan) */}
      <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs hover:border-gray-300 transition-colors flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                COGS (Cost of Goods Sold)
              </span>
              <span title="Total modal bahan baku & resep produk yang terjual pada periode ini" className="cursor-help">
                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </span>
            </div>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold tracking-tight text-gray-900">
              {formatCurrency(metrics.cogs)}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-medium text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                HPP: {metrics.cogsRatio}% of Revenue
              </span>
              {renderGrowthBadge(metrics.cogsGrowth)}
            </div>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 pt-2 border-t border-gray-100 mt-3">
          Beban pokok bahan & modal resep produk terjual
        </p>
      </div>

      {/* 3. Gross Profit (Laba Kotor = Net Revenue - COGS) */}
      <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs hover:border-gray-300 transition-colors flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Gross Profit
              </span>
              <span title="Laba Kotor = Net Revenue dikurangi COGS modal bahan (sebelum beban sewa & gaji operasional)" className="cursor-help">
                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </span>
            </div>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Percent className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold tracking-tight text-blue-700">
              {formatCurrency(metrics.grossProfit)}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Gross Margin: {metrics.grossMargin}%
              </span>
              {renderGrowthBadge(metrics.grossProfitGrowth)}
            </div>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 pt-2 border-t border-gray-100 mt-3">
          Net Revenue dikurangi biaya modal bahan (COGS)
        </p>
      </div>

      {/* 4. Total Orders (Volume Transaksi) */}
      <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs hover:border-gray-300 transition-colors flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Orders
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold tracking-tight text-gray-900">
              {metrics.totalTransactions.toLocaleString('id-ID')}
            </div>
            <div className="flex items-center gap-2 pt-1">
              {renderGrowthBadge(metrics.transactionsGrowth)}
              <span className="text-xs text-gray-500">{comparisonText}</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 pt-2 border-t border-gray-100 mt-3">
          Total tiket pesanan berstatus selesai dan lunas
        </p>
      </div>

      {/* 5. Average Order Value (AOV) */}
      <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs hover:border-gray-300 transition-colors flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Average Order Value (AOV)
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Receipt className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold tracking-tight text-gray-900">
              {formatCurrency(metrics.averageOrderValue)}
            </div>
            <div className="flex items-center gap-2 pt-1">
              {renderGrowthBadge(metrics.aovGrowth)}
              <span className="text-xs text-gray-500">{comparisonText}</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 pt-2 border-t border-gray-100 mt-3">
          Nilai keranjang belanja rata-rata per transaksi
        </p>
      </div>

      {/* 6. Gross Sales (Penjualan Bruto) */}
      <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs hover:border-gray-300 transition-colors flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Gross Sales (Bruto)
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold tracking-tight text-gray-900">
              {formatCurrency(metrics.grossSales)}
            </div>
            <div className="flex items-center gap-2 pt-1">
              {renderGrowthBadge(metrics.grossSalesGrowth)}
              <span className="text-xs text-gray-500">{comparisonText}</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 pt-2 border-t border-gray-100 mt-3">
          Total transaksi sebelum potongan promo & diskon
        </p>
      </div>
    </div>
  );
}
