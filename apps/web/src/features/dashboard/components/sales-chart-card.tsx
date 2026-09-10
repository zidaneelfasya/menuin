'use client';

import * as React from 'react';
import { ChartDataPoint } from '@/lib/actions/dashboard';
import { formatCurrency } from '@/lib/utils/format';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SalesChartCardProps {
  data: ChartDataPoint[];
  tab: 'harian' | 'bulanan' | 'tahunan';
  periodLabel: string;
}

export function SalesChartCard({ data, tab, periodLabel }: SalesChartCardProps) {
  const [metricKey, setMetricKey] = React.useState<'omzet' | 'pesanan' | 'laba'>('omzet');

  const metricLabel = metricKey === 'omzet' ? 'Omzet Penjualan' : metricKey === 'pesanan' ? 'Total Pesanan' : 'Keuntungan Bersih';

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as ChartDataPoint;
      if (point.isFuture) {
        return (
          <div className="bg-white p-3 rounded-lg shadow-md border border-gray-100 text-xs">
            <p className="font-semibold text-gray-800">{point.label || point.date}</p>
            <p className="text-gray-400 mt-1">Bulan Mendatang (Belum ada data aktual)</p>
          </div>
        );
      }

      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-gray-100 text-xs space-y-1">
          <p className="font-semibold text-gray-800">{point.label || point.date}</p>
          <div className="pt-1 border-t border-gray-100 space-y-0.5">
            <p className="text-blue-600 font-medium">
              Omzet: <span className="font-bold">{formatCurrency(point.omzet)}</span>
            </p>
            <p className="text-gray-600 font-medium">
              Pesanan: <span className="font-bold">{point.pesanan} transaksi</span>
            </p>
            <p className="text-emerald-600 font-medium">
              Laba: <span className="font-bold">{formatCurrency(point.laba)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header: Title & Metric Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Grafik Penjualan
          </h2>
          <p className="text-xs text-gray-500">
            {periodLabel} — {metricLabel}
          </p>
        </div>

        {/* Metric Toggles */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60 self-start sm:self-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 text-xs font-medium px-2.5 rounded-md transition-all",
              metricKey === 'omzet' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => setMetricKey('omzet')}
          >
            Omzet
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 text-xs font-medium px-2.5 rounded-md transition-all",
              metricKey === 'pesanan' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => setMetricKey('pesanan')}
          >
            Pesanan
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 text-xs font-medium px-2.5 rounded-md transition-all",
              metricKey === 'laba' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => setMetricKey('laba')}
          >
            Laba
          </Button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-[280px] w-full pt-2">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400">
            Tidak ada data transaksi untuk rentang periode ini.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {tab === 'tahunan' ? (
              /* Bar Chart for Annual view */
              <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="label" 
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (metricKey === 'pesanan') return `${val}`;
                    if (val >= 1000000) return `Rp${(val / 1000000).toFixed(0)}jt`;
                    if (val >= 1000) return `Rp${(val / 1000).toFixed(0)}rb`;
                    return `Rp${val}`;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey={metricKey} 
                  fill="#2563EB" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            ) : (
              /* Area Chart for Harian and Bulanan */
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="label" 
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={20}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (metricKey === 'pesanan') return `${val}`;
                    if (val >= 1000000) return `Rp${(val / 1000000).toFixed(0)}jt`;
                    if (val >= 1000) return `Rp${(val / 1000).toFixed(0)}rb`;
                    return `Rp${val}`;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey={metricKey} 
                  stroke="#2563EB" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#chartGradient)" 
                  activeDot={{ r: 5, strokeWidth: 0, fill: "#1D4ED8" }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
