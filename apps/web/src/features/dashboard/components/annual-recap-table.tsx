'use client';

import * as React from 'react';
import { AnnualMonthRecap } from '@/lib/actions/dashboard';
import { formatCurrency } from '@/lib/utils/format';
import { Trophy, CalendarDays } from 'lucide-react';

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
  const totalLaba = activeMonths.reduce((acc, m) => acc + m.laba, 0);
  const avgLaba = Math.round(totalLaba / activeCount);

  return (
    <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs space-y-4">
      {/* Header & Best Month Highlight */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <CalendarDays className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Rekapitulasi Bulanan — Tahun {year}
            </h2>
            <p className="text-xs text-gray-500">
              Rincian komparasi performa finansial per bulan (data aktual berjalan)
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
              <th className="py-3 px-4">Net Revenue</th>
              <th className="py-3 px-4">Total Orders</th>
              <th className="py-3 px-4">Average Order Value (AOV)</th>
              <th className="py-3 px-4">Gross Profit</th>
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

                <td className="py-3 px-4 font-medium text-gray-900">
                  {row.status === 'future' ? '—' : formatCurrency(row.omzet)}
                </td>

                <td className="py-3 px-4">
                  {row.status === 'future' ? '—' : `${row.pesanan.toLocaleString('id-ID')} orders`}
                </td>

                <td className="py-3 px-4">
                  {row.status === 'future' ? '—' : formatCurrency(row.aov)}
                </td>

                <td className="py-3 px-4 text-blue-700 font-semibold">
                  {row.status === 'future' ? '—' : formatCurrency(row.laba)}
                </td>

                <td className="py-3 px-4 text-right">
                  {row.status === 'completed' && (
                    <span className="text-[11px] text-gray-500 font-medium">Selesai</span>
                  )}
                  {row.status === 'in_progress' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/70">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      Berjalan
                    </span>
                  )}
                  {row.status === 'future' && (
                    <span className="text-[11px] text-gray-400">Mendatang</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-gray-500 border-t border-gray-100">
        <div>
          <span>Rata-rata Bulanan ({activeCount} bulan aktif): </span>
          <span className="font-semibold text-gray-800">Revenue {formatCurrency(avgOmzet)}</span>
          <span className="text-gray-300 mx-2">•</span>
          <span className="font-semibold text-gray-800">Orders {avgTx.toLocaleString('id-ID')}</span>
          <span className="text-gray-300 mx-2">•</span>
          <span className="font-semibold text-blue-700">Gross Profit {formatCurrency(avgLaba)}</span>
        </div>
      </div>
    </div>
  );
}
