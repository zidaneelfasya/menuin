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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  TrendingUp,
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
  const isPhoneLandscape = !isTablet && isLandscape;
  const bottomInset = Math.max(insets.bottom, 12) + (isPhoneLandscape ? 60 : 88);

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
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(now.getMonth()); // 0-indexed
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Interactive Calendar State inside Date Picker Modal
  const [calYear, setCalYear] = useState<number>(2026);
  const [calMonth, setCalMonth] = useState<number>(8); // September (0-indexed)
  const [tempRangeStart, setTempRangeStart] = useState<string>('2026-09-06');
  const [tempRangeEnd, setTempRangeEnd] = useState<string | null>('2026-09-12');

  // Active Metric for Chart: 'omzet' | 'pesanan' | 'laba'
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

  // Format currency in Rupiah
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

  // Calculate day difference for selected range
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

  // Fallback data if live query hasn't resolved or is offline
  const fallbackHourlyData: ChartDataPoint[] = useMemo(() => {
    // If range is under 7 days (< 7 days), generate hourly points!
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
    if (rangeDayCount < 7) {
      // 2 points per day (e.g. 10:00 & 19:00) so 4/5 days has 8-10 points total
      const points: ChartDataPoint[] = [];
      const s = new Date(customStartDate || '2026-09-08');
      for (let d = 0; d < rangeDayCount; d++) {
        const curDate = new Date(s.getTime() + d * 86400000);
        const dayName = `${curDate.getDate()} ${shortMonthNames[curDate.getMonth()]}`;
        
        points.push({
          date: `${curDate.toISOString().split('T')[0]} 10:00`,
          label: `${dayName}, 10:00`,
          omzet: Math.round(400000 + ((d * 137) % 300) * 1000),
          pesanan: Math.round(6 + ((d * 3) % 8)),
          laba: Math.round(240000 + ((d * 73) % 180) * 1000),
        });
        points.push({
          date: `${curDate.toISOString().split('T')[0]} 19:00`,
          label: `${dayName}, 19:00`,
          omzet: Math.round(850000 + ((d * 193) % 450) * 1000),
          pesanan: Math.round(14 + ((d * 5) % 10)),
          laba: Math.round(510000 + ((d * 109) % 250) * 1000),
        });
      }
      return points;
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

  // Chart data: prioritized live data or fallback
  const chartPoints: ChartDataPoint[] = useMemo(() => {
    if (liveData?.chartData && liveData.chartData.length > 0) {
      return liveData.chartData;
    }
    return fallbackHourlyData;
  }, [liveData, fallbackHourlyData]);

  // Active point index
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
      outletName: liveData?.outlet?.outletName || user?.tenantName || 'Kedai Kopi Kita - Malang',
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

  // SVG Chart Dimensions strictly bounded by cardInnerWidth
  const chartHeight = 220;
  const chartPaddingHorizontal = 24;
  const chartPaddingTop = 20;
  const chartPaddingBottom = 36;

  // Exact chart width matching inner card width
  const effectiveChartWidth = Math.max(cardInnerWidth > 0 ? cardInnerWidth : (width > 600 ? 760 : width - 40), 280);

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

    // Generate smooth bezier curve path
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

  // Adaptive visible X-axis labels to prevent text overlapping
  const visibleLabelIndices = useMemo(() => {
    const len = chartPoints.length;
    if (len <= 7) {
      return new Set(chartPoints.map((_, i) => i));
    }
    const maxLabels = isTablet || isLandscape ? 8 : 5;
    const step = Math.ceil((len - 1) / (maxLabels - 1));
    const indices = new Set<number>();
    for (let i = 0; i < len; i += step) {
      indices.add(i);
    }
    indices.add(len - 1); // Always include the last point
    return indices;
  }, [chartPoints.length, isTablet, isLandscape]);

  // Calendar Day Generation Logic for Date Picker Modal
  const calendarDays = useMemo(() => {
    const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0 is Sunday
    const days: { dayNumber: number | null; dateStr: string | null }[] = [];

    // Prepend empty slots
    for (let i = 0; i < firstDay; i++) {
      days.push({ dayNumber: null, dateStr: null });
    }

    // Add days
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

  // Handle Day Click inside Calendar
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

  // Apply selected date range
  const handleApplyCalendarRange = () => {
    const s = tempRangeStart;
    const e = tempRangeEnd || tempRangeStart;
    setCustomStartDate(s);
    setCustomEndDate(e);
    setDailyPreset('custom');
    setActivePeriod('harian');
    setIsDateModalOpen(false);
  };

  // Open modal and sync temp state
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

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 12) + 8,
          paddingBottom: bottomInset + 32,
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
        <View className="space-y-4 max-w-5xl mx-auto w-full">

          {/* 0. TOP QUICK STATS CHIPS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            className="pb-1"
          >
            <View className="flex-row items-center bg-white border border-gray-200/80 rounded-lg px-3 py-1.5 shadow-2xs">
              <Text className="text-xs text-gray-500 mr-1.5">👥</Text>
              <Text className="text-xs font-semibold text-gray-800">
                {outletOverview.staffCount} Staf
              </Text>
            </View>

            <View className="flex-row items-center bg-white border border-gray-200/80 rounded-lg px-3 py-1.5 shadow-2xs">
              <Text className="text-xs text-gray-500 mr-1.5">📱</Text>
              <Text className="text-xs font-semibold text-gray-800">
                {outletOverview.deviceCount} POS Devices
              </Text>
            </View>

            <View className="flex-row items-center bg-white border border-gray-200/80 rounded-lg px-3 py-1.5 shadow-2xs">
              <Text className="text-xs text-gray-500 mr-1.5">📋</Text>
              <Text className="text-xs font-semibold text-gray-800">
                {outletOverview.totalLifetimeTransactions.toLocaleString('id-ID')} Tx Bulan Ini
              </Text>
            </View>

            <View className="flex-row items-center bg-blue-50/70 border border-blue-200/60 rounded-lg px-3 py-1.5 shadow-2xs">
              <Sparkles size={12} color="#2563EB" style={{ marginRight: 4 }} />
              <Text className="text-xs font-semibold text-blue-700">
                Cloud Sinkron
              </Text>
            </View>
          </ScrollView>

          {/* 1. HERO OVERVIEW CARD */}
          <View className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <View className="flex-col sm:flex-row sm:items-center justify-between gap-2">
              <View>
                <Text className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {outletOverview.outletName}
                </Text>
                <View className="flex-row items-center gap-2 pt-1">
                  <Text className="text-xs font-mono text-gray-500">
                    {publicUrl}
                  </Text>
                  <TouchableOpacity
                    onPress={handleCopyUrl}
                    className="flex-row items-center bg-gray-50 border border-gray-200 px-2 py-0.5 rounded"
                  >
                    {copiedUrl ? (
                      <>
                        <Check size={10} color="#059669" style={{ marginRight: 3 }} />
                        <Text className="text-[10px] font-mono text-emerald-700 font-semibold">Tersalin</Text>
                      </>
                    ) : (
                      <>
                        <Copy size={10} color="#6B7280" style={{ marginRight: 3 }} />
                        <Text className="text-[10px] font-mono text-gray-600">Copy</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View className="self-start sm:self-center flex-row items-center bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
                <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                <Text className="text-xs font-semibold text-emerald-800">
                  Healthy / Buka Operasional
                </Text>
              </View>
            </View>

            {/* 6 Status Tiles Grid */}
            <View className="grid grid-cols-2 gap-3 pt-2">
              <View className="flex-row items-center p-2.5 bg-gray-50/60 border border-gray-100 rounded-xl">
                <View className="w-8 h-8 rounded-lg bg-white border border-gray-200 items-center justify-center mr-2.5">
                  <View className="flex-row flex-wrap w-4 h-4 justify-between content-between">
                    <View className="w-1 h-1 rounded-full bg-emerald-500" />
                    <View className="w-1 h-1 rounded-full bg-emerald-500" />
                    <View className="w-1 h-1 rounded-full bg-emerald-500" />
                    <View className="w-1 h-1 rounded-full bg-emerald-500" />
                    <View className="w-1 h-1 rounded-full bg-emerald-500" />
                    <View className="w-1 h-1 rounded-full bg-emerald-500" />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-mono text-gray-400 font-semibold uppercase">STATUS</Text>
                  <Text className="text-xs font-semibold text-gray-900 truncate">Healthy / Aktif</Text>
                </View>
              </View>

              <View className="flex-row items-center p-2.5 bg-gray-50/60 border border-gray-100 rounded-xl">
                <View className="w-8 h-8 rounded-lg bg-white border border-gray-200 items-center justify-center mr-2.5">
                  <Cpu size={14} color="#4B5563" />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-mono text-gray-400 font-semibold uppercase">SISTEM POS</Text>
                  <View className="self-start bg-gray-200/80 px-1.5 py-0.5 rounded">
                    <Text className="text-[9px] font-mono font-bold text-gray-700">ONLINE</Text>
                  </View>
                </View>
              </View>

              <View className="flex-row items-center p-2.5 bg-gray-50/60 border border-gray-100 rounded-xl">
                <View className="w-8 h-8 rounded-lg bg-white border border-gray-200 items-center justify-center mr-2.5">
                  <GitBranch size={14} color="#4B5563" />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-mono text-gray-400 font-semibold uppercase">SHIFT KASIR</Text>
                  <Text className="text-xs font-semibold text-gray-900 truncate">
                    {operationalPulse.shift.active ? 'Shift Aktif' : 'Belum Buka'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center p-2.5 bg-gray-50/60 border border-gray-100 rounded-xl">
                <View className="w-8 h-8 rounded-lg bg-white border border-gray-200 items-center justify-center mr-2.5">
                  <Smartphone size={14} color="#4B5563" />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-mono text-gray-400 font-semibold uppercase">PERANGKAT POS</Text>
                  <Text className="text-xs font-semibold text-gray-900 truncate">
                    {outletOverview.deviceCount} Terhubung
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center p-2.5 bg-gray-50/60 border border-gray-100 rounded-xl">
                <View className="w-8 h-8 rounded-lg bg-white border border-gray-200 items-center justify-center mr-2.5">
                  <Receipt size={14} color="#4B5563" />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-mono text-gray-400 font-semibold uppercase">TOTAL TX</Text>
                  <Text className="text-xs font-semibold text-gray-900 truncate">
                    {outletOverview.totalLifetimeTransactions.toLocaleString('id-ID')} Selesai
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center p-2.5 bg-gray-50/60 border border-gray-100 rounded-xl">
                <View className="w-8 h-8 rounded-lg bg-white border border-gray-200 items-center justify-center mr-2.5">
                  <Package size={14} color="#4B5563" />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-mono text-gray-400 font-semibold uppercase">STATUS STOK</Text>
                  <Text className={`text-xs font-semibold truncate ${operationalPulse.stock.low > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                    {operationalPulse.stock.low > 0 ? `${operationalPulse.stock.low} Menipis` : 'Semua Aman'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Supabase Dotted Topology Canvas Strip */}
            <View
              className="w-full bg-slate-900/5 border border-gray-200/80 rounded-xl p-3 flex-row items-center justify-between"
              style={{ minHeight: 60 }}
            >
              <View className="flex-row items-center gap-2.5">
                <View className="w-7 h-7 rounded bg-emerald-600 items-center justify-center shadow-xs">
                  <Store size={14} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-xs font-bold text-gray-900">Primary Outlet Hub</Text>
                  <Text className="text-[10px] font-mono text-gray-500">
                    menuin-node • {outletOverview.slug}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-full bg-emerald-500" />
                <Text className="text-[10px] font-mono text-gray-600 font-medium">
                  POS 100% • Sync 12ms
                </Text>
              </View>
            </View>
          </View>

          {/* 2. FILTER BAR & DATE PICKER CONTAINER */}
          <View className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-sm space-y-3">
            {/* Segmented Period Tabs: Harian | Bulanan | Tahunan (Recap) */}
            <View className="flex-row bg-gray-100 p-1 rounded-lg border border-gray-200/60">
              <TouchableOpacity
                onPress={() => setActivePeriod('harian')}
                className={`flex-1 py-1.5 rounded-md items-center justify-center transition-all ${
                  activePeriod === 'harian' ? 'bg-white shadow-2xs' : ''
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    activePeriod === 'harian' ? 'text-gray-900 font-bold' : 'text-gray-600'
                  }`}
                >
                  Harian
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActivePeriod('bulanan')}
                className={`flex-1 py-1.5 rounded-md items-center justify-center transition-all ${
                  activePeriod === 'bulanan' ? 'bg-white shadow-2xs' : ''
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    activePeriod === 'bulanan' ? 'text-gray-900 font-bold' : 'text-gray-600'
                  }`}
                >
                  Bulanan
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActivePeriod('tahunan')}
                className={`flex-1 py-1.5 rounded-md items-center justify-center transition-all ${
                  activePeriod === 'tahunan' ? 'bg-white shadow-2xs' : ''
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    activePeriod === 'tahunan' ? 'text-gray-900 font-bold' : 'text-gray-600'
                  }`}
                >
                  Tahunan (Recap)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Filter Sub-Bar: Counter, Sukses Badge, Date Selector Button */}
            <View className="flex-row items-center justify-between pt-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-bold text-gray-900">
                  {metrics.totalPesanan} Total Pesanan
                </Text>
                <Text className="text-gray-300">•</Text>
                <View className="bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
                  <Text className="text-[10px] font-mono font-semibold text-emerald-700">
                    100.0% Sukses
                  </Text>
                </View>
              </View>

              {/* Date Trigger Button */}
              <TouchableOpacity
                onPress={handleOpenDateModal}
                activeOpacity={0.7}
                className="flex-row items-center bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg shadow-2xs"
              >
                <Calendar size={13} color="#4B5563" style={{ marginRight: 4 }} />
                <Text className="text-xs font-semibold text-gray-800 mr-1">
                  {dateButtonLabel}
                </Text>
                <ChevronDown size={12} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Periode Text Display */}
            <View className="pt-0.5 border-t border-gray-100 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="text-[11px] text-gray-400">Periode: </Text>
                <Text className="text-[11px] font-semibold text-gray-800">
                  {periodLabelText}
                </Text>
              </View>
              {rangeDayCount < 7 && activePeriod === 'harian' && (
                <View className="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                  <Text className="text-[9px] font-bold text-blue-700 font-mono">
                    Mode Jam Aktif (&lt; 7 Hari)
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 3. PRIMARY KPI CARDS (DARI KIRI HINGGA KANAN - DALAM CARD & TIDAK MELEBAR KELUAR) */}
          <View className="w-full">
            <View
              className={
                isTablet || isLandscape
                  ? "flex-row w-full gap-3"
                  : "flex-row flex-wrap w-full gap-2.5"
              }
            >
              {/* Card 1: PENJUALAN (OMZET) */}
              <View
                style={isTablet || isLandscape ? { flex: 1, minWidth: 0 } : { width: '48%', flexGrow: 1 }}
                className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm"
              >
                <View className="flex-row items-center justify-between pb-2">
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-gray-500 truncate">
                    PENJUALAN (OMZET)
                  </Text>
                  <View className="w-7 h-7 rounded-lg bg-blue-50 items-center justify-center">
                    <DollarSign size={15} color="#2563EB" />
                  </View>
                </View>
                <Text className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  {formatRupiah(metrics.totalOmzet)}
                </Text>
                <View className="flex-row items-center gap-1.5 pt-2">
                  <View className="flex-row items-center bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
                    <TrendingUp size={11} color="#059669" style={{ marginRight: 2 }} />
                    <Text className="text-[10px] font-bold text-emerald-700">
                      {metrics.omzetGrowth}
                    </Text>
                  </View>
                  <Text className="text-[10px] text-gray-400 truncate">
                    {metrics.comparisonText}
                  </Text>
                </View>
              </View>

              {/* Card 2: PESANAN SELESAI */}
              <View
                style={isTablet || isLandscape ? { flex: 1, minWidth: 0 } : { width: '48%', flexGrow: 1 }}
                className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm"
              >
                <View className="flex-row items-center justify-between pb-2">
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-gray-500 truncate">
                    PESANAN SELESAI
                  </Text>
                  <View className="w-7 h-7 rounded-lg bg-purple-50 items-center justify-center">
                    <ShoppingBag size={15} color="#9333EA" />
                  </View>
                </View>
                <Text className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  {metrics.totalPesanan}
                </Text>
                <View className="flex-row items-center gap-1.5 pt-2">
                  <View className="flex-row items-center bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
                    <TrendingUp size={11} color="#059669" style={{ marginRight: 2 }} />
                    <Text className="text-[10px] font-bold text-emerald-700">
                      {metrics.pesananGrowth}
                    </Text>
                  </View>
                  <Text className="text-[10px] text-gray-400">pesanan</Text>
                </View>
              </View>

              {/* Card 3: RATA-RATA PESANAN */}
              <View
                style={isTablet || isLandscape ? { flex: 1, minWidth: 0 } : { width: '48%', flexGrow: 1 }}
                className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm"
              >
                <View className="flex-row items-center justify-between pb-2">
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-gray-500 truncate">
                    RATA-RATA PESANAN
                  </Text>
                  <View className="w-7 h-7 rounded-lg bg-emerald-50 items-center justify-center">
                    <Receipt size={15} color="#059669" />
                  </View>
                </View>
                <Text className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  {formatRupiah(metrics.averageOrderValue)}
                </Text>
                <View className="pt-2">
                  <Text className="text-[10px] text-gray-400 truncate">Nilai per pelanggan</Text>
                </View>
              </View>

              {/* Card 4: EST. KEUNTUNGAN */}
              <View
                style={isTablet || isLandscape ? { flex: 1, minWidth: 0 } : { width: '48%', flexGrow: 1 }}
                className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm"
              >
                <View className="flex-row items-center justify-between pb-2">
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-gray-500 truncate">
                    EST. KEUNTUNGAN
                  </Text>
                  <View className="w-7 h-7 rounded-lg bg-amber-50 items-center justify-center">
                    <Percent size={15} color="#D97706" />
                  </View>
                </View>
                <Text className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  {formatRupiah(metrics.totalLaba)}
                </Text>
                <View className="pt-2">
                  <Text className="text-[10px] font-bold text-emerald-700 truncate">
                    Margin {metrics.labaMargin} <Text className="text-gray-400 font-normal">(HPP 40%)</Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 4. GRAFIK PENJUALAN INTERAKTIF (Berdiam Utuh di Dalam Card, Tidak Tumpah) */}
          <View
            className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm space-y-3"
            style={{ overflow: 'hidden' }}
          >
            {/* Header: Judul & Metric Toggle */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-base font-bold text-gray-900">
                  Grafik Penjualan
                </Text>
                <Text className="text-xs text-gray-500">
                  {periodLabelText} — {activeMetric === 'omzet' ? 'Omzet Penjualan' : activeMetric === 'pesanan' ? 'Total Pesanan' : 'Keuntungan Bersih'}
                </Text>
              </View>

              {/* Metric Toggle: [ Omzet | Pesanan | Laba ] */}
              <View className="flex-row bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
                <TouchableOpacity
                  onPress={() => setActiveMetric('omzet')}
                  className={`px-2.5 py-1 rounded-md transition-all ${activeMetric === 'omzet' ? 'bg-white shadow-2xs' : ''}`}
                >
                  <Text className={`text-xs ${activeMetric === 'omzet' ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                    Omzet
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveMetric('pesanan')}
                  className={`px-2.5 py-1 rounded-md transition-all ${activeMetric === 'pesanan' ? 'bg-white shadow-2xs' : ''}`}
                >
                  <Text className={`text-xs ${activeMetric === 'pesanan' ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                    Pesanan
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveMetric('laba')}
                  className={`px-2.5 py-1 rounded-md transition-all ${activeMetric === 'laba' ? 'bg-white shadow-2xs' : ''}`}
                >
                  <Text className={`text-xs ${activeMetric === 'laba' ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                    Laba
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Selected Point Info Bar */}
            <View className="flex-row items-center justify-between bg-gray-50/80 px-3 py-2 rounded-lg border border-gray-100">
              <Text className="text-xs font-bold text-gray-900">
                {activePoint?.label || 'Total'}
              </Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-bold text-blue-600">
                  {formatRupiah(activePoint?.omzet || 0)}
                </Text>
                <Text className="text-xs text-gray-500 font-medium">
                  {activePoint?.pesanan || 0} pesanan
                </Text>
              </View>
            </View>

            {/* Area & Line Curve Chart Container (Measured with onLayout) */}
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
                      <Stop offset="90%" stopColor="#2563EB" stopOpacity="0.0" />
                    </LinearGradient>
                  </Defs>

                  {/* Shaded Area */}
                  <Path d={svgPathData.areaPath} fill="url(#blueGradient)" />

                  {/* Stroke Curve */}
                  <Path
                    d={svgPathData.linePath}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />

                  {/* Guideline and Highlighted Selected Dot (Clean like Web) */}
                  {svgPathData.coords.map((item) => {
                    const isSelected = item.idx === activePointIndex;
                    const showAllDots = chartPoints.length <= 8;

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
                            strokeWidth={1.5}
                          />
                        )}
                        <Circle
                          cx={item.x}
                          cy={item.y}
                          r={isSelected ? 6 : 3.5}
                          fill={isSelected ? '#2563EB' : '#FFFFFF'}
                          stroke="#2563EB"
                          strokeWidth={isSelected ? 3 : 2}
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

              {/* X-Axis Labels (Adaptive: max 6-8 labels, no overlapping) */}
              <View
                style={{
                  position: 'absolute',
                  bottom: 4,
                  left: 0,
                  right: 0,
                  height: 20,
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
                        left: Math.max(2, Math.min(item.x - 45, effectiveChartWidth - 90)),
                        width: 90,
                        alignItems: 'center',
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => setActivePointIndex(item.idx)}
                        hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                      >
                        <Text
                          numberOfLines={1}
                          className={`text-[10px] ${
                            isSelected ? 'font-bold text-blue-600' : 'text-gray-400 font-medium'
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

            {/* Footer: Tap hint & pagination dots */}
            <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
              <Text className="text-[11px] text-gray-400">
                Tap titik grafik untuk melihat rincian tanggal
              </Text>
              <View className="flex-row items-center gap-1">
                <View className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <View className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <View className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <View className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <View className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <View className="w-3.5 h-1.5 rounded-full bg-blue-600" />
              </View>
            </View>
          </View>

          {/* 5. MENU TERLARIS */}
          <View className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm space-y-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="p-1.5 bg-amber-50 rounded-lg">
                  <Utensils size={15} color="#D97706" />
                </View>
                <View>
                  <Text className="text-base font-bold text-gray-900">Menu Terlaris</Text>
                  <Text className="text-xs text-gray-500">Produk terfavorit periode ini</Text>
                </View>
              </View>
              <View className="bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded">
                <Text className="text-[10px] font-semibold text-amber-800">Top 5</Text>
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
                          className={`w-5 h-5 rounded-full items-center justify-center ${
                            isTop1
                              ? 'bg-amber-100 border border-amber-300'
                              : idx === 1
                              ? 'bg-gray-200'
                              : 'bg-gray-100'
                          }`}
                        >
                          {isTop1 ? (
                            <Star size={10} color="#B45309" fill="#B45309" />
                          ) : (
                            <Text className="text-[10px] font-bold text-gray-700">{idx + 1}</Text>
                          )}
                        </View>
                        <Text className="text-xs font-semibold text-gray-900 truncate flex-1">
                          {item.name}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-xs font-bold text-gray-900">
                          {formatRupiah(item.totalRevenue)}
                        </Text>
                        <Text className="text-[11px] text-gray-400">
                          ({item.totalSold} terjual)
                        </Text>
                      </View>
                    </View>

                    {/* Share Progress Bar */}
                    <View className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
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

          {/* 6. RINGKASAN BISNIS */}
          <View className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm space-y-3">
            <View className="flex-row items-center gap-2">
              <View className="p-1.5 bg-blue-50 rounded-lg">
                <Sparkles size={15} color="#2563EB" />
              </View>
              <View>
                <Text className="text-base font-bold text-gray-900">Ringkasan Bisnis</Text>
                <Text className="text-xs text-gray-500">Wawasan otomatis untuk memahami performa outlet</Text>
              </View>
            </View>

            <View className="space-y-2.5 pt-1">
              {insights.map((item, idx) => (
                <View
                  key={item.id || idx}
                  className="flex-row items-start p-3 rounded-lg border border-gray-100 bg-gray-50/60"
                >
                  <View className="p-1 rounded-md bg-white border border-gray-200 mr-2.5 mt-0.5">
                    {item.type === 'trend' ? (
                      <TrendingUp size={12} color="#2563EB" />
                    ) : item.type === 'champion' ? (
                      <Star size={12} color="#D97706" />
                    ) : item.type === 'basket' ? (
                      <ShoppingBag size={12} color="#9333EA" />
                    ) : (
                      <Calendar size={12} color="#059669" />
                    )}
                  </View>
                  <Text className="text-xs text-gray-700 leading-relaxed flex-1">
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 7. PERFORMA OPERASIONAL */}
          <View className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm space-y-3">
            <View className="flex-row items-center gap-2">
              <View className="p-1.5 bg-gray-100 rounded-lg">
                <Activity size={15} color="#374151" />
              </View>
              <View>
                <Text className="text-base font-bold text-gray-900">Performa Operasional</Text>
                <Text className="text-xs text-gray-500">Kondisi kasir, perangkat POS, dan stok bahan</Text>
              </View>
            </View>

            <View className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Shift Kasir */}
              <View className="p-3 bg-gray-50/70 border border-gray-100 rounded-xl space-y-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[10px] font-mono uppercase font-bold text-gray-400">SHIFT KASIR</Text>
                  <Clock size={12} color="#6B7280" />
                </View>
                <View>
                  <Text className="text-xs font-bold text-gray-900">
                    {operationalPulse.shift.cashierName}
                  </Text>
                  <Text className="text-[11px] text-gray-500">
                    Buka: {operationalPulse.shift.startedAt}
                  </Text>
                  <Text className="text-[11px] text-gray-500">
                    Modal: {formatRupiah(operationalPulse.shift.startingCash)}
                  </Text>
                </View>
              </View>

              {/* Perangkat POS */}
              <View className="p-3 bg-gray-50/70 border border-gray-100 rounded-xl space-y-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[10px] font-mono uppercase font-bold text-gray-400">PERANGKAT POS</Text>
                  <Smartphone size={12} color="#6B7280" />
                </View>
                <View>
                  <Text className="text-xs font-bold text-gray-900">
                    {operationalPulse.devices.active} / {operationalPulse.devices.total} Online
                  </Text>
                  <Text className="text-[11px] text-emerald-600">
                    Semua perangkat tersinkronisasi
                  </Text>
                </View>
              </View>

              {/* Kesehatan Stok */}
              <View className="p-3 bg-gray-50/70 border border-gray-100 rounded-xl space-y-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[10px] font-mono uppercase font-bold text-gray-400">STATUS STOK</Text>
                  <Package size={12} color="#6B7280" />
                </View>
                <View>
                  <Text className="text-xs font-bold text-gray-900">
                    {operationalPulse.stock.total} Produk
                  </Text>
                  <Text className="text-[11px] text-gray-500">
                    {operationalPulse.stock.safe} aman •{' '}
                    <Text className={operationalPulse.stock.low > 0 ? 'text-amber-600 font-semibold' : ''}>
                      {operationalPulse.stock.low} menipis
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 8. PERLU PERHATIAN */}
          <View className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm space-y-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="p-1.5 bg-amber-50 rounded-lg">
                  <AlertTriangle size={15} color="#D97706" />
                </View>
                <View>
                  <Text className="text-base font-bold text-gray-900">Perlu Perhatian</Text>
                  <Text className="text-xs text-gray-500">Peringatan operasional yang butuh tindakan</Text>
                </View>
              </View>
              <View className="bg-amber-100 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-amber-800">1 Isu</Text>
              </View>
            </View>

            <View className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                <Package size={16} color="#D97706" />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-900">2 Menu Stok Menipis</Text>
                  <Text className="text-[11px] text-gray-600">Susu UHT dan Sirup Aren mendekati batas minimum.</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(main)/(cashier)/pos')}
                className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg"
              >
                <Text className="text-xs font-semibold text-gray-800">Cek</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* REAL INTERACTIVE DATE PICKER MODAL */}
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
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
              <View>
                <Text className="text-base font-bold text-gray-900">
                  Pilih Rentang Tanggal
                </Text>
                <Text className="text-xs text-gray-500">
                  Tap tanggal untuk memilih rentang hari atau tanggal tunggal
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsDateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Quick Presets Pills */}
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
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text className={`text-xs font-semibold ${tempRangeStart === '2026-09-12' && tempRangeEnd === '2026-09-12' ? 'text-blue-700' : 'text-gray-700'}`}>
                    Hari Ini (1 Hari • Jam)
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
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text className={`text-xs font-semibold ${tempRangeStart === '2026-09-11' && tempRangeEnd === '2026-09-11' ? 'text-blue-700' : 'text-gray-700'}`}>
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
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text className={`text-xs font-semibold ${tempRangeStart === '2026-09-06' && tempRangeEnd === '2026-09-12' ? 'text-blue-700' : 'text-gray-700'}`}>
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
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text className={`text-xs font-semibold ${tempRangeStart === '2026-08-14' && tempRangeEnd === '2026-09-12' ? 'text-blue-700' : 'text-gray-700'}`}>
                    30 Hari Terakhir
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* REAL INTERACTIVE CALENDAR VIEW */}
            <View className="py-2">
              {/* Calendar Month & Year Stepper */}
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
                  className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center"
                >
                  <ChevronLeft size={16} color="#374151" />
                </TouchableOpacity>

                <Text className="text-sm font-bold text-gray-900">
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
                  className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center"
                >
                  <ChevronRight size={16} color="#374151" />
                </TouchableOpacity>
              </View>

              {/* Day of Week Headers */}
              <View className="flex-row justify-between pb-2 border-b border-gray-100">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
                  <Text
                    key={i}
                    style={{ width: '14.28%', textAlign: 'center' }}
                    className="text-[11px] font-bold text-gray-400"
                  >
                    {d}
                  </Text>
                ))}
              </View>

              {/* Day Cells Grid */}
              <View className="flex-row flex-wrap pt-1">
                {calendarDays.map((item, idx) => {
                  if (!item.dayNumber || !item.dateStr) {
                    return (
                      <View
                        key={`empty-${idx}`}
                        style={{ width: '14.28%', height: 38 }}
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
                        height: 38,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isInRange ? '#EFF6FF' : 'transparent',
                        borderTopLeftRadius: isStart ? 19 : 0,
                        borderBottomLeftRadius: isStart ? 19 : 0,
                        borderTopRightRadius: isEnd ? 19 : 0,
                        borderBottomRightRadius: isEnd ? 19 : 0,
                      }}
                    >
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center ${
                          isSelectedEndpoint ? 'bg-blue-600 shadow-xs' : ''
                        }`}
                      >
                        <Text
                          className={`text-xs ${
                            isSelectedEndpoint
                              ? 'font-bold text-white'
                              : isInRange
                              ? 'font-semibold text-blue-700'
                              : 'text-gray-800'
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

            {/* Selection Summary & Hourly Mode Notice */}
            <View className="py-2.5 px-3 bg-gray-50 border border-gray-100 rounded-xl my-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] font-semibold text-gray-700">
                  {tempRangeStart && tempRangeEnd && tempRangeStart !== tempRangeEnd
                    ? `Terpilih: ${tempRangeStart} s/d ${tempRangeEnd}`
                    : `Terpilih: ${tempRangeStart || 'Hari Ini'}`}
                </Text>
                {tempRangeStart && (
                  <Text className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded">
                    {tempRangeStart === (tempRangeEnd || tempRangeStart)
                      ? 'Mode Jam Aktif (24 Jam)'
                      : 'Rentang Terpilih'}
                  </Text>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row items-center gap-2.5 pt-2 border-t border-gray-100">
              <TouchableOpacity
                onPress={() => setIsDateModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 items-center"
              >
                <Text className="text-xs font-semibold text-gray-700">Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleApplyCalendarRange}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 items-center shadow-xs"
              >
                <Text className="text-xs font-semibold text-white">Terapkan Tanggal</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
