import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

export type DashboardPeriod = 'harian' | 'bulanan' | 'tahunan';
export type MetricKey = 'omzet' | 'pesanan' | 'laba';

export interface ChartDataPoint {
  date: string;
  label: string;
  omzet: number;
  pesanan: number;
  laba: number;
  isFuture?: boolean;
}

export interface PeriodMetrics {
  grossSales: number;
  grossSalesGrowth: number;
  netSales: number;
  netSalesGrowth: number;
  grossProfit: number;
  grossProfitGrowth: number;
  totalTransactions: number;
  transactionsGrowth: number;
  averageOrderValue: number;
  aovGrowth: number;
  grossMargin: number;
  grossMarginGrowth: number;
  comparisonLabel?: string;
  // Backward compatibility aliases
  totalOmzet: number;
  totalLaba: number;
  profitMargin: number;
  omzetGrowth: number;
  labaGrowth: number;
}

export interface TopSellingProduct {
  id: string;
  name: string;
  categoryName?: string;
  totalRevenue: number;
  totalSold: number;
  sharePercentage: number;
}

export interface OperationalPulse {
  activeShift: {
    id: string;
    cashierName: string;
    startedAt: string;
    startingCash: number;
    hoursOpen: number;
  } | null;
  devices: {
    total: number;
    active: number;
    offline: number;
    list: {
      id: string;
      name: string;
      status: string;
      lastSeenAt: string | null;
    }[];
  };
  stockHealth: {
    total: number;
    safe: number;
    low: number;
    outOfStock: number;
  };
  todayOrders: {
    completed: number;
    pending: number;
    total: number;
  };
}

export interface AttentionItem {
  id: string;
  type: 'stock' | 'shift' | 'device';
  title: string;
  description: string;
  severity: 'warning' | 'critical';
  actionLabel: string;
  actionHref: string;
}

export interface AnnualMonthRecap {
  monthIndex: number;
  monthName: string;
  omzet: number;
  pesanan: number;
  aov: number;
  laba: number;
  status: 'completed' | 'in_progress' | 'future';
  isBestMonth: boolean;
}

export interface BusinessInsight {
  id: string;
  type: 'trend' | 'champion' | 'basket' | 'peak' | 'profit';
  text: string;
}

export interface OutletOverviewData {
  outletName: string;
  outletKey: string;
  slug: string | null;
  storeDescription: string | null;
  storefrontEnabled: boolean;
  staffCount: number;
  deviceCount: number;
  totalLifetimeTransactions: number;
  userName: string;
  activeAlertCount: number;
  criticalAlerts: string[];
}

export interface DashboardResponse {
  success: boolean;
  error?: string;
  tab: DashboardPeriod;
  periodLabel: string;
  outlet: OutletOverviewData;
  metrics: PeriodMetrics;
  chartData: ChartDataPoint[];
  topProducts: TopSellingProduct[];
  operationalPulse: OperationalPulse;
  attentionItems: AttentionItem[];
  annualBreakdown?: AnnualMonthRecap[];
  bestMonthName?: string;
  insights: BusinessInsight[];
}

export interface DashboardParams {
  tab: DashboardPeriod;
  from?: string;
  to?: string;
  month?: string;
  year?: string;
  preset?: string;
}

export const useDashboardData = (params: DashboardParams) => {
  const sessionToken = useAuthStore((state) => state.sessionToken);

  const queryParams = new URLSearchParams();
  queryParams.set('tab', params.tab);
  if (params.from) queryParams.set('from', params.from);
  if (params.to) queryParams.set('to', params.to);
  if (params.month) queryParams.set('month', params.month);
  if (params.year) queryParams.set('year', params.year);
  if (params.preset) queryParams.set('preset', params.preset);

  const queryString = queryParams.toString();

  return useQuery<DashboardResponse>({
    queryKey: ['mobile-dashboard', params],
    queryFn: async () => {
      const data = await fetchWithAuth(`/api/mobile/v1/dashboard?${queryString}`);
      return data as DashboardResponse;
    },
    enabled: !!sessionToken,
    staleTime: 30000, // 30 seconds fresh
    refetchInterval: (query) => {
      const errStatus = (query.state.error as any)?.status;
      if (errStatus === 401 || errStatus === 403) return false;
      return 60000; // Background refresh every 1 minute
    },
  });
};
