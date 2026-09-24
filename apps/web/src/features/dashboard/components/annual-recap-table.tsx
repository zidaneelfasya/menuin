'use client';

import * as React from 'react';
import { AnnualMonthRecap } from '@/lib/actions/dashboard';
import { formatCurrency } from '@/lib/utils/format';
import { Trophy, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AnnualRecapTableProps {
  recap: AnnualMonthRecap[];
  bestMonthName?: string;
  year: number;
}

export function AnnualRecapTable({ recap, bestMonthName, year }: AnnualRecapTableProps) {
  // Calculate average for completed or in_progress months
  const activeMonths = recap.filter(m => m.status !== 'future');
  const activeCount = Math.max(1, activeMonths.length);
  const totalOmzet = activeMonths.reduce((acc, m) => acc + m.omzet, 0);
  const avgOmzet = Math.round(totalOmzet / activeCount);
  const totalTx = activeMonths.reduce((acc, m) => acc + m.pesanan, 0);
  const avgTx = Math.round(totalTx / activeCount);

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header & Best Month Highlight */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Performa Setiap Bulan — Tahun {year}
            </h2>
            <p className="text-xs text-gray-500">
              Rincian komparasi performa pendapatan bulanan outlet (data aktual sampai saat ini)
            </p>
          </div>
        </div>

        {bestMonthName && (
          <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 text-amber-900 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-center">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>Bulan Terbaik: {bestMonthName}</span>
          </div>
        )}
      </div>

      {/* Table Breakdown */}
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
            <tr>
              <th className="py-3 px-4">Bulan</th>
              <th className="py-3 px-4">Penjualan (Omzet)</th>
              <th className="py-3 px-4">Pesanan</th>
              <th className="py-3 px-4">Rata-rata Pesanan</th>
              <th className="py-3 px-4">Keuntungan</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {recap.map((row) => (
              <tr 
                key={row.monthIndex} 
                className={`transition-colors ${
                  row.isBestMonth 
                    ? 'bg-amber-50/30 font-medium' 
                    : row.status === 'future'
                    ? 'text-gray-400 bg-gray-50/20'
                    : 'hover:bg-gray-50/50'
                }`}
              >
                <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-1.5">
                  {row.monthName}
                  {row.isBestMonth && (
                    <span title="Bulan Terbaik">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    </span>
                  )}
                </td>

                <td className="py-3 px-4">
                  {row.status === 'future' ? '—' : formatCurrency(row.omzet)}
                </td>

                <td className="py-3 px-4">
                  {row.status === 'future' ? '—' : `${row.pesanan} transaksi`}
                </td>

                <td className="py-3 px-4">
                  {row.status === 'future' ? '—' : formatCurrency(row.aov)}
                </td>

                <td className="py-3 px-4 text-emerald-700">
                  {row.status === 'future' ? '—' : formatCurrency(row.laba)}
                </td>

                <td className="py-3 px-4 text-right">
                  {row.status === 'completed' ? (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      Selesai
                    </Badge>
                  ) : row.status === 'in_progress' ? (
                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                      Sedang Berjalan
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-gray-100 text-gray-400 border-gray-200">
                      Mendatang
                    </Badge>
                  )}
                </td>
              </tr>
            ))}

            {/* Summary Average Row */}
            <tr className="bg-gray-50/80 font-bold text-gray-900 border-t-2 border-gray-200">
              <td className="py-3 px-4">Rata-rata Bulanan</td>
              <td className="py-3 px-4 text-blue-700">{formatCurrency(avgOmzet)}</td>
              <td className="py-3 px-4">{avgTx} transaksi</td>
              <td className="py-3 px-4">{formatCurrency(avgTx > 0 ? Math.round(avgOmzet / avgTx) : 0)}</td>
              <td className="py-3 px-4 text-emerald-700">{formatCurrency(Math.round(avgOmzet * 0.55))}</td>
              <td className="py-3 px-4 text-right text-[11px] text-gray-500">
                {activeCount} Bulan Aktif
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
