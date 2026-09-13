import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Store,
  Smartphone,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Calendar,
  Clock,
  Receipt,
  Percent,
  Utensils,
  Star,
  Check,
  Copy,
  DollarSign,
  Activity,
  GitBranch,
  Package,
  Cpu,
  X,
  Layers,
  ArrowUpRight,
} from 'lucide-react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAuthStore } from '@/store/auth-store';
import { useActiveShift } from '@/hooks/use-shifts';
import { useDashboardData, ChartDataPoint, TopSellingProduct, BusinessInsight } from '@/hooks/use-dashboard';

export type DashboardPeriod = 'harian' | 'bulanan' | 'tahunan';
export type DailyPreset = 'today' | 'yesterday' | '7d' | '30d' | 'custom';
export type MetricKey = 'omzet' | 'pesanan' | 'laba';

export function ModernDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 600;

  const user = useAuthStore((state) => state.user);
  const { data: shiftData } = useActiveShift();
  const activeShift = shiftData?.data;

  // Measurement for chart container to guarantee it stays strictly inside the card
  const [cardInnerWidth, setCardInnerWidth] = useState<number>(0);

  // Period Selection State
  const [activePeriod, setActivePeriod] = useState<DashboardPeriod>('harian');
  const [dailyPreset, setDailyPreset] = useState<DailyPreset>('7d');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-06');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-09-12');

  // Month & Year state
  const now = new Date();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Interactive Calendar State inside Date Picker Modal
  const [calYear, setCalYear] = useState<number>(2026);
  const [calMonth, setCalMonth] = useState<number>(8);
  const [tempRangeStart, setTempRangeStart] = useState<string>('2026-09-06');
  const [tempRangeEnd, setTempRangeEnd] = useState<string | null>('2026-09-12');

  // Active Metric for Chart
  const [activeMetric, setActiveMetric] = useState<MetricKey>('omzet');

  // Interactive Touch/Scrub State for Chart
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  // Date selection modal visibility
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  // Copy feedback state
  const [copiedUrl, setCopiedUrl] = useState(false);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Build params for useDashboardData hook
  const queryParams = useMemo(() => {
    const p: {
      tab: DashboardPeriod;
      from?: string;
      to?: string;
      month?: string;
      year?: string;
      preset?: string;
    } = { tab: activePeriod };

    if (activePeriod === 'harian') {
      if (customStartDate && customEndDate) {
        p.from = customStartDate;
        p.to = customEndDate;
      } else {
        p.preset = dailyPreset === 'today' ? 'today' : dailyPreset === 'yesterday' ? 'yesterday' : dailyPreset === '30d' ? 'last30' : 'last7';
      }
    } else if (activePeriod === 'bulanan') {
      const mStr = String(selectedMonthIndex + 1).padStart(2, '0');
      p.month = `${selectedYear}-${mStr}`;
    } else if (activePeriod === 'tahunan') {
      p.year = String(selectedYear);
    }

    return p;
  }, [activePeriod, dailyPreset, customStartDate, customEndDate, selectedMonthIndex, selectedYear]);

  // Live query from backend database
  const { data: liveData, isRefetching, refetch } = useDashboardData(queryParams);

  const rangeDayCount = useMemo(() => {
    if (!customStartDate) return 7;
    const s = new Date(customStartDate);
    const e = new Date(customEndDate || customStartDate);
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  }, [customStartDate, customEndDate]);

  // Format Date trigger button label
  const dateButtonLabel = useMemo(() => {
    if (activePeriod === 'harian') {
      if (customStartDate && customEndDate) {
        const s = new Date(customStartDate);
        const e = new Date(customEndDate);
        if (customStartDate === customEndDate) {
          return `${s.getDate()} ${shortMonthNames[s.getMonth()]}`;
        }
        return `${s.getDate()} ${shortMonthNames[s.getMonth()]} — ${e.getDate()} ${shortMonthNames[e.getMonth()]}`;
      }
      return '7 Hari';
    }
    if (activePeriod === 'bulanan') {
      return `${shortMonthNames[selectedMonthIndex]} ${selectedYear}`;
    }
    return `Tahun ${selectedYear}`;
  }, [activePeriod, customStartDate, customEndDate, selectedMonthIndex, selectedYear]);

  // Formatted period subtitle text
  const periodLabelText = useMemo(() => {
    if (liveData?.periodLabel) return liveData.periodLabel;
    if (activePeriod === 'harian') {
      if (customStartDate && customEndDate) {
        const s = new Date(customStartDate);
        const e = new Date(customEndDate);
        if (customStartDate === customEndDate) {
          return `${s.getDate()} ${monthNames[s.getMonth()]} ${s.getFullYear()}`;
        }
        return `${s.getDate()} ${shortMonthNames[s.getMonth()]} — ${e.getDate()} ${shortMonthNames[e.getMonth()]} ${e.getFullYear()}`;
      }
      return '6 Sep — 12 Sep 2026';
    }
    if (activePeriod === 'bulanan') {
      return `${monthNames[selectedMonthIndex]} ${selectedYear}`;
    }
    return `Tahun ${selectedYear}`;
  }, [liveData, activePeriod, customStartDate, customEndDate, selectedMonthIndex, selectedYear]);

  // Fallback data
  const fallbackHourlyData: ChartDataPoint[] = useMemo(() => {
    if (rangeDayCount === 1) {
      return [
        { date: `${customStartDate} 08:00`, label: '08:00', omzet: 350000, pesanan: 5, laba: 210000 },
        { date: `${customStartDate} 10:00`, label: '10:00', omzet: 850000, pesanan: 14, laba: 510000 },
        { date: `${customStartDate} 12:00`, label: '12:00', omzet: 1650000, pesanan: 26, laba: 990000 },
        { date: `${customStartDate} 14:00`, label: '14:00', omzet: 920000, pesanan: 15, laba: 552000 },
        { date: `${customStartDate} 16:00`, label: '16:00', omzet: 780000, pesanan: 12, laba: 468000 },
        { date: `${customStartDate} 18:00`, label: '18:00', omzet: 1250000, pesanan: 20, laba: 750000 },
        { date: `${customStartDate} 20:00`, label: '20:00', omzet: 950000, pesanan: 15, laba: 570000 },
        { date: `${customStartDate} 22:00`, label: '22:00', omzet: 300000, pesanan: 5, laba: 180000 },
      ];
    }
    return [
      { date: '2026-09-06', label: 'Min, 6 Sep', omzet: 4200000, pesanan: 66, laba: 2520000 },
      { date: '2026-09-07', label: 'Sen, 7 Sep', omzet: 3900000, pesanan: 62, laba: 2340000 },
      { date: '2026-09-08', label: 'Sel, 8 Sep', omzet: 4500000, pesanan: 71, laba: 2700000 },
      { date: '2026-09-09', label: 'Rab, 9 Sep', omzet: 4800000, pesanan: 75, laba: 2880000 },
      { date: '2026-09-10', label: 'Kam, 10 Sep', omzet: 5400000, pesanan: 85, laba: 3240000 },
      { date: '2026-09-11', label: 'Jum, 11 Sep', omzet: 5800000, pesanan: 92, laba: 3480000 },
      { date: '2026-09-12', label: 'Sab, 12 Sep', omzet: 3800000, pesanan: 61, laba: 2280000 },
    ];
  }, [rangeDayCount, customStartDate]);

  const chartPoints: ChartDataPoint[] = useMemo(() => {
    if (liveData?.chartData && liveData.chartData.length > 0) {
      return liveData.chartData;
    }
    return fallbackHourlyData;
  }, [liveData, fallbackHourlyData]);

  useEffect(() => {
    if (chartPoints.length > 0) {
      setActivePointIndex(chartPoints.length - 1);
    }
  }, [chartPoints]);

  const activePoint = useMemo(() => {
    if (activePointIndex !== null && chartPoints[activePointIndex]) {
      return chartPoints[activePointIndex];
    }
    return chartPoints[chartPoints.length - 1] || null;
  }, [activePointIndex, chartPoints]);

  // KPI Metrics
  const metrics = useMemo(() => {
    if (liveData?.metrics) {
      return {
        totalOmzet: liveData.metrics.totalOmzet,
        omzetGrowth: liveData.metrics.omzetGrowth > 0 ? `+${liveData.metrics.omzetGrowth}%` : `${liveData.metrics.omzetGrowth}%`,
        totalPesanan: liveData.metrics.totalTransactions,
        pesananGrowth: liveData.metrics.transactionsGrowth > 0 ? `+${liveData.metrics.transactionsGrowth}%` : `${liveData.metrics.transactionsGrowth}%`,
        averageOrderValue: liveData.metrics.averageOrderValue,
        aovGrowth: liveData.metrics.aovGrowth > 0 ? `+${liveData.metrics.aovGrowth}%` : `${liveData.metrics.aovGrowth}%`,
        totalLaba: liveData.metrics.totalLaba,
        labaMargin: `${liveData.metrics.profitMargin || 60.0}%`,
        comparisonText: activePeriod === 'bulanan' ? 'vs bulan lalu' : activePeriod === 'tahunan' ? 'vs tahun lalu' : 'vs 7 hari lalu',
      };
    }
    return {
      totalOmzet: 32400000,
      omzetGrowth: '+11.8%',
      totalPesanan: 512,
      pesananGrowth: '+9.4%',
      averageOrderValue: 63280,
      aovGrowth: '+4.2%',
      totalLaba: 19440000,
      labaMargin: '60.0%',
      comparisonText: 'vs 7 hari lalu',
    };
  }, [liveData, activePeriod]);

  // Top Products list
  const topProducts: TopSellingProduct[] = useMemo(() => {
    if (liveData?.topProducts && liveData.topProducts.length > 0) {
      return liveData.topProducts;
    }
    return [
      { id: '1', name: 'Caramel Macchiato', categoryName: 'Minuman Kopi', totalRevenue: 35000, totalSold: 1, sharePercentage: 55 },
      { id: '2', name: 'Kopi Susu Gula Aren', categoryName: 'Minuman Kopi', totalRevenue: 28000, totalSold: 1, sharePercentage: 35 },
      { id: '3', name: 'Butter Croissant Premium', categoryName: 'Pastry', totalRevenue: 22000, totalSold: 1, sharePercentage: 20 },
    ];
  }, [liveData]);

  // Business Insights list
  const insights: BusinessInsight[] = useMemo(() => {
    if (liveData?.insights && liveData.insights.length > 0) {
      return liveData.insights;
    }
    return [
      { id: '1', type: 'trend', text: 'Penjualan bertumbuh +11.8% dibandingkan periode sebelumnya, didukung oleh stabilitas transaksi.' },
      { id: '2', type: 'champion', text: 'Caramel Macchiato mencatat penjualan terbaik pada periode ini.' },
      { id: '3', type: 'basket', text: 'Rata-rata keranjang belanja sebesar Rp 51.667 per transaksi.' },
      { id: '4', type: 'peak', text: 'Aktivitas pesanan paling padat terjadi pada akhir pekan.' },
    ];
  }, [liveData]);

  // Outlet Overview info
  const outletOverview = useMemo(() => {
    return {
      outletName: liveData?.outlet?.outletName || user?.tenantName || 'Kedai Kopi Kita',
      outletKey: liveData?.outlet?.outletKey || 'kedai-kopi-kita',
      slug: liveData?.outlet?.slug || 'kedai-kopi-kita',
      staffCount: liveData?.outlet?.staffCount || 12,
      deviceCount: liveData?.outlet?.deviceCount || 4,
      totalLifetimeTransactions: liveData?.outlet?.totalLifetimeTransactions || 1284,
      activeAlertCount: liveData?.outlet?.activeAlertCount || 0,
      criticalAlerts: liveData?.outlet?.criticalAlerts || [],
    };
  }, [liveData, user]);

  const publicUrl = `https://${outletOverview.slug}.menuin.id`;

  const handleCopyUrl = () => {
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Operational Pulse data
  const operationalPulse = useMemo(() => {
    return {
      shift: {
        active: Boolean(activeShift || liveData?.operationalPulse?.activeShift),
        cashierName: activeShift?.cashierName || liveData?.operationalPulse?.activeShift?.cashierName || user?.username || 'Kasir Aktif',
        startedAt: activeShift?.startTime ? '08:00' : (liveData?.operationalPulse?.activeShift?.startedAt || '08:00 WIB'),
        startingCash: activeShift?.startingCash ? Number(activeShift.startingCash) : (liveData?.operationalPulse?.activeShift?.startingCash || 250000),
      },
      devices: {
        total: liveData?.operationalPulse?.devices?.total || 4,
        active: liveData?.operationalPulse?.devices?.active || 4,
        offline: liveData?.operationalPulse?.devices?.offline || 0,
      },
      stock: {
        total: liveData?.operationalPulse?.stockHealth?.total || 48,
        safe: liveData?.operationalPulse?.stockHealth?.safe || 46,
        low: liveData?.operationalPulse?.stockHealth?.low || 2,
        outOfStock: liveData?.operationalPulse?.stockHealth?.outOfStock || 0,
      },
    };
  }, [activeShift, liveData, user]);

  // SVG Chart Dimensions
  const chartHeight = 180;
  const chartPaddingHorizontal = 16;
  const chartPaddingTop = 16;
  const chartPaddingBottom = 30;

  const effectiveChartWidth = Math.max(cardInnerWidth > 0 ? cardInnerWidth : width - 64, 260);

  const svgPathData = useMemo(() => {
    if (!chartPoints || chartPoints.length === 0) {
      return { linePath: '', areaPath: '', coords: [] };
    }

    const values = chartPoints.map((pt) => {
      if (activeMetric === 'omzet') return pt.omzet;
      if (activeMetric === 'pesanan') return pt.pesanan;
      return pt.laba;
    });

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

    const usableWidth = effectiveChartWidth - chartPaddingHorizontal * 2;
    const usableHeight = chartHeight - chartPaddingTop - chartPaddingBottom;

    const coords = chartPoints.map((pt, idx) => {
      const val = activeMetric === 'omzet' ? pt.omzet : activeMetric === 'pesanan' ? pt.pesanan : pt.laba;
      const x = chartPaddingHorizontal + (idx / Math.max(chartPoints.length - 1, 1)) * usableWidth;
      const normalizedVal = (val - minVal) / range;
      const y = chartPaddingTop + usableHeight - normalizedVal * usableHeight;
      return { x, y, pt, idx };
    });

    let linePath = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + ((next.x - curr.x) * 2) / 3;
      const cpY2 = next.y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }

    const baselineY = chartHeight - chartPaddingBottom;
    const lastX = coords[coords.length - 1].x;
    const firstX = coords[0].x;
    const areaPath = `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;

    return { linePath, areaPath, coords };
  }, [chartPoints, activeMetric, effectiveChartWidth]);

  const visibleLabelIndices = useMemo(() => {
    const len = chartPoints.length;
    if (len <= 5) {
      return new Set(chartPoints.map((_, i) => i));
    }
    const maxLabels = isTablet || isLandscape ? 7 : 4;
    const step = Math.ceil((len - 1) / (maxLabels - 1));
    const indices = new Set<number>();
    for (let i = 0; i < len; i += step) {
      indices.add(i);
    }
    indices.add(len - 1);
    return indices;
  }, [chartPoints.length, isTablet, isLandscape]);

  // Calendar Day Generation Logic
  const calendarDays = useMemo(() => {
    const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const days: { dayNumber: number | null; dateStr: string | null }[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push({ dayNumber: null, dateStr: null });
    }

    for (let d = 1; d <= totalDays; d++) {
      const mStr = String(calMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      days.push({
        dayNumber: d,
        dateStr: `${calYear}-${mStr}-${dStr}`,
      });
    }

    return days;
  }, [calYear, calMonth]);

  const handleCalendarDayPress = (dateStr: string) => {
    if (!tempRangeStart || (tempRangeStart && tempRangeEnd)) {
      setTempRangeStart(dateStr);
      setTempRangeEnd(null);
    } else {
      if (dateStr < tempRangeStart) {
        setTempRangeEnd(tempRangeStart);
        setTempRangeStart(dateStr);
      } else {
        setTempRangeEnd(dateStr);
      }
    }
  };

  const handleApplyCalendarRange = () => {
    const s = tempRangeStart;
    const e = tempRangeEnd || tempRangeStart;
    setCustomStartDate(s);
    setCustomEndDate(e);
    setDailyPreset('custom');
    setActivePeriod('harian');
    setIsDateModalOpen(false);
  };

  const handleOpenDateModal = () => {
    setTempRangeStart(customStartDate);
    setTempRangeEnd(customEndDate);
    if (customStartDate) {
      const parts = customStartDate.split('-');
      setCalYear(parseInt(parts[0]));
      setCalMonth(parseInt(parts[1]) - 1);
    }
    setIsDateModalOpen(true);
  };

  // Responsive KPI card width (50% minus gap on phones, 25% on tablets)
  const kpiCardWidth = isTablet ? (width - 48 - 36) / 4 : isLandscape ? (width - 48 - 12) / 2 : (width - 32 - 10) / 2;

  // Responsive Operational card width (100% on phones, 33% on tablets/landscape)
  const opCardWidth = isTablet || isLandscape ? (width - 48 - 24) / 3 : '100%';

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16) + 72,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        <View className="space-y-4 max-w-4xl mx-auto w-full">

          {/* 1. HERO OUTLET HEADER CARD */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
            <View className="flex-row items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <View className="flex-1 pr-2">
                <Text className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight" numberOfLines={1}>
                  {outletOverview.outletName}
                </Text>
                <TouchableOpacity
                  onPress={handleCopyUrl}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-1.5 pt-1"
                >
                  <Text className="text-xs font-mono text-slate-500 dark:text-slate-400" numberOfLines={1}>
                    {publicUrl}
                  </Text>
                  {copiedUrl ? (
                    <View className="flex-row items-center bg-emerald-50 px-1.5 py-0.5 rounded">
                      <Check size={10} color="#059669" />
                      <Text className="text-[10px] text-emerald-700 font-semibold ml-1">Tersalin</Text>
                    </View>
                  ) : (
                    <Copy size={11} color="#64748B" />
                  )}
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full shrink-0">
                <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                <Text className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Operasional Buka
                </Text>
              </View>
            </View>

            {/* Quick Status Chips (Flexbox responsive) */}
            <View className="flex-row flex-wrap justify-between gap-2 pt-3">
              <View className="flex-row items-center p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl" style={{ width: (width - 32 - 32 - 8) / 2 }}>
                <View className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 items-center justify-center mr-2">
                  <Smartphone size={13} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-[9px] font-mono text-slate-400 uppercase font-bold">POS KASIR</Text>
                  <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200" numberOfLines={1}>
                    {outletOverview.deviceCount} Terhubung
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl" style={{ width: (width - 32 - 32 - 8) / 2 }}>
                <View className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 items-center justify-center mr-2">
                  <Clock size={13} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text className="text-[9px] font-mono text-slate-400 uppercase font-bold">SHIFT</Text>
                  <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200" numberOfLines={1}>
                    {operationalPulse.shift.active ? 'Aktif' : 'Belum Buka'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl" style={{ width: (width - 32 - 32 - 8) / 2 }}>
                <View className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950 items-center justify-center mr-2">
                  <Receipt size={13} color="#9333EA" />
                </View>
                <View className="flex-1">
                  <Text className="text-[9px] font-mono text-slate-400 uppercase font-bold">TRANSAKSI</Text>
                  <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200" numberOfLines={1}>
                    {metrics.totalPesanan} Pesanan
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl" style={{ width: (width - 32 - 32 - 8) / 2 }}>
                <View className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950 items-center justify-center mr-2">
                  <Package size={13} color="#D97706" />
                </View>
                <View className="flex-1">
                  <Text className="text-[9px] font-mono text-slate-400 uppercase font-bold">STOK</Text>
                  <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200" numberOfLines={1}>
                    {operationalPulse.stock.low > 0 ? `${operationalPulse.stock.low} Menipis` : 'Aman'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 2. FILTER PERIODE & DATE PICKER */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs space-y-3">
            {/* Segmented Period Tabs */}
            <View className="flex-row bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <TouchableOpacity
                onPress={() => setActivePeriod('harian')}
                className={`flex-1 py-1.5 rounded-lg items-center justify-center transition-all ${
                  activePeriod === 'harian' ? 'bg-white dark:bg-slate-700 shadow-xs' : ''
                }`}
              >
                <Text
                  className={`text-xs ${
                    activePeriod === 'harian' ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400 font-medium'
                  }`}
                >
                  Harian
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActivePeriod('bulanan')}
                className={`flex-1 py-1.5 rounded-lg items-center justify-center transition-all ${
                  activePeriod === 'bulanan' ? 'bg-white dark:bg-slate-700 shadow-xs' : ''
                }`}
              >
                <Text
                  className={`text-xs ${
                    activePeriod === 'bulanan' ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400 font-medium'
                  }`}
                >
                  Bulanan
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActivePeriod('tahunan')}
                className={`flex-1 py-1.5 rounded-lg items-center justify-center transition-all ${
                  activePeriod === 'tahunan' ? 'bg-white dark:bg-slate-700 shadow-xs' : ''
                }`}
              >
                <Text
                  className={`text-xs ${
                    activePeriod === 'tahunan' ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400 font-medium'
                  }`}
                >
                  Tahunan
                </Text>
              </TouchableOpacity>
            </View>

            {/* Date Trigger & Period Info */}
            <View className="flex-row items-center justify-between pt-0.5">
              <View className="flex-1 pr-2">
                <Text className="text-[11px] text-slate-400">Rentang Periode:</Text>
                <Text className="text-xs font-bold text-slate-800 dark:text-slate-200" numberOfLines={1}>
                  {periodLabelText}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleOpenDateModal}
                activeOpacity={0.7}
                className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-2xs shrink-0"
              >
                <Calendar size={12} color="#475569" style={{ marginRight: 4 }} />
                <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200 mr-1">
                  {dateButtonLabel}
                </Text>
                <ChevronDown size={12} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. PRIMARY KPI CARDS (2x2 on Mobile, 4x1 on Tablet) */}
          <View className="flex-row flex-wrap justify-between gap-2.5">
            {/* Card 1: Omzet */}
            <View
              style={{ width: kpiCardWidth }}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs justify-between"
            >
              <View className="flex-row items-center justify-between pb-1.5">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  OMZET
                </Text>
                <View className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950 items-center justify-center">
                  <DollarSign size={13} color="#2563EB" />
                </View>
              </View>
              <Text className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight" numberOfLines={1}>
                {formatRupiah(metrics.totalOmzet)}
              </Text>
              <View className="flex-row items-center gap-1 pt-1.5">
                <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-950 px-1 py-0.5 rounded">
                  <TrendingUp size={9} color="#059669" />
                  <Text className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 ml-0.5">
                    {metrics.omzetGrowth}
                  </Text>
                </View>
                <Text className="text-[9px] text-slate-400 truncate flex-1">
                  {metrics.comparisonText}
                </Text>
              </View>
            </View>

            {/* Card 2: Pesanan */}
            <View
              style={{ width: kpiCardWidth }}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs justify-between"
            >
              <View className="flex-row items-center justify-between pb-1.5">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  PESANAN
                </Text>
                <View className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-950 items-center justify-center">
                  <ShoppingBag size={13} color="#9333EA" />
                </View>
              </View>
              <Text className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight" numberOfLines={1}>
                {metrics.totalPesanan}
              </Text>
              <View className="flex-row items-center gap-1 pt-1.5">
                <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-950 px-1 py-0.5 rounded">
                  <TrendingUp size={9} color="#059669" />
                  <Text className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 ml-0.5">
                    {metrics.pesananGrowth}
                  </Text>
                </View>
                <Text className="text-[9px] text-slate-400">transaksi</Text>
              </View>
            </View>

            {/* Card 3: Rata-Rata Pesanan (AOV) */}
            <View
              style={{ width: kpiCardWidth }}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs justify-between"
            >
              <View className="flex-row items-center justify-between pb-1.5">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  AOV / KERANJANG
                </Text>
                <View className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950 items-center justify-center">
                  <Receipt size={13} color="#059669" />
                </View>
              </View>
              <Text className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight" numberOfLines={1}>
                {formatRupiah(metrics.averageOrderValue)}
              </Text>
              <Text className="text-[9px] text-slate-400 pt-1.5">Rata-rata per pelanggan</Text>
            </View>

            {/* Card 4: Laba Bersih */}
            <View
              style={{ width: kpiCardWidth }}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs justify-between"
            >
              <View className="flex-row items-center justify-between pb-1.5">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  EST. LABA BERSIH
                </Text>
                <View className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950 items-center justify-center">
                  <Percent size={13} color="#D97706" />
                </View>
              </View>
              <Text className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight" numberOfLines={1}>
                {formatRupiah(metrics.totalLaba)}
              </Text>
              <Text className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 pt-1.5">
                Margin {metrics.labaMargin}
              </Text>
            </View>
          </View>

          {/* 4. GRAFIK TREN PENJUALAN INTERAKTIF */}
          <View
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3"
            style={{ overflow: 'hidden' }}
          >
            {/* Header & Toggle */}
            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Tren Penjualan
                </Text>
                <Text className="text-[11px] text-slate-400" numberOfLines={1}>
                  {periodLabelText}
                </Text>
              </View>

              {/* Metric Toggle */}
              <View className="flex-row bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                <TouchableOpacity
                  onPress={() => setActiveMetric('omzet')}
                  className={`px-2 py-1 rounded-md ${activeMetric === 'omzet' ? 'bg-white dark:bg-slate-700 shadow-2xs' : ''}`}
                >
                  <Text className={`text-[10px] ${activeMetric === 'omzet' ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 font-medium'}`}>
                    Omzet
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveMetric('pesanan')}
                  className={`px-2 py-1 rounded-md ${activeMetric === 'pesanan' ? 'bg-white dark:bg-slate-700 shadow-2xs' : ''}`}
                >
                  <Text className={`text-[10px] ${activeMetric === 'pesanan' ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 font-medium'}`}>
                    Pesanan
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveMetric('laba')}
                  className={`px-2 py-1 rounded-md ${activeMetric === 'laba' ? 'bg-white dark:bg-slate-700 shadow-2xs' : ''}`}
                >
                  <Text className={`text-[10px] ${activeMetric === 'laba' ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 font-medium'}`}>
                    Laba
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Selected Tooltip info bar */}
            <View className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {activePoint?.label || 'Total'}
              </Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {formatRupiah(activePoint?.omzet || 0)}
                </Text>
                <Text className="text-[11px] text-slate-400">
                  {activePoint?.pesanan || 0} order
                </Text>
              </View>
            </View>

            {/* SVG Chart Area */}
            <View
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0 && Math.abs(w - cardInnerWidth) > 1) {
                  setCardInnerWidth(w);
                }
              }}
              style={{
                height: chartHeight,
                width: '100%',
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {svgPathData.linePath && effectiveChartWidth > 0 ? (
                <Svg height={chartHeight} width={effectiveChartWidth}>
                  <Defs>
                    <LinearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                      <Stop offset="95%" stopColor="#2563EB" stopOpacity="0.0" />
                    </LinearGradient>
                  </Defs>

                  <Path d={svgPathData.areaPath} fill="url(#blueGradient)" />

                  <Path
                    d={svgPathData.linePath}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />

                  {svgPathData.coords.map((item) => {
                    const isSelected = item.idx === activePointIndex;
                    const showAllDots = chartPoints.length <= 7;

                    if (!isSelected && !showAllDots) return null;

                    return (
                      <React.Fragment key={item.idx}>
                        {isSelected && (
                          <Line
                            x1={item.x}
                            y1={chartPaddingTop}
                            x2={item.x}
                            y2={chartHeight - chartPaddingBottom}
                            stroke="#93C5FD"
                            strokeDasharray="3 3"
                            strokeWidth={1}
                          />
                        )}
                        <Circle
                          cx={item.x}
                          cy={item.y}
                          r={isSelected ? 5 : 3}
                          fill={isSelected ? '#2563EB' : '#FFFFFF'}
                          stroke="#2563EB"
                          strokeWidth={isSelected ? 2.5 : 1.5}
                        />
                      </React.Fragment>
                    );
                  })}
                </Svg>
              ) : null}

              {/* Touch Scrubbing Layer */}
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: chartPaddingBottom,
                  flexDirection: 'row',
                }}
              >
                {svgPathData.coords.map((item) => (
                  <TouchableOpacity
                    key={item.idx}
                    style={{ flex: 1, height: '100%' }}
                    onPress={() => setActivePointIndex(item.idx)}
                    activeOpacity={1}
                  />
                ))}
              </View>

              {/* X-Axis Labels */}
              <View
                style={{
                  position: 'absolute',
                  bottom: 2,
                  left: 0,
                  right: 0,
                  height: 18,
                }}
              >
                {svgPathData.coords.map((item) => {
                  if (!visibleLabelIndices.has(item.idx)) return null;
                  const isSelected = item.idx === activePointIndex;
                  return (
                    <View
                      key={item.idx}
                      style={{
                        position: 'absolute',
                        left: Math.max(0, Math.min(item.x - 40, effectiveChartWidth - 80)),
                        width: 80,
                        alignItems: 'center',
                      }}
                    >
                      <TouchableOpacity onPress={() => setActivePointIndex(item.idx)}>
                        <Text
                          numberOfLines={1}
                          className={`text-[9px] ${
                            isSelected ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-400 font-medium'
                          }`}
                        >
                          {item.pt.label}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* 5. MENU TERLARIS */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="p-1.5 bg-amber-50 dark:bg-amber-950 rounded-lg">
                  <Utensils size={14} color="#D97706" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">Menu Terlaris</Text>
                  <Text className="text-[11px] text-slate-400">Produk favorit periode ini</Text>
                </View>
              </View>
              <View className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-semibold text-amber-800 dark:text-amber-300">Top 5</Text>
              </View>
            </View>

            <View className="space-y-3 pt-1">
              {topProducts.map((item, idx) => {
                const isTop1 = idx === 0;
                return (
                  <View key={item.id || idx} className="space-y-1.5">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2 flex-1 pr-2">
                        <View
                          className={`w-4 h-4 rounded-full items-center justify-center ${
                            isTop1 ? 'bg-amber-100' : 'bg-slate-100 dark:bg-slate-800'
                          }`}
                        >
                          {isTop1 ? (
                            <Star size={9} color="#B45309" fill="#B45309" />
                          ) : (
                            <Text className="text-[9px] font-bold text-slate-600 dark:text-slate-400">{idx + 1}</Text>
                          )}
                        </View>
                        <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate flex-1">
                          {item.name}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {formatRupiah(item.totalRevenue)}
                        </Text>
                        <Text className="text-[10px] text-slate-400">
                          ({item.totalSold}x)
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <View
                        className={`h-full rounded-full ${isTop1 ? 'bg-amber-500' : 'bg-blue-600'}`}
                        style={{ width: `${Math.max(5, Math.min(100, item.sharePercentage))}%` }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 6. RINGKASAN BISNIS & INSIGHTS */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <View className="flex-row items-center gap-2">
              <View className="p-1.5 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Sparkles size={14} color="#2563EB" />
              </View>
              <View>
                <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">Ringkasan Bisnis</Text>
                <Text className="text-[11px] text-slate-400">Wawasan analitik performa toko</Text>
              </View>
            </View>

            <View className="space-y-2 pt-1">
              {insights.map((item, idx) => (
                <View
                  key={item.id || idx}
                  className="flex-row items-start p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50"
                >
                  <View className="p-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-700 mr-2 mt-0.5">
                    {item.type === 'trend' ? (
                      <TrendingUp size={11} color="#2563EB" />
                    ) : item.type === 'champion' ? (
                      <Star size={11} color="#D97706" />
                    ) : item.type === 'basket' ? (
                      <ShoppingBag size={11} color="#9333EA" />
                    ) : (
                      <Calendar size={11} color="#059669" />
                    )}
                  </View>
                  <Text className="text-xs text-slate-700 dark:text-slate-300 leading-snug flex-1">
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 7. PERFORMA OPERASIONAL (FLEXBOX RESPONSIVE) */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <View className="flex-row items-center gap-2">
              <View className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Activity size={14} color="#475569" />
              </View>
              <View>
                <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">Performa Operasional</Text>
                <Text className="text-[11px] text-slate-400">Kasir, perangkat POS, dan ketersediaan stok</Text>
              </View>
            </View>

            <View className="flex-row flex-wrap justify-between gap-2.5 pt-1">
              {/* Shift Kasir */}
              <View style={{ width: opCardWidth }} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[9px] font-mono uppercase font-bold text-slate-400">SHIFT KASIR</Text>
                  <Clock size={11} color="#64748B" />
                </View>
                <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {operationalPulse.shift.cashierName}
                </Text>
                <Text className="text-[10px] text-slate-500">
                  Buka: {operationalPulse.shift.startedAt} • Modal: {formatRupiah(operationalPulse.shift.startingCash)}
                </Text>
              </View>

              {/* Perangkat POS */}
              <View style={{ width: opCardWidth }} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[9px] font-mono uppercase font-bold text-slate-400">PERANGKAT POS</Text>
                  <Smartphone size={11} color="#64748B" />
                </View>
                <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {operationalPulse.devices.active} / {operationalPulse.devices.total} Online
                </Text>
                <Text className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  Semua perangkat tersinkronisasi
                </Text>
              </View>

              {/* Kesehatan Stok */}
              <View style={{ width: opCardWidth }} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[9px] font-mono uppercase font-bold text-slate-400">STATUS STOK</Text>
                  <Package size={11} color="#64748B" />
                </View>
                <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {operationalPulse.stock.total} Produk Aktif
                </Text>
                <Text className="text-[10px] text-slate-500">
                  {operationalPulse.stock.safe} aman •{' '}
                  <Text className={operationalPulse.stock.low > 0 ? 'text-amber-600 font-semibold' : ''}>
                    {operationalPulse.stock.low} menipis
                  </Text>
                </Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* DATE PICKER MODAL */}
      <Modal
        visible={isDateModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDateModalOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setIsDateModalOpen(false)}
        >
          <Pressable
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: Math.max(insets.bottom, 20),
              maxHeight: '90%',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <View>
                <Text className="text-base font-bold text-slate-900">
                  Pilih Rentang Tanggal
                </Text>
                <Text className="text-xs text-slate-500">
                  Pilih tanggal untuk melihat laporan performa
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsDateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
              >
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <View className="pt-3 pb-2">
              <View className="flex-row flex-wrap gap-2">
                <TouchableOpacity
                  onPress={() => {
                    const todayStr = '2026-09-12';
                    setTempRangeStart(todayStr);
                    setTempRangeEnd(todayStr);
                    setCalYear(2026);
                    setCalMonth(8);
                  }}
                  className={`px-3 py-1.5 rounded-lg border ${
                    tempRangeStart === '2026-09-12' && tempRangeEnd === '2026-09-12'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Text className={`text-xs font-semibold ${tempRangeStart === '2026-09-12' && tempRangeEnd === '2026-09-12' ? 'text-blue-700' : 'text-slate-700'}`}>
                    Hari Ini
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const yestStr = '2026-09-11';
                    setTempRangeStart(yestStr);
                    setTempRangeEnd(yestStr);
                    setCalYear(2026);
                    setCalMonth(8);
                  }}
                  className={`px-3 py-1.5 rounded-lg border ${
                    tempRangeStart === '2026-09-11' && tempRangeEnd === '2026-09-11'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Text className={`text-xs font-semibold ${tempRangeStart === '2026-09-11' && tempRangeEnd === '2026-09-11' ? 'text-blue-700' : 'text-slate-700'}`}>
                    Kemarin
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setTempRangeStart('2026-09-06');
                    setTempRangeEnd('2026-09-12');
                    setCalYear(2026);
                    setCalMonth(8);
                  }}
                  className={`px-3 py-1.5 rounded-lg border ${
                    tempRangeStart === '2026-09-06' && tempRangeEnd === '2026-09-12'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Text className={`text-xs font-semibold ${tempRangeStart === '2026-09-06' && tempRangeEnd === '2026-09-12' ? 'text-blue-700' : 'text-slate-700'}`}>
                    7 Hari Terakhir
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setTempRangeStart('2026-08-14');
                    setTempRangeEnd('2026-09-12');
                    setCalYear(2026);
                    setCalMonth(8);
                  }}
                  className={`px-3 py-1.5 rounded-lg border ${
                    tempRangeStart === '2026-08-14' && tempRangeEnd === '2026-09-12'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Text className={`text-xs font-semibold ${tempRangeStart === '2026-08-14' && tempRangeEnd === '2026-09-12' ? 'text-blue-700' : 'text-slate-700'}`}>
                    30 Hari Terakhir
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Calendar Controls */}
            <View className="py-2">
              <View className="flex-row items-center justify-between pb-3">
                <TouchableOpacity
                  onPress={() => {
                    if (calMonth === 0) {
                      setCalMonth(11);
                      setCalYear((y) => y - 1);
                    } else {
                      setCalMonth((m) => m - 1);
                    }
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-100 items-center justify-center"
                >
                  <ChevronLeft size={16} color="#334155" />
                </TouchableOpacity>

                <Text className="text-sm font-bold text-slate-900">
                  {monthNames[calMonth]} {calYear}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    if (calMonth === 11) {
                      setCalMonth(0);
                      setCalYear((y) => y + 1);
                    } else {
                      setCalMonth((m) => m + 1);
                    }
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-100 items-center justify-center"
                >
                  <ChevronRight size={16} color="#334155" />
                </TouchableOpacity>
              </View>

              {/* Day Headers */}
              <View className="flex-row justify-between pb-2 border-b border-slate-100">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
                  <Text
                    key={i}
                    style={{ width: '14.28%', textAlign: 'center' }}
                    className="text-[11px] font-bold text-slate-400"
                  >
                    {d}
                  </Text>
                ))}
              </View>

              {/* Day Cells */}
              <View className="flex-row flex-wrap pt-1">
                {calendarDays.map((item, idx) => {
                  if (!item.dayNumber || !item.dateStr) {
                    return (
                      <View
                        key={`empty-${idx}`}
                        style={{ width: '14.28%', height: 36 }}
                      />
                    );
                  }

                  const isStart = tempRangeStart === item.dateStr;
                  const isEnd = tempRangeEnd === item.dateStr;
                  const isSelectedEndpoint = isStart || isEnd;
                  const isInRange = Boolean(
                    tempRangeStart &&
                    tempRangeEnd &&
                    item.dateStr > tempRangeStart &&
                    item.dateStr < tempRangeEnd
                  );

                  return (
                    <TouchableOpacity
                      key={item.dateStr}
                      onPress={() => handleCalendarDayPress(item.dateStr!)}
                      style={{
                        width: '14.28%',
                        height: 36,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isInRange ? '#EFF6FF' : 'transparent',
                        borderTopLeftRadius: isStart ? 18 : 0,
                        borderBottomLeftRadius: isStart ? 18 : 0,
                        borderTopRightRadius: isEnd ? 18 : 0,
                        borderBottomRightRadius: isEnd ? 18 : 0,
                      }}
                    >
                      <View
                        className={`w-7 h-7 rounded-full items-center justify-center ${
                          isSelectedEndpoint ? 'bg-blue-600 shadow-xs' : ''
                        }`}
                      >
                        <Text
                          className={`text-xs ${
                            isSelectedEndpoint
                              ? 'font-bold text-white'
                              : isInRange
                              ? 'font-semibold text-blue-700'
                              : 'text-slate-800'
                          }`}
                        >
                          {item.dayNumber}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row items-center gap-2.5 pt-3 border-t border-slate-100">
              <TouchableOpacity
                onPress={() => setIsDateModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 items-center"
              >
                <Text className="text-xs font-semibold text-slate-700">Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleApplyCalendarRange}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 items-center shadow-xs"
              >
                <Text className="text-xs font-semibold text-white">Terapkan</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
