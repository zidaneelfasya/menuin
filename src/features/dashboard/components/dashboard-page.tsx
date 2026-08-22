'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Activity, Package } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '@/lib/utils/format';
import { TopSellingList } from './top-selling-list';
import { AlertsSection } from './alerts-section';
import { RecentTransactions } from './recent-transactions';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

type DashboardContentProps = {
  metrics: {
    totalTransactions: number;
    totalOmzet: number;
    totalLaba: number;
    totalProduk: number;
  };
  chartData: { date: string; omzet: number }[];
  topProducts: { name: string; totalSold: number }[];
  lowStockProducts: { name: string; stock: number }[];
  recentTransactions: any[];
  tab: string;
};

export function DashboardPage({ metrics, chartData, topProducts, lowStockProducts, recentTransactions, tab }: DashboardContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    if (tab === 'harian') {
      return {
        from: fromParam ? new Date(fromParam) : new Date(),
        to: toParam ? new Date(toParam) : new Date(),
      }
    }
    return undefined;
  });

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    if (value !== 'harian') {
      params.delete('from');
      params.delete('to');
    } else {
      if (date?.from) params.set('from', format(date.from, 'yyyy-MM-dd'));
      if (date?.to) params.set('to', format(date.to, 'yyyy-MM-dd'));
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    if (newDate?.from) {
      const params = new URLSearchParams(searchParams);
      params.set('tab', 'harian');
      params.set('from', format(newDate.from, 'yyyy-MM-dd'));
      if (newDate.to) {
        params.set('to', format(newDate.to, 'yyyy-MM-dd'));
      } else {
        params.delete('to');
      }
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Eksekutif</h1>
          <p className="text-sm text-muted-foreground">Ringkasan performa bisnis dan operasional toko.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {tab === 'harian' && (
            <DatePickerWithRange date={date} setDate={handleDateChange} />
          )}
          <Tabs value={tab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="harian">Harian</TabsTrigger>
              <TabsTrigger value="bulanan">Bulanan</TabsTrigger>
              <TabsTrigger value="tahunan">Tahunan</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-sm border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Omzet</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalOmzet)}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl shadow-sm border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Laba</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Activity className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalLaba)}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transaksi</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ShoppingCart className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTransactions}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Katalog Produk</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Package className="w-4 h-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProduk} pcs</div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Chart & Top Selling */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {/* Sales Chart */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 rounded-2xl shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Grafik Penjualan</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    minTickGap={30}
                    tickFormatter={(value) => tab === 'tahunan' ? value : value.slice(5)} // Show MM-DD unless year
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `Rp${value / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Omzet']}
                    labelFormatter={(label) => `Waktu: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="omzet" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--background))" }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Selling */}
        <div className="col-span-1 lg:col-span-1">
          <TopSellingList products={topProducts} />
        </div>
      </div>

      {/* Row 3: Alerts and Recent Transactions */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentTransactions transactions={recentTransactions} />
        <AlertsSection products={lowStockProducts} />
      </div>
    </div>
  );
}
