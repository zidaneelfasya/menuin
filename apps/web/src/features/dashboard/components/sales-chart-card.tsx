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
import { BarChart3 } from 'lucide-react';

interface SalesChartCardProps {
  data: ChartDataPoint[];
  tab: 'harian' | 'bulanan' | 'tahunan';
  periodLabel: string;
}

export function SalesChartCard({ data, tab, periodLabel }: SalesChartCardProps) {
  const [metricKey, setMetricKey] = React.useState<'omzet' | 'pesanan' | 'laba'>('omzet');

  const metricLabel = metricKey === 'omzet' 
    ? 'Net Revenue' 
    : metricKey === 'pesanan' 
    ? 'Total Orders' 
    : 'Gross Profit';

  // Primary colors: Menuin Blue (#2563EB), Indigo (#4F46E5), Sky (#0284C7)
  const primaryColor = metricKey === 'omzet' 
    ? '#2563EB' // Menuin Primary Blue
    : metricKey === 'pesanan' 
    ? '#4F46E5' // Indigo
    : '#0284C7'; // Sky-600

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as ChartDataPoint;
      if (point.isFuture) {
        return (
          <div className="bg-white p-3 rounded-lg shadow-md border border-gray-100 text-xs">
            <p className="font-semibold text-gray-900">{point.label || point.date}</p>
            <p className="text-gray-400 mt-1">Bulan Mendatang (Belum ada data aktual)</p>
          </div>
        );
      }

      let displayTitle = point.label || point.date;
      if (point.date && point.date.includes(' ') && point.label && point.label.includes(':')) {
        displayTitle = point.label.includes(',')
          ? point.label.replace(', ', ', Pukul ')
          : `Pukul ${point.label}`;
      }

      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-gray-100 text-xs space-y-1">
          <p className="font-semibold text-gray-900">{displayTitle}</p>
          <div className="pt-1 border-t border-gray-100 space-y-0.5">
            <p className="text-blue-700 font-medium">
              Net Revenue: <span className="font-semibold">{formatCurrency(point.omzet)}</span>
            </p>
            <p className="text-indigo-700 font-medium">
              Total Orders: <span className="font-semibold">{point.pesanan} transaksi</span>
            </p>
            <p className="text-sky-700 font-medium">
              Gross Profit: <span className="font-semibold">{formatCurrency(point.laba)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-xs space-y-4">
      {/* Header: Title & Metric Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Tren Kinerja Finansial
            </h2>
            <p className="text-xs text-gray-500">
              {periodLabel} — {metricLabel}
            </p>
          </div>
        </div>

        {/* Metric Toggles */}
        <div className="flex items-center bg-gray-100/80 p-0.5 rounded-lg border border-gray-200/70 self-start sm:self-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 text-xs font-medium px-2.5 rounded-md transition-all active:scale-[0.97]",
              metricKey === 'omzet' ? "bg-white text-gray-900 shadow-xs font-semibold" : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => setMetricKey('omzet')}
          >
            Net Revenue
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 text-xs font-medium px-2.5 rounded-md transition-all active:scale-[0.97]",
              metricKey === 'pesanan' ? "bg-white text-gray-900 shadow-xs font-semibold" : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => setMetricKey('pesanan')}
          >
            Total Orders
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 text-xs font-medium px-2.5 rounded-md transition-all active:scale-[0.97]",
              metricKey === 'laba' ? "bg-white text-gray-900 shadow-xs font-semibold" : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => setMetricKey('laba')}
          >
            Gross Profit
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
                  fill={primaryColor} 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            ) : (
              /* Area Chart for Harian and Bulanan */
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.18}/>
                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0.0}/>
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
                  stroke={primaryColor} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#chartGradient)" 
                  activeDot={{ r: 4, strokeWidth: 0, fill: primaryColor }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
