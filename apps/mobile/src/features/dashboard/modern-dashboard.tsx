import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Store,
  Smartphone,
  AlertTriangle,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  Receipt,
  Layers,
  Percent,
} from 'lucide-react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useAuthStore } from '@/store/auth-store';
import { useActiveShift } from '@/hooks/use-shifts';

export type DashboardPeriod = 'harian' | 'bulanan' | 'tahunan';
export type DailyPreset = 'today' | 'yesterday' | '7d' | '30d';

export function ModernDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 600;
  const isPhoneLandscape = !isTablet && isLandscape;
  const bottomInset = Math.max(insets.bottom, 12) + (isPhoneLandscape ? 60 : 88);

  const user = useAuthStore((state) => state.user);
  const deviceName = useAuthStore((state) => state.deviceName);
  const { data: shiftData } = useActiveShift();
  const activeShift = shiftData?.data;

  // Period Selection State (Harian, Bulanan, Tahunan)
  const [activePeriod, setActivePeriod] = useState<DashboardPeriod>('harian');
  const [dailyPreset, setDailyPreset] = useState<DailyPreset>('today');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(8); // September (0-indexed)
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Dynamic greeting based on current hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat pagi 👋';
    if (hour < 15) return 'Selamat siang ☀️';
    if (hour < 18) return 'Selamat sore ☕';
    return 'Selamat malam 🌙';
  }, []);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const outletDisplayName = user?.tenantName || 'Kedai Kopi Kita - Malang';

  // Outlet-Centric datasets structured for the 3 periods
  const metricsData = useMemo(() => {
    if (activePeriod === 'harian') {
      if (dailyPreset === 'today') {
        return {
          penjualan: 4850000,
          penjualanGrowth: '+14.2%',
          isPositive: true,
          pesanan: 76,
          pesananGrowth: '+8.5%',
          rataRataPesanan: 63800,
          keuntungan: 2910000,
          keuntunganMargin: '60%',
          insights: [
            'Penjualan outlet hari ini meningkat 14.2% dibanding jam yang sama kemarin.',
            'Kopi Susu Gula Aren & Americano memimpin 45% volume penjualan outlet.',
            'Rata-rata nilai pesanan per transaksi naik menjadi Rp 63.800.',
            'Jam tersibuk outlet terjadi antara pukul 12:00 - 14:00 (makan siang).',
          ],
          chartData: [
            { label: '08:00', value: 350000 },
            { label: '10:00', value: 850000 },
            { label: '12:00', value: 1650000 },
            { label: '14:00', value: 920000 },
            { label: '16:00', value: 1080000 },
          ],
        };
      } else if (dailyPreset === 'yesterday') {
        return {
          penjualan: 4250000,
          penjualanGrowth: '+2.1%',
          isPositive: true,
          pesanan: 70,
          pesananGrowth: '-1.2%',
          rataRataPesanan: 60700,
          keuntungan: 2550000,
          keuntunganMargin: '60%',
          insights: [
            'Penjualan hari kemarin stabil didorong pesanan makan siang.',
            'Cafe Latte dan Butter Croissant mencatat penjualan tertinggi.',
            'Tingkat retensi pelanggan berulang mencapai 38% total struk.',
          ],
          chartData: [
            { label: '08:00', value: 400000 },
            { label: '10:00', value: 750000 },
            { label: '12:00', value: 1500000 },
            { label: '14:00', value: 800000 },
            { label: '16:00', value: 800000 },
          ],
        };
      } else if (dailyPreset === '7d') {
        return {
          penjualan: 32400000,
          penjualanGrowth: '+11.8%',
          isPositive: true,
          pesanan: 512,
          pesananGrowth: '+9.4%',
          rataRataPesanan: 63280,
          keuntungan: 19440000,
          keuntunganMargin: '60%',
          insights: [
            'Total omzet outlet 7 hari terakhir melampaui target mingguan.',
            'Kategori Minuman Kopi menyumbang 64% pendapatan outlet ini.',
            'Lonjakan penjualan tertinggi tercatat pada hari Jumat dan Sabtu sore.',
          ],
          chartData: [
            { label: 'Sen', value: 4200000 },
            { label: 'Sel', value: 3900000 },
            { label: 'Rab', value: 4500000 },
            { label: 'Kam', value: 4800000 },
            { label: 'Jum', value: 5400000 },
            { label: 'Sab', value: 5800000 },
            { label: 'Min', value: 3800000 },
          ],
        };
      } else {
        // 30d
        return {
          penjualan: 134200000,
          penjualanGrowth: '+16.5%',
          isPositive: true,
          pesanan: 2110,
          pesananGrowth: '+12.8%',
          rataRataPesanan: 63600,
          keuntungan: 80520000,
          keuntunganMargin: '60%',
          insights: [
            'Pertumbuhan 30 hari konsisten di atas 15% berkat promosi bundle kopi & snack.',
            'Metode pembayaran QRIS mendominasi 62% seluruh transaksi outlet.',
            'Frekuensi kunjungan rata-rata mencapai 70 transaksi per hari.',
          ],
          chartData: [
            { label: 'Mgg 1', value: 31000000 },
            { label: 'Mgg 2', value: 33500000 },
            { label: 'Mgg 3', value: 35200000 },
            { label: 'Mgg 4', value: 34500000 },
          ],
        };
      }
    } else if (activePeriod === 'bulanan') {
      return {
        penjualan: 138400000,
        penjualanGrowth: '+18.4%',
        isPositive: true,
        pesanan: 2180,
        pesananGrowth: '+12.1%',
        rataRataPesanan: 63480,
        keuntungan: 83040000,
        keuntunganMargin: '60%',
        insights: [
          `Pertumbuhan bulan ${monthNames[selectedMonthIndex]} didorong lonjakan pesanan akhir pekan.`,
          'Kategori Pastry & Makanan mengalami kenaikan omzet 24%.',
          'Efisiensi modal bahan baku (HPP) terjaga di angka 40% dari total omzet.',
          'Tidak ada selisih kas fisik yang signifikan selama sesi shift bulan ini.',
        ],
        chartData: [
          { label: 'Mgg 1', value: 31000000 },
          { label: 'Mgg 2', value: 34500000 },
          { label: 'Mgg 3', value: 38200000 },
          { label: 'Mgg 4', value: 34700000 },
        ],
      };
    } else {
      // Tahunan (Annual Business Recap) - ONLY ACTUALS up to September 2026!
      return {
        penjualan: 1120000000,
        penjualanGrowth: '+26.8%',
        isPositive: true,
        pesanan: 17640,
        pesananGrowth: '+22.4%',
        rataRataPesanan: 63490,
        keuntungan: 672000000,
        keuntunganMargin: '60%',
        insights: [
          'Rekapitulasi tahun 2026 menunjukkan performa finansial outlet yang stabil & sehat.',
          'Data aktual tercatat hingga bulan September 2026 tanpa estimasi prediktif.',
          'Kuartal 3 (Juli - September) membukukan rekor volume penjualan tertinggi.',
          'Total 17.640 pesanan diselesaikan dengan tingkat kepuasan tinggi.',
        ],
        chartData: [
          { label: 'Jan', value: 98000000 },
          { label: 'Feb', value: 104000000 },
          { label: 'Mar', value: 115000000 },
          { label: 'Apr', value: 118000000 },
          { label: 'Mei', value: 124000000 },
          { label: 'Jun', value: 130000000 },
          { label: 'Jul', value: 136000000 },
          { label: 'Agu', value: 142000000 },
          { label: 'Sep', value: 153000000 },
        ],
      };
    }
  }, [activePeriod, dailyPreset, selectedMonthIndex]);

  // Top Products for this single outlet
  const topProducts = [
    { rank: 1, name: 'Kopi Susu Gula Aren', sold: 54, revenue: 1188000, pct: 100 },
    { rank: 2, name: 'Americano (Iced)', sold: 42, revenue: 840000, pct: 78 },
    { rank: 3, name: 'Cafe Latte (Hot/Ice)', sold: 34, revenue: 884000, pct: 63 },
    { rank: 4, name: 'Butter Croissant Premium', sold: 26, revenue: 676000, pct: 48 },
    { rank: 5, name: 'Nasi Goreng Spesial', sold: 20, revenue: 700000, pct: 37 },
  ];

  // Actionable Attention Items for this single outlet
  const attentionItems = [
    {
      id: 'shift',
      title: activeShift ? 'Shift Kasir Berjalan Normal' : 'Shift Kasir Belum Dibuka',
      desc: activeShift
        ? `Sesi aktif dibuka oleh ${activeShift.cashierName || user?.name || 'Kasir'} (Modal Rp ${Number(activeShift.startingCash || 0).toLocaleString('id-ID')}).`
        : 'Kasir belum membuka sesi shift baru hari ini.',
      actionLabel: activeShift ? 'Kelola Shift' : 'Buka Shift',
      onPress: () => router.push('/(main)/(cashier)/shift' as any),
      type: activeShift ? 'success' : 'warning',
    },
    {
      id: 'stock',
      title: 'Stok Bahan Baku & Menu Perlu Diperiksa',
      desc: '2 produk terdeteksi habis atau di bawah batas minimum pemesanan.',
      actionLabel: 'Katalog Menu',
      onPress: () => router.push('/(main)/(cashier)/items' as any),
      type: 'warning',
    },
    {
      id: 'device',
      title: 'Status Perangkat POS Outlet',
      desc: `Perangkat "${deviceName || 'Mobile POS'}" tersinkronisasi penuh ke cloud MENUIN.`,
      actionLabel: 'Pengaturan',
      onPress: () => router.push('/(main)/(cashier)/settings' as any),
      type: 'info',
    },
  ];

  // Calculate SVG Chart bar dimensions
  const maxChartValue = Math.max(...metricsData.chartData.map((d) => d.value), 1);
  const chartHeight = 120;
  const chartWidth = Math.min(width - 48, 680);
  const barCount = metricsData.chartData.length;
  const barSpacing = chartWidth / barCount;
  const barWidth = Math.min(barSpacing * 0.55, 34);

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]" edges={['left', 'right']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset }}
      >
        <View style={{ maxWidth: 1040, width: '100%', alignSelf: 'center' }}>
          {/* ============================================================ */}
          {/* 1. OUTLET-CENTRIC HERO BANNER                                */}
          {/* ============================================================ */}
          <View className="px-5 pt-4 pb-4 bg-white border-b border-gray-200/80">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1 mr-2">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {greeting}
                </Text>
                <Text className="text-xl font-black text-gray-900 leading-tight">
                  {outletDisplayName}
                </Text>
              </View>

              {/* Status Badge: Active Outlet */}
              <View className="flex-row items-center bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                <Text className="text-xs font-bold text-emerald-800">
                  Outlet Aktif
                </Text>
              </View>
            </View>

            {/* Quick Operational Metrics Snapshot Chips */}
            <View className="flex-row items-center flex-wrap gap-2 mt-2 pt-3 border-t border-gray-100">
              <View className="flex-row items-center bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                <Users size={12} color="#6b7280" className="mr-1" />
                <Text className="text-[11px] font-semibold text-gray-700">12 Staf</Text>
              </View>
              <View className="flex-row items-center bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                <Smartphone size={12} color="#6b7280" className="mr-1" />
                <Text className="text-[11px] font-semibold text-gray-700">4 Perangkat POS</Text>
              </View>
              <View className="flex-row items-center bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                <Receipt size={12} color="#6b7280" className="mr-1" />
                <Text className="text-[11px] font-semibold text-gray-700">1.284 Transaksi Bulan Ini</Text>
              </View>
              <View className="flex-row items-center bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                <Sparkles size={12} color="#014FFD" className="mr-1" />
                <Text className="text-[11px] font-bold text-[#014FFD]">Sistem Cloud Sinkron</Text>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* 2. PERIOD SWITCHER: HARIAN, BULANAN, TAHUNAN                 */}
          {/* ============================================================ */}
          <View className="px-5 pt-4">
            <View className="bg-gray-200/80 p-1 rounded-2xl flex-row items-center">
              {(['harian', 'bulanan', 'tahunan'] as DashboardPeriod[]).map((period) => {
                const isActive = activePeriod === period;
                return (
                  <TouchableOpacity
                    key={period}
                    activeOpacity={0.7}
                    onPress={() => setActivePeriod(period)}
                    className={`flex-1 py-2 items-center justify-center rounded-xl ${isActive ? 'bg-white shadow-2xs' : 'bg-transparent'
                      }`}
                  >
                    <Text
                      className={`text-xs capitalize font-black ${isActive ? 'text-gray-900' : 'text-gray-500'
                        }`}
                    >
                      {period}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sub-Navigator per Period */}
            <View className="mt-3">
              {/* Mode 1: Harian (Preset Chips) */}
              {activePeriod === 'harian' && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row"
                >
                  {[
                    { id: 'today', label: 'Hari Ini' },
                    { id: 'yesterday', label: 'Kemarin' },
                    { id: '7d', label: '7 Hari Terakhir' },
                    { id: '30d', label: '30 Hari Terakhir' },
                  ].map((item) => {
                    const isSelected = dailyPreset === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        onPress={() => setDailyPreset(item.id as DailyPreset)}
                        className={`px-3 py-1.5 rounded-xl mr-2 border ${isSelected
                            ? 'bg-[#014FFD] border-[#014FFD]'
                            : 'bg-white border-gray-200'
                          }`}
                      >
                        <Text
                          className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-700'
                            }`}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Mode 2: Bulanan (Month Navigator) */}
              {activePeriod === 'bulanan' && (
                <View className="flex-row items-center justify-between bg-white px-4 py-2 rounded-2xl border border-gray-200">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setSelectedMonthIndex((prev) => (prev > 0 ? prev - 1 : 11))}
                    className="p-1 rounded-lg bg-gray-100 active:bg-gray-200"
                  >
                    <ChevronLeft size={16} color="#374151" />
                  </TouchableOpacity>
                  <View className="flex-row items-center">
                    <Calendar size={14} color="#014FFD" className="mr-2" />
                    <Text className="text-xs font-black text-gray-900">
                      {monthNames[selectedMonthIndex]} {selectedYear}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setSelectedMonthIndex((prev) => (prev < 11 ? prev + 1 : 0))}
                    className="p-1 rounded-lg bg-gray-100 active:bg-gray-200"
                  >
                    <ChevronRight size={16} color="#374151" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Mode 3: Tahunan (Annual Recap Navigator) */}
              {activePeriod === 'tahunan' && (
                <View className="flex-row items-center justify-between bg-white px-4 py-2 rounded-2xl border border-gray-200">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setSelectedYear((y) => y - 1)}
                    className="p-1 rounded-lg bg-gray-100 active:bg-gray-200"
                  >
                    <ChevronLeft size={16} color="#374151" />
                  </TouchableOpacity>
                  <View className="flex-row items-center">
                    <Calendar size={14} color="#014FFD" className="mr-2" />
                    <Text className="text-xs font-black text-gray-900">
                      Rekap Bisnis Tahunan: {selectedYear} (Jan - Sep)
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setSelectedYear((y) => y + 1)}
                    className="p-1 rounded-lg bg-gray-100 active:bg-gray-200"
                  >
                    <ChevronRight size={16} color="#374151" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* ============================================================ */}
          {/* 3. CORE METRIC TILES (4 CARDS)                               */}
          {/* ============================================================ */}
          <View className="px-5 pt-4">
            <View className="flex-row flex-wrap gap-3">
              {/* Tile 1: Penjualan Bersih */}
              <View
                className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs"
                style={{ flex: 1, minWidth: isTablet ? 200 : 150 }}
              >
                <View className="flex-row justify-between items-center mb-1.5">
                  <Text className="text-xs font-bold text-gray-400">Penjualan Bersih</Text>
                  <View className="w-6 h-6 rounded-lg bg-blue-50 items-center justify-center">
                    <TrendingUp size={13} color="#014FFD" />
                  </View>
                </View>
                <Text className="text-lg font-black text-gray-900" numberOfLines={1}>
                  {formatRupiah(metricsData.penjualan)}
                </Text>
                <View className="flex-row items-center mt-1">
                  <ArrowUpRight size={12} color="#10b981" />
                  <Text className="text-[11px] font-bold text-emerald-600 ml-0.5">
                    {metricsData.penjualanGrowth}
                  </Text>
                  <Text className="text-[10px] text-gray-400 ml-1">vs lalu</Text>
                </View>
              </View>

              {/* Tile 2: Total Pesanan */}
              <View
                className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs"
                style={{ flex: 1, minWidth: isTablet ? 200 : 150 }}
              >
                <View className="flex-row justify-between items-center mb-1.5">
                  <Text className="text-xs font-bold text-gray-400">Total Pesanan</Text>
                  <View className="w-6 h-6 rounded-lg bg-indigo-50 items-center justify-center">
                    <ShoppingBag size={13} color="#4f46e5" />
                  </View>
                </View>
                <Text className="text-lg font-black text-gray-900" numberOfLines={1}>
                  {metricsData.pesanan.toLocaleString('id-ID')}
                </Text>
                <View className="flex-row items-center mt-1">
                  <ArrowUpRight size={12} color="#10b981" />
                  <Text className="text-[11px] font-bold text-emerald-600 ml-0.5">
                    {metricsData.pesananGrowth}
                  </Text>
                  <Text className="text-[10px] text-gray-400 ml-1">pesanan</Text>
                </View>
              </View>

              {/* Tile 3: Rata-rata Pesanan (AOV) */}
              <View
                className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs"
                style={{ flex: 1, minWidth: isTablet ? 200 : 150 }}
              >
                <View className="flex-row justify-between items-center mb-1.5">
                  <Text className="text-xs font-bold text-gray-400">Rata-rata Pesanan</Text>
                  <View className="w-6 h-6 rounded-lg bg-emerald-50 items-center justify-center">
                    <Receipt size={13} color="#059669" />
                  </View>
                </View>
                <Text className="text-lg font-black text-gray-900" numberOfLines={1}>
                  {formatRupiah(metricsData.rataRataPesanan)}
                </Text>
                <Text className="text-[10px] text-gray-400 mt-1">Nilai per pelanggan</Text>
              </View>

              {/* Tile 4: Keuntungan Kotor */}
              <View
                className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs"
                style={{ flex: 1, minWidth: isTablet ? 200 : 150 }}
              >
                <View className="flex-row justify-between items-center mb-1.5">
                  <Text className="text-xs font-bold text-gray-400">Est. Keuntungan</Text>
                  <View className="w-6 h-6 rounded-lg bg-amber-50 items-center justify-center">
                    <Percent size={13} color="#d97706" />
                  </View>
                </View>
                <Text className="text-lg font-black text-gray-900" numberOfLines={1}>
                  {formatRupiah(metricsData.keuntungan)}
                </Text>
                <Text className="text-[10px] font-bold text-emerald-600 mt-1">
                  Margin {metricsData.keuntunganMargin} (HPP 40%)
                </Text>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* 4. VISUAL TREND CHART (SVG)                                  */}
          {/* ============================================================ */}
          <View className="px-5 pt-4">
            <View className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
              <View className="flex-row justify-between items-center mb-3">
                <View>
                  <Text className="text-xs font-black text-gray-900">
                    Tren Penjualan Outlet
                  </Text>
                  <Text className="text-[11px] text-gray-500 font-medium">
                    {activePeriod === 'harian'
                      ? 'Distribusi omzet per jam operasional'
                      : activePeriod === 'bulanan'
                        ? 'Performa penjualan mingguan'
                        : 'Akumulasi bulanan aktual tahun 2026'}
                  </Text>
                </View>
                <View className="bg-blue-50 px-2 py-0.5 rounded-md">
                  <Text className="text-[10px] font-bold text-[#014FFD]">
                    IDR Terkumpul
                  </Text>
                </View>
              </View>

              {/* Chart Component */}
              <View className="items-center justify-center py-2">
                <Svg height={chartHeight} width={chartWidth}>
                  {metricsData.chartData.map((bar, idx) => {
                    const barH = (bar.value / maxChartValue) * (chartHeight - 30);
                    const x = idx * barSpacing + (barSpacing - barWidth) / 2;
                    const y = chartHeight - 24 - barH;
                    return (
                      <React.Fragment key={idx}>
                        {/* Bar Rect */}
                        <Rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={Math.max(barH, 4)}
                          rx={5}
                          fill={idx === metricsData.chartData.length - 1 ? '#014FFD' : '#93c5fd'}
                        />
                        {/* Bar Label */}
                        <SvgText
                          x={x + barWidth / 2}
                          y={chartHeight - 6}
                          fontSize="10"
                          fontWeight="bold"
                          fill="#64748b"
                          textAnchor="middle"
                        >
                          {bar.label}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                </Svg>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* 5. RINGKASAN BISNIS (BUSINESS NARRATIVE INSIGHTS)            */}
          {/* ============================================================ */}
          <View className="px-5 pt-4">
            <View className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 shadow-2xs">
              <View className="flex-row items-center mb-2.5">
                <Sparkles size={16} color="#014FFD" />
                <Text className="text-xs font-black text-blue-900 ml-1.5">
                  Ringkasan Analisis Outlet
                </Text>
              </View>
              <View className="space-y-1.5">
                {metricsData.insights.map((insight, idx) => (
                  <View key={idx} className="flex-row items-start">
                    <Text className="text-[#014FFD] mr-2 text-xs leading-tight font-black">•</Text>
                    <Text className="text-xs text-blue-950 font-medium leading-relaxed flex-1">
                      {insight}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* 6. MENU TERLARIS (TOP PRODUCTS)                              */}
          {/* ============================================================ */}
          <View className="px-5 pt-4">
            <View className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xs font-black text-gray-900">
                  Menu Terlaris Outlet
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(main)/(cashier)/items' as any)}
                  className="flex-row items-center"
                >
                  <Text className="text-[11px] font-bold text-[#014FFD] mr-0.5">
                    Lihat Katalog
                  </Text>
                  <ChevronRight size={12} color="#014FFD" />
                </TouchableOpacity>
              </View>

              <View className="divide-y divide-gray-100">
                {topProducts.map((prod) => (
                  <View key={prod.rank} className="py-2.5">
                    <View className="flex-row justify-between items-center mb-1.5">
                      <View className="flex-row items-center flex-1 mr-2">
                        <View className="w-5 h-5 rounded-full bg-gray-100 items-center justify-center mr-2">
                          <Text className="text-[10px] font-black text-gray-600">
                            {prod.rank}
                          </Text>
                        </View>
                        <Text className="text-xs font-bold text-gray-900" numberOfLines={1}>
                          {prod.name}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-xs font-black text-gray-900">
                          {formatRupiah(prod.revenue)}
                        </Text>
                        <Text className="text-[10px] text-gray-400 font-semibold">
                          {prod.sold} porsi terjual
                        </Text>
                      </View>
                    </View>
                    {/* Linear Progress Bar */}
                    <View className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <View
                        style={{ width: `${prod.pct}%` }}
                        className="h-full bg-[#014FFD] rounded-full"
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* 7. PERLU PERHATIAN (OPERATIONAL ACTIONABLE CARDS)             */}
          {/* ============================================================ */}
          <View className="px-5 pt-4">
            <Text className="text-xs font-black text-gray-900 mb-2">
              Perlu Perhatian Operasional
            </Text>
            <View className="gap-2.5">
              {attentionItems.map((item) => (
                <View
                  key={item.id}
                  className="bg-white p-3.5 rounded-2xl border border-gray-200 flex-row items-center justify-between shadow-2xs"
                >
                  <View className="flex-row items-center flex-1 mr-3">
                    <View
                      className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${item.type === 'warning'
                          ? 'bg-amber-50 border border-amber-200'
                          : item.type === 'success'
                            ? 'bg-emerald-50 border border-emerald-200'
                            : 'bg-blue-50 border border-blue-200'
                        }`}
                    >
                      {item.type === 'warning' ? (
                        <AlertTriangle size={15} color="#d97706" />
                      ) : item.type === 'success' ? (
                        <CheckCircle2 size={15} color="#059669" />
                      ) : (
                        <Smartphone size={15} color="#014FFD" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-gray-900 leading-tight">
                        {item.title}
                      </Text>
                      <Text className="text-[10px] text-gray-500 mt-0.5" numberOfLines={2}>
                        {item.desc}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={item.onPress}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 active:bg-gray-200"
                  >
                    <Text className="text-[11px] font-bold text-gray-800">
                      {item.actionLabel}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
