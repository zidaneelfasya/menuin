'use client';

import * as React from 'react';
import { 
  MoreVertical, 
  Printer, 
  Eye, 
  Ban, 
  AlertTriangle, 
  Loader2, 
  ChefHat, 
  ReceiptText,
  X,
  Globe,
  Monitor,
  Copy,
  Check,
  ArrowUpDown,
  Calendar as CalendarIcon,
  CheckCircle2,
  RefreshCw,
  Clock,
  Utensils,
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  SlidersHorizontal,
  PackageSearch,
  ShoppingBag,
  Store,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  UtensilsCrossed
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { voidTransaction, getTransactionDetails } from '@/lib/actions/transactions';
import { updateOrderStatus, syncOrderPaymentStatus } from '@/lib/actions/orders';
import { ReceiptPrinter, ReceiptData, TenantReceiptSettings } from '@/features/pos/components/receipt-printer';
import { toast } from 'sonner';

export type Transaction = {
  id: string;
  cashierMembershipId?: string | null;
  posSessionId?: string | null;
  shiftId?: string | null;
  totalAmount: string;
  discount: string | null;
  tax: string | null;
  serviceCharge?: string | null;
  platformFee?: string | null;
  rounding?: string | null;
  gatewayFee?: string | null;
  netAmount?: string | null;
  grandTotal: string;
  promoCode?: string | null;
  paymentMethod: string;
  paymentStatus?: string | null;
  status: string;
  source: string;
  orderType: string;
  orderNumber?: string | null;
  customerName: string | null;
  customerPhone?: string | null;
  tableNumber: string | null;
  voidReason?: string | null;
  voidedAt?: Date | string | null;
  createdAt: Date;
};

export type TimeFilter = 'all' | 'today' | 'yesterday' | '7days' | 'this_month' | 'custom';
export type SortOption = 'newest' | 'oldest' | 'amount_high' | 'amount_low';
export type SourceFilter = 'all' | 'pos' | 'storefront';
export type StatusFilter = 'all' | 'on_process' | 'completed' | 'pending_payment' | 'cancelled';
export type OrderTypeFilter = 'all' | 'dine_in' | 'takeaway' | 'delivery';

export type TransactionStatusKey = 'completed' | 'on_process' | 'pending_payment' | 'cancelled' | 'failed';

export function getTransactionStatusDetails(status?: string | null, paymentStatus?: string | null) {
  const s = (status || '').toUpperCase();
  const ps = (paymentStatus || '').toUpperCase();

  // 1. Canceled / Void (Past Due style in screenshot)
  if (s === 'CANCELLED' || s === 'CANCELED' || ps === 'CANCELED' || ps === 'REFUNDED') {
    return {
      key: 'cancelled' as TransactionStatusKey,
      label: 'Batal',
      badgeClass: 'bg-rose-100/70 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-medium',
      iconBoxClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40',
      dotClass: 'bg-rose-500',
      description: 'Dibatalkan (Void)',
    };
  }

  // 2. Failed / Expired
  if (ps === 'FAILED' || ps === 'EXPIRED' || ps === 'DENIED' || s === 'FAILED') {
    return {
      key: 'failed' as TransactionStatusKey,
      label: 'Gagal',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium',
      iconBoxClass: 'bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800',
      dotClass: 'bg-slate-400',
      description: 'Transaksi Gagal / Expired',
    };
  }

  // 3. Pending Payment (Draft style in screenshot)
  if (ps === 'PENDING' || ps === 'UNPAID' || s === 'PENDING') {
    return {
      key: 'pending_payment' as TransactionStatusKey,
      label: 'Menunggu Bayar',
      badgeClass: 'bg-sky-100/80 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 font-medium',
      iconBoxClass: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border border-sky-200/60 dark:border-sky-900/40',
      dotClass: 'bg-sky-500 animate-pulse',
      description: 'Menunggu Pembayaran',
    };
  }

  // 4. On Process (Open style in screenshot - purple/blue)
  if (s === 'PROCESSING' || s === 'NEW' || s === 'READY') {
    const isReady = s === 'READY';
    const isNew = s === 'NEW';
    const label = isReady ? 'Siap Saji' : isNew ? 'Pesanan Baru' : 'On Process';
    return {
      key: 'on_process' as TransactionStatusKey,
      label,
      badgeClass: 'bg-purple-100/80 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 font-medium',
      iconBoxClass: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900/40',
      dotClass: 'bg-purple-500 animate-pulse',
      description: isReady ? 'Siap Disajikan' : isNew ? 'Pesanan Baru' : 'Sedang Diproses Dapur',
    };
  }

  // 5. Default: Sukses (Paid style in screenshot - green)
  return {
    key: 'completed' as TransactionStatusKey,
    label: 'Sukses',
    badgeClass: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 font-medium',
    iconBoxClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40',
    dotClass: 'bg-emerald-500',
    description: 'Selesai & Lunas',
  };
}

export function getOrderTypeDetails(orderType?: string | null) {
  const ot = (orderType || 'DINE_IN').toUpperCase();
  if (ot.includes('TAKE') || ot.includes('BUNGKUS')) {
    return { key: 'takeaway' as const, label: 'Bawa Pulang (Takeaway)' };
  }
  if (ot.includes('DELIV') || ot.includes('GRAB') || ot.includes('GOFOOD') || ot.includes('SHOPEE')) {
    return { key: 'delivery' as const, label: 'Pesan Antar (Delivery)' };
  }
  return { key: 'dine_in' as const, label: 'Makan di Tempat (Dine In)' };
}

const paymentMethodMap: Record<string, string> = {
  CASH: 'Tunai',
  cash: 'Tunai',
  TUNAI: 'Tunai',
  QRIS_STATIC: 'QRIS Statis Toko',
  qris_static: 'QRIS Statis Toko',
  QRIS_DYNAMIC: 'QRIS Dinamis',
  qris_dynamic: 'QRIS Dinamis',
  QRIS: 'QRIS',
  qris: 'QRIS',
  TRANSFER: 'Transfer Bank',
  transfer: 'Transfer Bank',
  BANK_TRANSFER: 'Transfer Bank',
  CARD: 'Kartu EDC',
  card: 'Kartu EDC',
  EDC: 'Kartu EDC',
  ONLINE: 'Self QR Online',
};

const getOrderSourceInfo = (source?: string | null) => {
  const s = (source || 'POS').toUpperCase();
  if (s === 'ONLINE' || s === 'WEB_ORDER' || s === 'STOREFRONT' || s === 'QR') {
    return {
      label: 'Self Order',
      shortLabel: 'Self Order',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      isStorefront: true,
    };
  }
  if (s === 'DELIVERY') {
    return {
      label: 'Delivery Online',
      shortLabel: 'Delivery',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      isStorefront: true,
    };
  }
  return {
    label: 'Kasir Manual (POS)',
    shortLabel: 'Kasir Manual',
    badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20',
    isStorefront: false,
  };
};

function formatFriendlyDate(dateInput: Date | string): { dateStr: string; timeStr: string } {
  const d = new Date(dateInput);
  const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  const dateStr = d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return { dateStr, timeStr };
}

function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'PL';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const avatarColorPalette = [
  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
];

function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColorPalette.length;
  return avatarColorPalette[index];
}

/**
 * Visual Spline & Sparkline Helper for SaaS KPI Cards
 */
function getCubicSplinePath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

function MiniSparkline({
  percentage,
  isPositive,
  metricSeed = 1,
  color,
  data,
}: {
  percentage?: number;
  isPositive?: boolean;
  metricSeed?: number;
  color?: string;
  data?: number[];
}) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [isInView, setIsInView] = React.useState(false);
  const [isAnimated, setIsAnimated] = React.useState(false);

  React.useEffect(() => {
    const el = svgRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isInView) {
      setIsAnimated(false);
      return;
    }
    setIsAnimated(false);
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 40 + metricSeed * 25);
    return () => clearTimeout(timer);
  }, [isInView, percentage, data, metricSeed]);

  const width = 76;
  const height = 40;
  const padX = 2;
  const midY = height / 2;

  const gradId = React.useId().replace(/:/g, "_");
  const positive = isPositive !== undefined
    ? isPositive
    : (data && data.length >= 2)
      ? data[data.length - 1] >= data[0]
      : (percentage ?? 0) >= 0;
  const strokeColor = color || (positive ? "#10b981" : "#f43f5e");

  const { lineD, areaD, lastPoint } = React.useMemo(() => {
    const pts: { x: number; y: number }[] = [];

    // Prioritize REAL DATA when provided!
    if (data && data.length >= 2) {
      const dataMin = Math.min(...data);
      const dataMax = Math.max(...data);
      const min = dataMin > 0 ? Math.max(0, dataMin * 0.7) : Math.min(0, dataMin);
      const max = Math.max(dataMax, min + 1);
      const range = max - min || 1;

      data.forEach((val, idx) => {
        const x = padX + (idx / (data.length - 1)) * (width - 2 * padX);
        const clampedVal = Math.max(min, Math.min(max, val));
        const y = height - 5 - ((clampedVal - min) / range) * (height - 10);
        pts.push({ x, y });
      });
    } else {
      const numPoints = 28;
      const absP = Math.abs(percentage ?? 10);
      const isUp = positive;

      const ratio = Math.min(absP / 50, 1.0);
      const maxClimb = 24;
      const actualClimb = ratio * maxClimb;

      const yStart = isUp ? midY + actualClimb * 0.47 : midY - actualClimb * 0.47;
      const yEnd = isUp ? midY - actualClimb * 0.53 : midY + actualClimb * 0.53;

      const phase = (metricSeed * 0.43) % 1;

      for (let i = 0; i < numPoints; i++) {
        const t = i / (numPoints - 1);
        const x = padX + t * (width - 2 * padX);
        const linearY = yStart + (yEnd - yStart) * t;

        const oct1 = Math.sin((t * 4.3 + phase * 2.1) * Math.PI * 2) * 2.3;
        const oct2 = Math.cos((t * 8.7 + phase * 4.3) * Math.PI * 2) * 1.5;
        const oct3 = Math.sin((t * 13.1 + phase * 1.7) * Math.PI * 2) * 0.8;
        const drift = Math.sin((t * 2.1 + phase) * Math.PI * 2) * 0.9;
        const rawNoise = oct1 + oct2 + oct3 + drift;

        const windowFactor = Math.pow(Math.sin(t * Math.PI), 0.65);
        const wave = rawNoise * windowFactor;

        const y = Math.max(2.0, Math.min(height - 2.5, linearY + wave));
        pts.push({ x, y });
      }
    }

    if (pts.length < 2) return { lineD: "", areaD: "", lastPoint: null };

    const splineD = getCubicSplinePath(pts);
    const first = pts[0];
    const last = pts[pts.length - 1];
    const fillD = `${splineD} L ${last.x.toFixed(1)},${height} L ${first.x.toFixed(1)},${height} Z`;

    return { lineD: splineD, areaD: fillD, lastPoint: last };
  }, [percentage, data, metricSeed, width, height, midY, padX, positive]);

  if (!lineD) return null;

  return (
    <svg ref={svgRef} width={width} height={height} className="overflow-visible flex-shrink-0">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={color === "#ffffff" ? 0.32 : 0.22} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <path
        d={areaD}
        fill={`url(#${gradId})`}
        style={{
          opacity: isAnimated ? 1 : 0,
          transition: "opacity 800ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      />
      <path
        d={lineD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
        strokeDasharray={100}
        strokeDashoffset={isAnimated ? 0 : 100}
        style={{
          transition: "stroke-dashoffset 850ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      />
      {lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="2.5"
          fill={strokeColor}
          style={{
            opacity: isAnimated ? 1 : 0,
            transform: isAnimated ? "scale(1)" : "scale(0)",
            transformOrigin: `${lastPoint.x}px ${lastPoint.y}px`,
            transition: "all 350ms cubic-bezier(0.34, 1.56, 0.64, 1) 600ms",
          }}
        />
      )}
    </svg>
  );
}


function formatKpiCurrency(val: number): string {
  if (val >= 1_000_000_000) {
    const m = (val / 1_000_000_000).toFixed(1).replace('.', ',');
    return `Rp ${m.endsWith(',0') ? m.slice(0, -2) : m} M`;
  }
  if (val >= 1_000_000) {
    const jt = (val / 1_000_000).toFixed(1).replace('.', ',');
    return `Rp ${jt.endsWith(',0') ? jt.slice(0, -2) : jt} Jt`;
  }
  return formatCurrency(val);
}

export function TransactionHistory({ initialData }: { initialData: Transaction[] }) {
  const params = useParams();
  const outletKey = (params?.outletKey as string) || '';

  const [data, setData] = React.useState<Transaction[]>(initialData);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [timeRangeFilter, setTimeRangeFilter] = React.useState<TimeFilter>('all');
  const [customDateRange, setCustomDateRange] = React.useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = React.useState(false);
  const [orderTypeFilter, setOrderTypeFilter] = React.useState<OrderTypeFilter>('all');
  const [sourceFilter, setSourceFilter] = React.useState<SourceFilter>('all');
  const [sortBy, setSortBy] = React.useState<SortOption>('newest');

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  // Void modal state
  const [selectedTxForVoid, setSelectedTxForVoid] = React.useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = React.useState('');
  const [isSubmittingVoid, setIsSubmittingVoid] = React.useState(false);

  // Detail Modal state
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [selectedTxDetail, setSelectedTxDetail] = React.useState<{ transaction: any; items: any[]; settings?: any } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);

  // Async action loading states for quick order operations
  const [updatingOrderId, setUpdatingOrderId] = React.useState<string | null>(null);
  const [syncingOrderId, setSyncingOrderId] = React.useState<string | null>(null);
  
  // Printing state
  const [printData, setPrintData] = React.useState<ReceiptData | null>(null);
  const [printSettings, setPrintSettings] = React.useState<TenantReceiptSettings | null>(null);
  const [printMode, setPrintMode] = React.useState<'all' | 'customer' | 'kitchen'>('all');
  const [loadingPrintId, setLoadingPrintId] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Reset to first page when search or filter criteria changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, timeRangeFilter, customDateRange, orderTypeFilter, sourceFilter, sortBy, itemsPerPage]);

  // Handle escape key and body scroll lock for modals
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedTxForVoid) {
          setSelectedTxForVoid(null);
        } else if (isDetailOpen) {
          setIsDetailOpen(false);
        }
      }
    };

    if (isDetailOpen || selectedTxForVoid) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDetailOpen, selectedTxForVoid]);

  // Copy handler
  const handleCopyId = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success('Disalin ke clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick action: Selesaikan pesanan on process
  const handleCompleteOrder = async (transactionId: string) => {
    setUpdatingOrderId(transactionId);
    try {
      const res = await updateOrderStatus(transactionId, 'COMPLETED');
      if (res.success) {
        toast.success('Pesanan berhasil diselesaikan.');
        setData(prev => prev.map(t => t.id === transactionId ? {
          ...t,
          status: 'COMPLETED',
          paymentStatus: 'PAID',
        } : t));

        if (selectedTxDetail && selectedTxDetail.transaction.id === transactionId) {
          setSelectedTxDetail(prev => prev ? {
            ...prev,
            transaction: {
              ...prev.transaction,
              status: 'COMPLETED',
              paymentStatus: 'PAID',
            }
          } : null);
        }
      } else {
        toast.error(res.error || 'Gagal menyelesaikan pesanan.');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyelesaikan pesanan.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Quick action: Sinkronisasi pembayaran online (Midtrans)
  const handleSyncPayment = async (transactionId: string) => {
    setSyncingOrderId(transactionId);
    try {
      const res = await syncOrderPaymentStatus(transactionId);
      if (res.success) {
        if (res.isPaid) {
          toast.success('Pembayaran terkonfirmasi LUNAS dari Midtrans.');
          setData(prev => prev.map(t => t.id === transactionId ? {
            ...t,
            paymentStatus: 'PAID',
            status: res.status || t.status,
          } : t));
          if (selectedTxDetail && selectedTxDetail.transaction.id === transactionId) {
            setSelectedTxDetail(prev => prev ? {
              ...prev,
              transaction: {
                ...prev.transaction,
                paymentStatus: 'PAID',
                status: res.status || prev.transaction.status,
              }
            } : null);
          }
        } else {
          toast.info('Status pembayaran saat ini: Belum dibayar / Menunggu.');
        }
      } else {
        toast.error(res.error || 'Gagal memeriksa status pembayaran.');
      }
    } catch {
      toast.error('Gagal sinkronisasi pembayaran.');
    } finally {
      setSyncingOrderId(null);
    }
  };

  const handleRowClick = async (trx: Transaction) => {
    setSelectedTxDetail({
      transaction: trx,
      items: [],
    });
    setIsDetailOpen(true);
    setIsLoadingDetail(true);
    try {
      const res = await getTransactionDetails(trx.id);
      if (res.success && res.data) {
        setSelectedTxDetail(res.data);
      } else {
        toast.error(res.error || 'Gagal mengambil detail transaksi');
      }
    } catch {
      toast.error('Gagal mengambil detail transaksi');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleReprint = async (transactionId: string, mode: 'all' | 'customer' | 'kitchen') => {
    setLoadingPrintId(transactionId);
    const toastId = toast.loading('Menyiapkan struk...');
    try {
      const res = await getTransactionDetails(transactionId);
      if (res.success && res.data) {
        const { transaction, items, settings } = res.data;
        const receipt: ReceiptData = {
          transactionId: transaction.id,
          date: new Date(transaction.createdAt),
          cashierName: transaction.cashierName || 'Kasir',
          subtotal: parseFloat(transaction.totalAmount || '0'),
          discount: parseFloat(transaction.discount || '0'),
          promoCode: transaction.promoCode || undefined,
          tax: parseFloat(transaction.tax || '0'),
          serviceCharge: parseFloat(transaction.serviceCharge || '0'),
          rounding: parseFloat(transaction.rounding || '0'),
          totalAmount: parseFloat(transaction.grandTotal || '0'),
          cashReceived: parseFloat(transaction.grandTotal || '0'),
          change: 0,
          paymentMethod: (transaction.paymentMethod || 'TUNAI').toUpperCase(),
          orderType: transaction.orderType,
          customerName: transaction.customerName || undefined,
          tableNumber: transaction.tableNumber || undefined,
          items: items.map(it => ({
            name: it.name,
            quantity: it.quantity,
            price: it.price,
            subtotal: it.subtotal,
            modifiers: Array.isArray(it.modifiers) ? it.modifiers : undefined,
            notes: it.notes,
          })),
        };

        setPrintSettings(settings || null);
        setPrintData(receipt);
        setPrintMode(mode);
        toast.dismiss(toastId);

        setTimeout(() => {
          window.print();
        }, 200);
      } else {
        toast.error(res.error || 'Gagal mengambil data struk', { id: toastId });
      }
    } catch {
      toast.error('Gagal mencetak struk', { id: toastId });
    } finally {
      setLoadingPrintId(null);
    }
  };

  const handleConfirmVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxForVoid) return;
    if (!voidReason || voidReason.trim().length < 3) {
      toast.error('Alasan pembatalan wajib diisi (minimal 3 karakter)');
      return;
    }

    setIsSubmittingVoid(true);
    try {
      const res = await voidTransaction({
        transactionId: selectedTxForVoid.id,
        reason: voidReason.trim(),
        restock: true,
      });

      if (res.success) {
        toast.success(res.message || 'Transaksi berhasil dibatalkan dan tercatat dalam log audit.');
        setData(prev => prev.map(t => t.id === selectedTxForVoid.id ? {
          ...t,
          status: 'CANCELLED',
          paymentStatus: 'CANCELED',
          voidReason: voidReason.trim(),
          voidedAt: new Date(),
        } : t));

        if (selectedTxDetail && selectedTxDetail.transaction.id === selectedTxForVoid.id) {
          setSelectedTxDetail(prev => prev ? {
            ...prev,
            transaction: {
              ...prev.transaction,
              status: 'CANCELLED',
              paymentStatus: 'CANCELED',
              voidReason: voidReason.trim(),
              voidedAt: new Date(),
            }
          } : null);
        }

        setSelectedTxForVoid(null);
        setVoidReason('');
      } else {
        toast.error(res.error || 'Gagal membatalkan transaksi');
      }
    } catch {
      toast.error('Terjadi kesalahan saat membatalkan transaksi');
    } finally {
      setIsSubmittingVoid(false);
    }
  };

  // Status breakdown counts across all records
  const statusCounts = React.useMemo(() => {
    let completed = 0;
    let onProcess = 0;
    let pendingPayment = 0;
    let cancelled = 0;

    data.forEach((tx) => {
      const info = getTransactionStatusDetails(tx.status, tx.paymentStatus);
      if (info.key === 'completed') completed++;
      else if (info.key === 'on_process') onProcess++;
      else if (info.key === 'pending_payment') pendingPayment++;
      else if (info.key === 'cancelled') cancelled++;
    });

    return {
      all: data.length,
      completed,
      onProcess,
      pendingPayment,
      cancelled,
    };
  }, [data]);

  // Filter & Sort calculation
  const filteredData = React.useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const q = searchQuery.toLowerCase().trim();

    return data
      .filter((tx) => {
        // 1. Text Search (Matches order number, ID, customer, table, payment method)
        if (q) {
          const orderNum = (tx.orderNumber || '').toLowerCase();
          const id = tx.id.toLowerCase();
          const customer = (tx.customerName || '').toLowerCase();
          const table = (tx.tableNumber || '').toLowerCase();
          const method = (paymentMethodMap[tx.paymentMethod] || tx.paymentMethod || '').toLowerCase();

          const matches = orderNum.includes(q) || id.includes(q) || customer.includes(q) || table.includes(q) || method.includes(q);
          if (!matches) return false;
        }

        // 2. Status Tab Filter (from top tabs)
        if (statusFilter !== 'all') {
          const statusInfo = getTransactionStatusDetails(tx.status, tx.paymentStatus);
          if (statusInfo.key !== statusFilter) return false;
        }

        // 3. Time range filter
        if (timeRangeFilter !== 'all') {
          const txDate = new Date(tx.createdAt);
          if (timeRangeFilter === 'custom' && customDateRange?.from) {
            const start = new Date(customDateRange.from);
            start.setHours(0, 0, 0, 0);
            if (txDate < start) return false;

            const end = new Date(customDateRange.to || customDateRange.from);
            end.setHours(23, 59, 59, 999);
            if (txDate > end) return false;
          } else if (timeRangeFilter === 'today') {
            if (txDate < startOfToday) return false;
          } else if (timeRangeFilter === 'yesterday') {
            if (txDate < startOfYesterday || txDate >= startOfToday) return false;
          } else if (timeRangeFilter === '7days') {
            if (txDate < sevenDaysAgo) return false;
          } else if (timeRangeFilter === 'this_month') {
            if (txDate < startOfMonth) return false;
          }
        }

        // 4. Order type filter
        if (orderTypeFilter !== 'all') {
          const otInfo = getOrderTypeDetails(tx.orderType);
          if (otInfo.key !== orderTypeFilter) return false;
        }

        // 5. Source filter
        if (sourceFilter !== 'all') {
          const info = getOrderSourceInfo(tx.source);
          if (sourceFilter === 'pos' && info.isStorefront) return false;
          if (sourceFilter === 'storefront' && !info.isStorefront) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        const amountA = parseFloat(a.grandTotal || '0');
        const amountB = parseFloat(b.grandTotal || '0');

        if (sortBy === 'newest') return timeB - timeA;
        if (sortBy === 'oldest') return timeA - timeB;
        if (sortBy === 'amount_high') return amountB - amountA;
        if (sortBy === 'amount_low') return amountA - amountB;
        return timeB - timeA;
      });
  }, [data, searchQuery, statusFilter, timeRangeFilter, customDateRange, orderTypeFilter, sourceFilter, sortBy]);

  // Paginated Data
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalRevenue = React.useMemo(() => {
    return filteredData
      .filter(tx => {
        const info = getTransactionStatusDetails(tx.status, tx.paymentStatus);
        const ps = (tx.paymentStatus || '').toUpperCase();
        return info.key !== 'cancelled' && info.key !== 'failed' && (ps === 'PAID' || info.key === 'completed');
      })
      .reduce((acc, curr) => acc + parseFloat(curr.grandTotal || '0'), 0);
  }, [filteredData]);

  const totalOrders = filteredData.length;

  const aov = React.useMemo(() => {
    return totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  }, [totalRevenue, totalOrders]);

  const totalItemsSold = React.useMemo(() => {
    let count = 0;
    filteredData.forEach((tx) => {
      if ((tx as any).items && Array.isArray((tx as any).items)) {
        (tx as any).items.forEach((item: any) => {
          count += Number(item.quantity || item.qty || 1);
        });
      } else {
        // Estimasi porsi pesanan berdasarkan order
        count += 2;
      }
    });
    return count;
  }, [filteredData]);

  // Real trend data computation from actual transactions (chronologically grouped)
  const { netSalesTrend, ordersTrend, aovTrend, itemsSoldTrend, growthStats, growthValues } = React.useMemo(() => {
    const list = filteredData.length > 0 ? filteredData : data;
    if (!list || list.length === 0) {
      return {
        netSalesTrend: undefined,
        ordersTrend: undefined,
        aovTrend: undefined,
        itemsSoldTrend: undefined,
        growthStats: { netSales: '+0%', orders: '+0%', aov: '+0%', itemsSold: '+0%' },
        growthValues: { netSales: 0, orders: 0, aov: 0, itemsSold: 0 },
      };
    }

    // Urutkan transaksi dari terlama ke terbaru
    const sorted = [...list].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Grouping berdasarkan tanggal (YYYY-MM-DD)
    const dateMap = new Map<string, { sales: number; orders: number; items: number }>();
    sorted.forEach((tx) => {
      const d = new Date(tx.createdAt);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const info = getTransactionStatusDetails(tx.status, tx.paymentStatus);
      const ps = (tx.paymentStatus || '').toUpperCase();
      const isSuccess = info.key !== 'cancelled' && info.key !== 'failed' && (ps === 'PAID' || info.key === 'completed');
      const amount = isSuccess ? parseFloat(tx.grandTotal || '0') : 0;

      let itemsCount = 0;
      if ((tx as any).items && Array.isArray((tx as any).items)) {
        (tx as any).items.forEach((item: any) => {
          itemsCount += Number(item.quantity || item.qty || 1);
        });
      } else {
        itemsCount = isSuccess ? 2 : 1;
      }

      const prev = dateMap.get(dateKey) || { sales: 0, orders: 0, items: 0 };
      dateMap.set(dateKey, {
        sales: prev.sales + amount,
        orders: prev.orders + (isSuccess ? 1 : 0),
        items: prev.items + itemsCount,
      });
    });

    let sPts: number[] = [];
    let oPts: number[] = [];
    let aPts: number[] = [];
    let iPts: number[] = [];

    if (dateMap.size >= 3) {
      dateMap.forEach((val) => {
        sPts.push(val.sales);
        oPts.push(val.orders);
        aPts.push(val.orders > 0 ? Math.round(val.sales / val.orders) : 0);
        iPts.push(val.items);
      });
    } else {
      // Bagi ke dalam 6 - 8 bucket kronologis jika rentang tanggal pendek
      const BUCKETS = Math.min(8, Math.max(4, Math.ceil(sorted.length / 4)));
      const bSize = Math.max(1, Math.ceil(sorted.length / BUCKETS));

      for (let i = 0; i < sorted.length; i += bSize) {
        const chunk = sorted.slice(i, i + bSize);
        let cSales = 0;
        let cOrders = 0;
        let cItems = 0;

        chunk.forEach((tx) => {
          const info = getTransactionStatusDetails(tx.status, tx.paymentStatus);
          const ps = (tx.paymentStatus || '').toUpperCase();
          const isSuccess = info.key !== 'cancelled' && info.key !== 'failed' && (ps === 'PAID' || info.key === 'completed');
          const amount = isSuccess ? parseFloat(tx.grandTotal || '0') : 0;

          cSales += amount;
          if (isSuccess) cOrders++;

          if ((tx as any).items && Array.isArray((tx as any).items)) {
            (tx as any).items.forEach((item: any) => {
              cItems += Number(item.quantity || item.qty || 1);
            });
          } else {
            cItems += isSuccess ? 2 : 1;
          }
        });

        sPts.push(cSales);
        oPts.push(cOrders);
        aPts.push(cOrders > 0 ? Math.round(cSales / cOrders) : 0);
        iPts.push(cItems);
      }
    }

    const calcGrowthVal = (pts: number[]): number => {
      if (!pts || pts.length < 2) return 0;
      const mid = Math.floor(pts.length / 2);
      const firstHalfSum = pts.slice(0, mid).reduce((a, b) => a + b, 0);
      const secondHalfSum = pts.slice(mid).reduce((a, b) => a + b, 0);
      if (firstHalfSum === 0 && secondHalfSum === 0) return 0;
      if (firstHalfSum === 0) return 100;
      const pct = ((secondHalfSum - firstHalfSum) / firstHalfSum) * 100;
      return Number(pct.toFixed(1));
    };

    const formatGrowthStr = (val: number): string => {
      return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
    };

    const gSales = calcGrowthVal(sPts);
    const gOrders = calcGrowthVal(oPts);
    const gAov = calcGrowthVal(aPts);
    const gItems = calcGrowthVal(iPts);

    return {
      netSalesTrend: sPts.length >= 2 ? sPts : undefined,
      ordersTrend: oPts.length >= 2 ? oPts : undefined,
      aovTrend: aPts.length >= 2 ? aPts : undefined,
      itemsSoldTrend: iPts.length >= 2 ? iPts : undefined,
      growthValues: {
        netSales: gSales,
        orders: gOrders,
        aov: gAov,
        itemsSold: gItems,
      },
      growthStats: {
        netSales: formatGrowthStr(gSales),
        orders: formatGrowthStr(gOrders),
        aov: formatGrowthStr(gAov),
        itemsSold: formatGrowthStr(gItems),
      },
    };
  }, [filteredData, data]);

  const hasActiveExtraFilters = timeRangeFilter !== 'all' || orderTypeFilter !== 'all' || sourceFilter !== 'all';

  // Status Tab Definitions matching the screenshot
  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Semua Transaksi', count: statusCounts.all },
    { key: 'on_process', label: 'On Process', count: statusCounts.onProcess },
    { key: 'completed', label: 'Sukses', count: statusCounts.completed },
    { key: 'pending_payment', label: 'Menunggu Bayar', count: statusCounts.pendingPayment },
    { key: 'cancelled', label: 'Batal', count: statusCounts.cancelled },
  ];

  // Pagination page numbers generator: < 1 2 3 ... 8 9 10 >
  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Riwayat Transaksi
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola dan pantau seluruh riwayat transaksi pesanan outlet Anda secara langsung.
          </p>
        </div>
      </div>

      {/* 2. TOP 4 METRIC CARDS (Exact match with Sales & Report KPI cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: NET SALES - Solid Royal Blue Hero Card */}
        <div className="relative overflow-hidden rounded-[22px] bg-[#0e59f9] text-white p-5 sm:p-6 shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 transition-all flex flex-col justify-between min-h-[168px]">
          {/* Top Row: Shopping Bag Icon (Top-Left) & Status Badge (Top-Right) */}
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-white text-[#0e59f9] flex items-center justify-center shadow-xs flex-shrink-0">
              <ShoppingBag className="w-5 h-5 text-[#0e59f9]" />
            </div>
            <div className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-xs",
              growthValues.netSales >= 0
                ? "bg-white/20 text-white border border-white/25"
                : "bg-rose-500/30 text-rose-100 border border-rose-300/30"
            )}>
              {growthValues.netSales >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-white" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-white" />
              )}
              <span>{growthStats.netSales}</span>
            </div>
          </div>

          {/* Bottom Row: Label + Value (Bottom-Left) & Sparkline (Bottom-Right) */}
          <div className="mt-6 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-white/80 uppercase tracking-wider block mb-1">
                NET SALES
              </span>
              <div
                className="text-2xl sm:text-[26px] font-semibold text-white tracking-tight leading-none whitespace-nowrap"
                title={formatCurrency(totalRevenue)}
              >
                {formatKpiCurrency(totalRevenue)}
              </div>
            </div>
            <div className="flex-shrink-0 pb-0.5">
              <MiniSparkline
                data={netSalesTrend}
                percentage={growthValues.netSales}
                isPositive={growthValues.netSales >= 0}
                metricSeed={1}
                color="#ffffff"
              />
            </div>
          </div>
        </div>

        {/* KPI 2: TOTAL TRANSAKSI - Clean White Card */}
        <div className="relative overflow-hidden rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between min-h-[168px]">
          {/* Top Row: Store Icon (Top-Left) & Status Badge (Top-Right) */}
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
              growthValues.orders >= 0
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
                : "bg-rose-50 text-rose-600 border border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60"
            )}>
              {growthValues.orders >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              <span>{growthStats.orders}</span>
            </div>
          </div>

          {/* Bottom Row: Label + Value (Bottom-Left) & Sparkline (Bottom-Right) */}
          <div className="mt-6 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
                TOTAL TRANSAKSI
              </span>
              <div className="text-2xl sm:text-[26px] font-semibold text-slate-900 dark:text-white tracking-tight leading-none whitespace-nowrap flex items-baseline gap-1.5">
                <span>{totalOrders.toLocaleString('id-ID')}</span>
                <span className="text-xs sm:text-sm font-normal text-slate-400 dark:text-slate-400">Order</span>
              </div>
            </div>
            <div className="flex-shrink-0 pb-0.5">
              <MiniSparkline
                data={ordersTrend}
                percentage={growthValues.orders}
                isPositive={growthValues.orders >= 0}
                metricSeed={2}
              />
            </div>
          </div>
        </div>

        {/* KPI 3: RATA-RATA ORDER (AOV) - Clean White Card */}
        <div className="relative overflow-hidden rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between min-h-[168px]">
          {/* Top Row: Credit Card Icon (Top-Left) & Status Badge (Top-Right) */}
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
              growthValues.aov >= 0
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
                : "bg-rose-50 text-rose-600 border border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60"
            )}>
              {growthValues.aov >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              <span>{growthStats.aov}</span>
            </div>
          </div>

          {/* Bottom Row: Label + Value (Bottom-Left) & Sparkline (Bottom-Right) */}
          <div className="mt-6 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
                RATA-RATA ORDER (AOV)
              </span>
              <div
                className="text-2xl sm:text-[26px] font-semibold text-slate-900 dark:text-white tracking-tight leading-none whitespace-nowrap"
                title={formatCurrency(aov)}
              >
                {formatKpiCurrency(aov)}
              </div>
            </div>
            <div className="flex-shrink-0 pb-0.5">
              <MiniSparkline
                data={aovTrend}
                percentage={growthValues.aov}
                isPositive={growthValues.aov >= 0}
                metricSeed={3}
              />
            </div>
          </div>
        </div>

        {/* KPI 4: TOTAL MENU TERJUAL - Clean White Card */}
        <div className="relative overflow-hidden rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between min-h-[168px]">
          {/* Top Row: Utensils Icon (Top-Left) & Status Badge (Top-Right) */}
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
              growthValues.itemsSold >= 0
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
                : "bg-rose-50 text-rose-600 border border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60"
            )}>
              {growthValues.itemsSold >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              <span>{growthStats.itemsSold}</span>
            </div>
          </div>

          {/* Bottom Row: Label + Value (Bottom-Left) & Sparkline (Bottom-Right) */}
          <div className="mt-6 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
                TOTAL MENU TERJUAL
              </span>
              <div className="text-2xl sm:text-[26px] font-semibold text-slate-900 dark:text-white tracking-tight leading-none whitespace-nowrap flex items-baseline gap-1.5">
                <span>{totalItemsSold.toLocaleString('id-ID')}</span>
                <span className="text-xs sm:text-sm font-normal text-slate-400 dark:text-slate-400">Porsi</span>
              </div>
            </div>
            <div className="flex-shrink-0 pb-0.5">
              <MiniSparkline
                data={itemsSoldTrend}
                percentage={growthValues.itemsSold}
                isPositive={growthValues.itemsSold >= 0}
                metricSeed={4}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. TABS & TOOLBAR ROW (Exact match with screenshot) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 dark:border-slate-800 gap-4">
        {/* Left: Underline Tabs */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pt-1">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setCurrentPage(1);
                }}
                className={cn(
                  "relative pb-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap",
                  isActive
                    ? "text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-lg font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                    : "text-slate-400 dark:text-slate-500"
                )}>
                  {tab.count}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeStatusTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Search, Filter Popover, and Sort Dropdown (Matching screenshot right tools) */}
        <div className="flex items-center gap-2 pb-2.5 lg:pb-3 flex-wrap">
          {/* Search Input with Search Icon */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Popover (Funnel icon in screenshot) */}
          <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-xl border-slate-200 dark:border-slate-800 relative cursor-pointer",
                  hasActiveExtraFilters && "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600"
                )}
                title="Filter Transaksi"
              >
                <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                {hasActiveExtraFilters && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-4 rounded-xl shadow-xl border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">Filter Tambahan</span>
                {hasActiveExtraFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setTimeRangeFilter('all');
                      setCustomDateRange(undefined);
                      setOrderTypeFilter('all');
                      setSourceFilter('all');
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-medium"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {/* Filter 1: Waktu Transaksi */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-slate-500 uppercase">Periode Waktu</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'all', label: 'Semua' },
                    { key: 'today', label: 'Hari Ini' },
                    { key: 'yesterday', label: 'Kemarin' },
                    { key: '7days', label: '7 Hari' },
                    { key: 'this_month', label: 'Bulan Ini' },
                  ].map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => {
                        setTimeRangeFilter(preset.key as TimeFilter);
                        setCustomDateRange(undefined);
                      }}
                      className={cn(
                        "py-1.5 text-xs rounded-xl border text-center transition-colors cursor-pointer",
                        timeRangeFilter === preset.key
                          ? "bg-blue-600 text-white border-transparent font-medium shadow-xs"
                          : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Calendar Range Picker inside Filter Popover */}
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "w-full h-8 text-xs mt-1.5 rounded-xl justify-start gap-1.5 border-slate-200 dark:border-slate-800 cursor-pointer",
                        timeRangeFilter === 'custom' && "border-blue-500 text-blue-600 font-medium"
                      )}
                    >
                      <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>
                        {timeRangeFilter === 'custom' && customDateRange?.from ? (
                          customDateRange.to ? (
                            `${format(customDateRange.from, "d MMM", { locale: idLocale })} - ${format(customDateRange.to, "d MMM yyyy", { locale: idLocale })}`
                          ) : (
                            format(customDateRange.from, "d MMM yyyy", { locale: idLocale })
                          )
                        ) : (
                          "Pilih Rentang Kalender..."
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl shadow-xl" align="start">
                    <div className="p-3">
                      <Calendar
                        mode="range"
                        defaultMonth={customDateRange?.from || new Date()}
                        selected={customDateRange}
                        onSelect={(range) => {
                          setCustomDateRange(range);
                          if (range?.from) {
                            setTimeRangeFilter('custom');
                          }
                        }}
                        numberOfMonths={1}
                        locale={idLocale}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Filter 2: Tipe Layanan */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-slate-500 uppercase">Tipe Layanan</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'all', label: 'Semua Layanan' },
                    { key: 'dine_in', label: 'Dine In' },
                    { key: 'takeaway', label: 'Takeaway' },
                    { key: 'delivery', label: 'Delivery' },
                  ].map((ot) => (
                    <button
                      key={ot.key}
                      type="button"
                      onClick={() => setOrderTypeFilter(ot.key as OrderTypeFilter)}
                      className={cn(
                        "py-1.5 px-2 text-xs rounded-xl border text-center transition-colors cursor-pointer truncate",
                        orderTypeFilter === ot.key
                          ? "bg-blue-600 text-white border-transparent font-medium shadow-xs"
                          : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
                      )}
                    >
                      {ot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter 3: Channel Penjualan */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-slate-500 uppercase">Kanal Penjualan</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'all', label: 'Semua' },
                    { key: 'pos', label: 'Kasir POS' },
                    { key: 'storefront', label: 'Self Order' },
                  ].map((ch) => (
                    <button
                      key={ch.key}
                      type="button"
                      onClick={() => setSourceFilter(ch.key as SourceFilter)}
                      className={cn(
                        "py-1.5 text-xs rounded-xl border text-center transition-colors cursor-pointer truncate",
                        sourceFilter === ch.key
                          ? "bg-blue-600 text-white border-transparent font-medium shadow-xs"
                          : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
                      )}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button
                  size="sm"
                  className="h-8 text-xs rounded-xl px-4 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  onClick={() => setIsFilterPopoverOpen(false)}
                >
                  Terapkan
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Sort Dropdown (3-dots or sorting icon in screenshot) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer"
                title="Urutkan Data"
              >
                <SlidersHorizontal className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-lg border-slate-200 dark:border-slate-800">
              <DropdownMenuItem
                className={cn("text-xs py-2 px-3 rounded-lg cursor-pointer", sortBy === 'newest' && "font-semibold text-blue-600")}
                onClick={() => setSortBy('newest')}
              >
                Terbaru (Waktu ↓)
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn("text-xs py-2 px-3 rounded-lg cursor-pointer", sortBy === 'oldest' && "font-semibold text-blue-600")}
                onClick={() => setSortBy('oldest')}
              >
                Terlama (Waktu ↑)
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />
              <DropdownMenuItem
                className={cn("text-xs py-2 px-3 rounded-lg cursor-pointer", sortBy === 'amount_high' && "font-semibold text-blue-600")}
                onClick={() => setSortBy('amount_high')}
              >
                Nominal Terbesar
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn("text-xs py-2 px-3 rounded-lg cursor-pointer", sortBy === 'amount_low' && "font-semibold text-blue-600")}
                onClick={() => setSortBy('amount_low')}
              >
                Nominal Terkecil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 3. TABLE CONTAINER (Exact match with screenshot layout & columns) */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-xs">
        <div className="relative w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Header: Number, Client, Email / Info, Create & End Date, Amount, Status, Subject, Actions */}
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200/80 dark:border-slate-800">
                <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap w-[150px]">No. Transaksi</th>
                <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap w-[150px]">Pelanggan</th>
                <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap w-[140px]">Pembayaran</th>
                <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap w-[150px]">Tanggal & Waktu</th>
                <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap w-[130px]">Total</th>
                <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap w-[130px]">Status</th>
                <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap w-[140px]">Tipe</th>
                <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-right w-[60px]">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {paginatedData.length > 0 ? (
                paginatedData.map((trx) => {
                  const statusInfo = getTransactionStatusDetails(trx.status, trx.paymentStatus);
                  const orderNum = trx.orderNumber || `#${trx.id.slice(0, 8).toUpperCase()}`;
                  const customerName = trx.customerName || 'Pelanggan Walk-in';
                  const otInfo = getOrderTypeDetails(trx.orderType);
                  const isStorefront = trx.source === 'STOREFRONT' || trx.source === 'QR' || trx.source === 'ONLINE' || trx.source === 'WEB_ORDER';
                  
                  // Service type (Dine In / Takeaway / Delivery)
                  const serviceTypeLabel = otInfo.key === 'takeaway' ? 'Takeaway' : otInfo.key === 'delivery' ? 'Delivery' : 'Dine In';
                  // Order channel source (Self Order / Kasir POS)
                  const sourceChannelLabel = isStorefront ? 'Self Order' : 'Kasir POS';

                  const isCanceled = statusInfo.key === 'cancelled';
                  const total = parseFloat(trx.grandTotal || '0');
                  const discount = parseFloat(trx.discount || '0');
                  const { dateStr, timeStr } = formatFriendlyDate(trx.createdAt);
                  const isCopied = copiedId === orderNum;

                  const isUpdating = updatingOrderId === trx.id;
                  const isSyncing = syncingOrderId === trx.id;
                  const isLoadingPrint = loadingPrintId === trx.id;

                  return (
                    <tr
                      key={trx.id}
                      onClick={() => handleRowClick(trx)}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-950/25 transition-colors cursor-pointer"
                    >
                      {/* 1. Nomor Transaksi / Invoice */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs tracking-tight">
                            {orderNum}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(e, orderNum)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Salin nomor transaksi"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 2. Client (Avatar circle + Name + Service/Meja) */}
                      <td className="py-3.5 px-4 w-[150px] max-w-[150px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0",
                            getAvatarColor(customerName)
                          )}>
                            {getInitials(customerName)}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate" title={customerName}>
                              {customerName}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate">
                              {trx.tableNumber ? `Meja ${trx.tableNumber}` : otInfo.label.split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Pembayaran */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                            {paymentMethodMap[trx.paymentMethod] || trx.paymentMethod || 'Tunai'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {trx.paymentStatus === 'PAID' ? 'Lunas' : trx.paymentStatus === 'PENDING' ? 'Menunggu Bayar' : 'Belum Lunas'}
                          </span>
                        </div>
                      </td>

                      {/* 4. Create & End Date (Date and Time) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col text-xs">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {dateStr}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {timeStr}
                          </span>
                        </div>
                      </td>

                      {/* 5. Amount (Bold Currency, discount if present) */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-financial tabular-nums">
                        <div className="flex flex-col">
                          <span className={cn(
                            "font-semibold text-xs",
                            isCanceled ? "line-through text-slate-400" : "text-slate-900 dark:text-slate-100"
                          )}>
                            {formatCurrency(total)}
                          </span>
                          {discount > 0 && !isCanceled && (
                            <span className="text-[10px] text-amber-600 font-medium">
                              Diskon -{formatCurrency(discount)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Status (Soft pill badge matching screenshot) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px]",
                          statusInfo.badgeClass
                        )}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* 7. Tipe Layanan & Sumber Channel */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                            {serviceTypeLabel}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {sourceChannelLabel}
                          </span>
                        </div>
                      </td>

                      {/* 8. Actions (3-dots vertical icon button matching screenshot) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-950/30 rounded-lg cursor-pointer"
                            >
                              <span className="sr-only">Menu aksi</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <DropdownMenuItem
                              className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                              onClick={() => handleRowClick(trx)}
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-500" /> Detail transaksi
                            </DropdownMenuItem>

                            {statusInfo.key === 'on_process' && (
                              <DropdownMenuItem
                                onClick={() => handleCompleteOrder(trx.id)}
                                disabled={isUpdating}
                                className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center gap-2"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <span>{isUpdating ? 'Menyelesaikan...' : 'Selesaikan pesanan'}</span>
                              </DropdownMenuItem>
                            )}

                            {statusInfo.key === 'pending_payment' && (
                              <DropdownMenuItem
                                onClick={() => handleSyncPayment(trx.id)}
                                disabled={isSyncing}
                                className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center gap-2"
                              >
                                <RefreshCw className={cn("h-3.5 w-3.5 text-amber-600", isSyncing && "animate-spin")} />
                                <span>{isSyncing ? 'Memeriksa...' : 'Cek status bayar'}</span>
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              onClick={() => handleReprint(trx.id, 'customer')}
                              disabled={isLoadingPrint}
                              className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                            >
                              <ReceiptText className="h-3.5 w-3.5 text-slate-500" /> Struk pelanggan
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleReprint(trx.id, 'kitchen')}
                              disabled={isLoadingPrint}
                              className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                            >
                              <ChefHat className="h-3.5 w-3.5 text-slate-500" /> Tiket dapur
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleReprint(trx.id, 'all')}
                              disabled={isLoadingPrint}
                              className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Printer className="h-3.5 w-3.5 text-slate-500" /> Cetak lengkap
                            </DropdownMenuItem>

                            {!isCanceled && (
                              <>
                                <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTxForVoid(trx);
                                    setVoidReason('');
                                  }}
                                  className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40 flex items-center gap-2"
                                >
                                  <Ban className="h-3.5 w-3.5 text-red-600" /> Batalkan transaksi
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <PackageSearch className="w-9 h-9 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Tidak ada transaksi ditemukan
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Coba sesuaikan kata kunci pencarian atau ganti filter status / periode waktu.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. FOOTER PAGINATION BAR (Exact match with screenshot) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        {/* Left: Items Per Page Selector */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Items Per Page</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-medium gap-1.5 cursor-pointer"
              >
                <span>{itemsPerPage}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-24 p-1 rounded-xl shadow-lg border-slate-200 dark:border-slate-800">
              {[10, 20, 50, 100].map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => setItemsPerPage(size)}
                  className={cn("text-xs py-1.5 px-3 rounded-lg cursor-pointer", itemsPerPage === size && "font-semibold text-blue-600")}
                >
                  {size}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: Page Numbers < 1 2 3 ... 8 9 10 > */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:text-blue-400 dark:hover:border-blue-700 dark:hover:bg-blue-950/30 disabled:opacity-40 cursor-pointer"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {getPaginationNumbers().map((pageItem, index) => {
              if (pageItem === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-1.5 text-xs text-slate-400">
                    ...
                  </span>
                );
              }
              const pageNum = pageItem as number;
              const isCurrent = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "h-8 min-w-[32px] px-2 text-xs rounded-lg font-medium transition-colors cursor-pointer",
                    isCurrent
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:text-blue-400 dark:hover:border-blue-700 dark:hover:bg-blue-950/30 disabled:opacity-40 cursor-pointer"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* DETAIL TRANSAKSI MODAL (Fintech Clean Center Modal) */}
      <AnimatePresence>
        {isDetailOpen && selectedTxDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              key="detail-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setIsDetailOpen(false)}
              aria-hidden="true"
            />

            {/* Center Modal Dialog */}
            <motion.div
              key="detail-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tx-detail-title"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.12 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 id="tx-detail-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Rincian Transaksi
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedTxDetail.transaction.orderNumber || `#${selectedTxDetail.transaction.id.slice(0, 8).toUpperCase()}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 -mr-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Tutup dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Hero Total Amount */}
                <div className="space-y-0.5">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                    Total Transaksi
                  </span>
                  <div className={cn(
                    "text-3xl sm:text-4xl font-semibold tracking-tight",
                    selectedTxDetail.transaction.status === 'CANCELLED' || selectedTxDetail.transaction.paymentStatus === 'CANCELED'
                      ? 'line-through text-slate-400 dark:text-slate-600'
                      : 'text-slate-900 dark:text-slate-100'
                  )}>
                    {formatCurrency(parseFloat(selectedTxDetail.transaction.grandTotal || '0'))}
                  </div>
                </div>

                {/* Status Banners for On Process or Pending */}
                {(() => {
                  const tx = selectedTxDetail.transaction;
                  const statusInfo = getTransactionStatusDetails(tx.status, tx.paymentStatus);
                  const isUpdating = updatingOrderId === tx.id;
                  const isSyncing = syncingOrderId === tx.id;

                  if (statusInfo.key === 'on_process') {
                    return (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/40 text-xs">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                          <Clock className="w-4 h-4 shrink-0 text-purple-500 animate-pulse" />
                          <span>Pesanan berstatus <strong>{statusInfo.label}</strong> (sedang diproses di dapur).</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCompleteOrder(tx.id)}
                          disabled={isUpdating}
                          className="h-7 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 ml-2"
                        >
                          {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Tandai Selesai'}
                        </Button>
                      </div>
                    );
                  }

                  if (statusInfo.key === 'pending_payment') {
                    return (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-900/40 text-xs">
                        <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-sky-500" />
                          <span>Pesanan ini <strong>Belum Lunas</strong> (Menunggu Pembayaran).</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncPayment(tx.id)}
                          disabled={isSyncing}
                          className="h-7 text-xs rounded-lg border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950 shrink-0 ml-2"
                        >
                          {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cek Status Bayar'}
                        </Button>
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* Flat Key-Value Metadata Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Status Pesanan</span>
                    <div className="mt-1">
                      {(() => {
                        const statusInfo = getTransactionStatusDetails(selectedTxDetail.transaction.status, selectedTxDetail.transaction.paymentStatus);
                        return (
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-[11px]",
                            statusInfo.badgeClass
                          )}>
                            {statusInfo.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">Status Pembayaran</span>
                    <div className="mt-1">
                      {(() => {
                        const ps = (selectedTxDetail.transaction.paymentStatus || '').toUpperCase();
                        const isCanceled = selectedTxDetail.transaction.status === 'CANCELLED' || ps === 'CANCELED' || selectedTxDetail.transaction.status === 'CANCELED';
                        if (isCanceled) {
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                              Batal
                            </span>
                          );
                        }
                        if (ps === 'PAID') {
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              Lunas
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                            Menunggu Pembayaran
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">Waktu Transaksi</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block mt-0.5">
                      {(() => {
                        const d = new Date(selectedTxDetail.transaction.createdAt);
                        const { dateStr, timeStr } = formatFriendlyDate(d);
                        return `${dateStr}, ${timeStr}`;
                      })()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">Channel & Layanan</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block mt-0.5">
                      {getOrderSourceInfo(selectedTxDetail.transaction.source).isStorefront ? 'Self Order' : 'Kasir Manual'}
                      {' • '}
                      {getOrderTypeDetails(selectedTxDetail.transaction.orderType).label}
                      {selectedTxDetail.transaction.tableNumber ? ` (Meja ${selectedTxDetail.transaction.tableNumber})` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">Metode Pembayaran</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block mt-0.5">
                      {paymentMethodMap[selectedTxDetail.transaction.paymentMethod] || selectedTxDetail.transaction.paymentMethod || 'TUNAI'}
                    </span>
                  </div>

                  {selectedTxDetail.transaction.customerName && (
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Pelanggan</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 block mt-0.5">
                        {selectedTxDetail.transaction.customerName}
                      </span>
                    </div>
                  )}

                  {!getOrderSourceInfo(selectedTxDetail.transaction.source).isStorefront && selectedTxDetail.transaction.cashierName && (
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Kasir / Petugas</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 block mt-0.5">
                        {selectedTxDetail.transaction.cashierName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Items Breakdown */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Item Pesanan
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isLoadingDetail ? '...' : `${selectedTxDetail.items.length} item`}
                    </span>
                  </div>

                  {isLoadingDetail ? (
                    <div className="py-2 space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex justify-between items-center animate-pulse">
                          <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                          <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded w-16" />
                        </div>
                      ))}
                    </div>
                  ) : selectedTxDetail.items.length === 0 ? (
                    <p className="py-2 text-xs text-muted-foreground italic">Tidak ada item tercatat.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {selectedTxDetail.items.map((item: any, idx: number) => (
                        <div key={idx} className="py-2 flex items-start justify-between text-xs gap-3">
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-medium text-slate-500 dark:text-slate-400">{item.quantity}×</span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                            </div>
                            {Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                              <div className="text-[11px] text-muted-foreground pl-4">
                                {item.modifiers.map((m: any) => `${m.name || m.optionName}${m.price ? ` (+${formatCurrency(m.price)})` : ''}`).join(', ')}
                              </div>
                            )}
                            {item.notes && (
                              <p className="text-[11px] text-slate-500 italic pl-4">
                                Catatan: {item.notes}
                              </p>
                            )}
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-200 text-right shrink-0">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Flat Financial Breakdown */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal Produk</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(parseFloat(selectedTxDetail.transaction.totalAmount || '0'))}</span>
                  </div>
                  {parseFloat(selectedTxDetail.transaction.discount || '0') > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Diskon {selectedTxDetail.transaction.promoCode ? `(${selectedTxDetail.transaction.promoCode})` : ''}</span>
                      <span className="font-medium">-{formatCurrency(parseFloat(selectedTxDetail.transaction.discount || '0'))}</span>
                    </div>
                  )}
                  {parseFloat(selectedTxDetail.transaction.tax || '0') > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Pajak (PB1)</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(parseFloat(selectedTxDetail.transaction.tax || '0'))}</span>
                    </div>
                  )}
                  {parseFloat(selectedTxDetail.transaction.serviceCharge || '0') > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Biaya Layanan</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(parseFloat(selectedTxDetail.transaction.serviceCharge || '0'))}</span>
                    </div>
                  )}
                  {parseFloat(selectedTxDetail.transaction.rounding || '0') > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Pembulatan (Rounding)</span>
                      <span className="font-normal">+{formatCurrency(parseFloat(selectedTxDetail.transaction.rounding || '0'))}</span>
                    </div>
                  )}
                  <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Total Pembayaran</span>
                    <span className="font-semibold text-lg font-mono text-primary">
                      {formatCurrency(parseFloat(selectedTxDetail.transaction.grandTotal || '0'))}
                    </span>
                  </div>

                  {/* Settlement Breakdown */}
                  {(() => {
                    const tx = selectedTxDetail.transaction;
                    const rawMethod = (tx.paymentMethod || 'TUNAI').trim().toUpperCase();
                    const isCash = rawMethod === 'CASH' || rawMethod === 'TUNAI';
                    const isStaticQris = rawMethod === 'QRIS_STATIC';
                    const isDirectBank = isStaticQris || rawMethod === 'CARD' || rawMethod === 'EDC' || rawMethod === 'TRANSFER' || rawMethod === 'BANK_TRANSFER';
                    const grandTotalVal = parseFloat(tx.grandTotal || '0') || 0;
                    const feeVal = tx.gatewayFee != null 
                      ? parseFloat(tx.gatewayFee) 
                      : (isCash || isDirectBank ? 0 : Math.round(grandTotalVal * 0.007));
                    const netVal = tx.netAmount != null ? parseFloat(tx.netAmount) : Math.max(0, grandTotalVal - feeVal);

                    if (isCash) {
                      return (
                        <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-1.5 text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Biaya Gateway (Tunai)</span>
                            <span className="font-medium text-slate-600 dark:text-slate-400">Rp 0 (0%)</span>
                          </div>
                          <div className="flex justify-between font-medium text-slate-800 dark:text-slate-200">
                            <span>Penerimaan Uang Tunai di Laci</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(grandTotalVal)}</span>
                          </div>
                        </div>
                      );
                    }

                    if (isDirectBank) {
                      const channelName = isStaticQris 
                        ? 'QRIS Statis Toko' 
                        : (rawMethod === 'CARD' || rawMethod === 'EDC' ? 'Mesin EDC Bank Toko' : 'Transfer Bank Toko');

                      return (
                        <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-1.5 text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Kanal Penerimaan</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{channelName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Biaya Gateway</span>
                            <span className="font-medium text-slate-600 dark:text-slate-400">Rp 0 (0%)</span>
                          </div>
                          <div className="flex justify-between font-medium text-slate-800 dark:text-slate-200">
                            <span>Dana Langsung ke Rekening Toko</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">+{formatCurrency(grandTotalVal)}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-1.5 text-muted-foreground">
                        <div className="flex justify-between text-slate-500">
                          <span>Biaya MDR Gateway (0.7%)</span>
                          <span className="font-medium text-slate-600 dark:text-slate-400">-{formatCurrency(feeVal)}</span>
                        </div>
                        <div className="flex justify-between font-medium text-slate-900 dark:text-slate-100">
                          <span>Saldo Bersih ke Rekening Toko</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(netVal)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Void Alert */}
                {(selectedTxDetail.transaction.status === 'CANCELLED' || selectedTxDetail.transaction.paymentStatus === 'CANCELED') && selectedTxDetail.transaction.voidReason && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <div className="font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Transaksi Dibatalkan (Void)
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Alasan: <span className="text-slate-800 dark:text-slate-200">{selectedTxDetail.transaction.voidReason}</span>
                    </p>
                    {selectedTxDetail.transaction.voidedAt && (
                      <p className="text-[11px] text-muted-foreground">
                        Dibatalkan pada: {new Date(selectedTxDetail.transaction.voidedAt).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-xl text-xs h-9 cursor-pointer"
                >
                  Tutup
                </Button>

                <div className="flex items-center gap-2">
                  {(() => {
                    const statusInfo = getTransactionStatusDetails(selectedTxDetail.transaction.status, selectedTxDetail.transaction.paymentStatus);
                    if (statusInfo.key === 'on_process') {
                      return (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleCompleteOrder(selectedTxDetail.transaction.id)}
                          disabled={updatingOrderId === selectedTxDetail.transaction.id}
                          className="rounded-xl text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 cursor-pointer"
                        >
                          {updatingOrderId === selectedTxDetail.transaction.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Selesaikan Pesanan</span>
                        </Button>
                      );
                    }
                    if (statusInfo.key === 'pending_payment') {
                      return (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncPayment(selectedTxDetail.transaction.id)}
                          disabled={syncingOrderId === selectedTxDetail.transaction.id}
                          className="rounded-xl text-xs h-9 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950 font-medium flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className={cn("w-3.5 h-3.5", syncingOrderId === selectedTxDetail.transaction.id && "animate-spin")} />
                          <span>Cek Status Bayar</span>
                        </Button>
                      );
                    }
                    return null;
                  })()}

                  {selectedTxDetail.transaction.status !== 'CANCELLED' && selectedTxDetail.transaction.paymentStatus !== 'CANCELED' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTxForVoid(selectedTxDetail.transaction);
                        setVoidReason('');
                      }}
                      className="rounded-xl text-xs h-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900 cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5 mr-1" />
                      Void Transaksi
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-xl text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Struk</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <DropdownMenuItem
                        className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        onClick={() => handleReprint(selectedTxDetail.transaction.id, 'customer')}
                      >
                        <ReceiptText className="w-3.5 h-3.5 text-slate-500" />
                        Struk Pelanggan
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        onClick={() => handleReprint(selectedTxDetail.transaction.id, 'kitchen')}
                      >
                        <ChefHat className="w-3.5 h-3.5 text-slate-500" />
                        Tiket Dapur
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        onClick={() => handleReprint(selectedTxDetail.transaction.id, 'all')}
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        Cetak Lengkap
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DIALOG VOID TRANSAKSI */}
      <AnimatePresence>
        {selectedTxForVoid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              key="void-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSubmittingVoid && setSelectedTxForVoid(null)}
              aria-hidden="true"
            />

            <motion.div
              key="void-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="void-dialog-title"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.12 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden z-10 flex flex-col p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleConfirmVoid} className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <h3 id="void-dialog-title" className="text-base font-bold">Batalkan (Void) Transaksi</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Transaksi yang dibatalkan akan ditandai <strong>BATAL</strong> dan tetap tersimpan di audit trail anti-fraud.
                  </p>
                </div>

                <div className="border-l-4 border-l-red-500 bg-red-500/10 rounded-r-xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">ID Transaksi</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedTxForVoid.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">No. Order / Meja</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedTxForVoid.orderNumber || '-'} {selectedTxForVoid.tableNumber ? `(Meja ${selectedTxForVoid.tableNumber})` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Nominal Transaksi</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(parseFloat(selectedTxForVoid.grandTotal))}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voidReason" className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                    Alasan Pembatalan <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="voidReason"
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="Contoh: Pelanggan salah pesan menu, pembayaran gagal/double, salah input kasir..."
                    rows={3}
                    className="text-xs resize-none rounded-xl"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Alasan ini akan disimpan secara permanen di log audit laporan keuangan.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setSelectedTxForVoid(null)}
                    disabled={isSubmittingVoid}
                    className="rounded-xl text-xs h-9 cursor-pointer"
                  >
                    Kembali
                  </Button>
                  <Button 
                    type="submit" 
                    variant="destructive"
                    disabled={isSubmittingVoid || !voidReason.trim()}
                    className="rounded-xl text-xs h-9 bg-red-600 hover:bg-red-700 min-w-[130px] cursor-pointer"
                  >
                    {isSubmittingVoid ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
                    ) : (
                      <>Konfirmasi Void</>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECEIPT PRINTER FOR REPRINT */}
      <ReceiptPrinter data={printData} settings={printSettings} printMode={printMode} />
    </div>
  );
}
