"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { updateOrderStatus, updateOrderItemStatus, syncOrderPaymentStatus, bulkUpdateOrderStatus, getActiveOrders, getOrderByNumberForOutlet, confirmOrderPaymentAtCashier } from "@/lib/actions/orders";
import { toast } from "sonner";
import { 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  ChevronRight, 
  Check, 
  CheckCheck,
  CreditCard, 
  Search, 
  XCircle, 
  UtensilsCrossed, 
  Store, 
  ShoppingBag,
  User,
  Printer,
  ReceiptText,
  RefreshCw,
  Loader2,
  AlertCircle,
  Camera,
  Filter,
  ChevronDown
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { ReceiptPrinter, ReceiptData, TenantReceiptSettings } from "@/features/pos/components/receipt-printer";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { OrderCameraScannerDialog } from "./order-camera-scanner-dialog";
import { OrderPaymentModal } from "./order-payment-modal";
import { playScanSuccessBeep, playScanErrorBeep, playScanWarningBeep } from "@/lib/utils/sound";
import { formatPaymentMethodLabel } from "@/lib/utils/format";

import { cn } from "@/lib/utils";

type OrderItem = {
  id: string;
  transactionId: string;
  productId?: string;
  quantity: number;
  price?: string;
  productName: string;
  subtotal: string;
  modifiers?: any;
  notes?: string | null;
  isCompleted: boolean;
};

type Order = {
  id: string;
  tenantId: string;
  source?: string | null;
  cashierMembershipId?: string | null;
  totalAmount: string;
  discount?: string | null;
  tax?: string | null;
  serviceCharge?: string | null;
  platformFee?: string | null;
  rounding?: string | null;
  grandTotal: string;
  promoCode?: string | null;
  status: string;
  orderType: string;
  paymentMethod: string;
  paymentStatus: string;
  orderNumber: string | null;
  tableNumber: string | null;
  customerName: string | null;
  createdAt: Date;
  items: OrderItem[];
};

type OrderTypeFilter = "DINE_IN" | "TAKEAWAY" | "ONLINE";
const ALL_FILTER_TYPES: OrderTypeFilter[] = ["DINE_IN", "TAKEAWAY", "ONLINE"];

type KanbanBoardProps = {
  initialOrders: Order[];
  tenantId: string;
  cashierName?: string;
  receiptSettings?: TenantReceiptSettings;
};

function formatOrderTime(dateInput: Date | string): string {
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date) + " WIB";
  } catch {
    return "--:--";
  }
}

function formatOrderFullDate(dateInput: Date | string): string {
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  } catch {
    return "";
  }
}

function getTableBadge(order: { tableNumber?: string | null; orderType?: string | null }) {
  if (order.tableNumber) {
    const raw = order.tableNumber.trim();
    const cleaned = raw.replace(/^meja\s*/i, "").trim();
    if (/^\d+$/.test(cleaned)) {
      return {
        label: cleaned.padStart(2, "0"),
        isTable: true,
      };
    }
    return {
      label: cleaned.toUpperCase().substring(0, 3),
      isTable: true,
    };
  }
  const isTakeaway = order.orderType === "TAKE_AWAY" || order.orderType === "TAKEAWAY";
  if (isTakeaway) return { label: "TA", isTable: false };
  if (order.orderType === "ONLINE") return { label: "ON", isTable: false };
  return { label: "POS", isTable: false };
}

function formatElapsed(dateInput: Date | string): string {
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffMin < 1) return "Baru saja";
    if (diffMin < 60) return `${diffMin}m lalu`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}j lalu`;
    return formatOrderTime(date);
  } catch {
    return "";
  }
}

function formatTableLabel(tableNumber: string | null | undefined): string {
  if (!tableNumber) return "";
  const trimmed = tableNumber.trim();
  if (trimmed.toLowerCase().startsWith("meja")) {
    return trimmed;
  }
  return `Meja ${trimmed}`;
}

function getOrderSource(order: {
  source?: string | null;
  cashierMembershipId?: string | null;
  orderType?: string | null;
}) {
  const src = (order.source || "").toUpperCase();
  if (src === "POS" || src === "CASHIER") {
    return {
      label: "Kasir",
      isSelfOrder: false,
    };
  }
  if (
    src === "ONLINE" ||
    src === "STOREFRONT" ||
    src === "QR" ||
    src === "WEB_ORDER" ||
    src === "SELF_ORDER"
  ) {
    return {
      label: "Self Order",
      isSelfOrder: true,
    };
  }
  // Heuristic fallback: if no cashier assigned or orderType is ONLINE, it's a self order from storefront
  if (!order.cashierMembershipId || order.orderType === "ONLINE") {
    return {
      label: "Self Order",
      isSelfOrder: true,
    };
  }
  return {
    label: "Kasir",
    isSelfOrder: false,
  };
}

export function   KanbanBoard({ initialOrders, tenantId, cashierName = "Kasir", receiptSettings }: KanbanBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<OrderTypeFilter[]>(ALL_FILTER_TYPES);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);

  const isAllSelected = selectedTypes.length === ALL_FILTER_TYPES.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes([...ALL_FILTER_TYPES]);
    }
  };

  const toggleType = (type: OrderTypeFilter) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(prev => prev.filter(t => t !== type));
    } else {
      setSelectedTypes(prev => [...prev, type]);
    }
  };
  
  // Receipt printer states
  const [printData, setPrintData] = useState<ReceiptData | null>(null);
  const [printMode, setPrintMode] = useState<'all' | 'customer' | 'kitchen'>('customer');
  const [isPrinting, setIsPrinting] = useState(false);

  // Refresh & Bulk Advance States
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bulkModalState, setBulkModalState] = useState<{
    isOpen: boolean;
    currentStatus: string;
    nextStatus: string;
    currentStatusTitle: string;
    nextStatusTitle: string;
    orders: Order[];
  }>({
    isOpen: false,
    currentStatus: "",
    nextStatus: "",
    currentStatusTitle: "",
    nextStatusTitle: "",
    orders: [],
  });
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isSearchingScannedOrder, setIsSearchingScannedOrder] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const isUpdatingStatus = Boolean(updatingOrderId);

  const router = useRouter();

  // Helper to extract clean order number from raw text or full URL
  const parseOrderNumber = (text: string): string => {
    const clean = text.trim();
    try {
      if (clean.includes("order=")) {
        const url = clean.startsWith("http")
          ? new URL(clean)
          : new URL(`http://dummy.com${clean.startsWith("/") ? "" : "/"}${clean}`);
        const orderParam = url.searchParams.get("order");
        if (orderParam) return orderParam.replace(/^#/, "").trim();
      }
    } catch {
      // fallback if not a valid URL
    }
    return clean.replace(/^#/, "").trim();
  };

  // Handler for scans from both hardware barcode scanner and camera
  const handleScanCode = async (rawCode: string) => {
    const orderNum = parseOrderNumber(rawCode);
    if (!orderNum) return;

    // 1. Search in current memory state first
    const cleanTarget = orderNum.toUpperCase();
    const existingOrder = orders.find(
      (o) =>
        (o.orderNumber && o.orderNumber.replace(/^#/, "").toUpperCase() === cleanTarget) ||
        o.id === rawCode
    );

    if (existingOrder) {
      const isAlreadyPaid =
        existingOrder.paymentStatus === "PAID" ||
        (existingOrder.status && existingOrder.status !== "PENDING");

      if (isAlreadyPaid) {
        playScanWarningBeep();
        const statusMap: Record<string, string> = {
          NEW: "Pesanan Baru (Antrean Dapur)",
          PROCESSING: "Sedang Disiapkan di Dapur",
          READY: "Siap Disajikan",
          COMPLETED: "Pesanan Selesai",
          CANCELLED: "Pesanan Dibatalkan",
          FAILED: "Pesanan Gagal",
        };
        const statusLabel = statusMap[existingOrder.status] || existingOrder.status;
        toast.info(
          `Pesanan #${existingOrder.orderNumber?.replace(/^#/, "") || ""} sudah lunas & berstatus "${statusLabel}".`,
          {
            description: "Detail pesanan tidak dibuka untuk mencegah duplikasi pembayaran."
          }
        );
        return;
      }

      playScanSuccessBeep();
      setSelectedOrder(existingOrder);
      toast.success(`Pesanan #${existingOrder.orderNumber?.replace(/^#/, "") || ""} siap diproses pembayarannya`);
      return;
    }

    // 2. Fallback to server action if not yet in state
    setIsSearchingScannedOrder(true);
    try {
      const res = await getOrderByNumberForOutlet(orderNum);
      if (res) {
        const loadedOrder = {
          ...res,
          createdAt: new Date(res.createdAt),
        } as Order;
        setOrders((prev) => {
          if (!prev.some((o) => o.id === loadedOrder.id)) {
            return [loadedOrder, ...prev];
          }
          return prev;
        });

        const isAlreadyPaid =
          loadedOrder.paymentStatus === "PAID" ||
          (loadedOrder.status && loadedOrder.status !== "PENDING");

        if (isAlreadyPaid) {
          playScanWarningBeep();
          const statusMap: Record<string, string> = {
            NEW: "Pesanan Baru (Antrean Dapur)",
            PROCESSING: "Sedang Disiapkan di Dapur",
            READY: "Siap Disajikan",
            COMPLETED: "Pesanan Selesai",
            CANCELLED: "Pesanan Dibatalkan",
            FAILED: "Pesanan Gagal",
          };
          const statusLabel = statusMap[loadedOrder.status] || loadedOrder.status;
          toast.info(
            `Pesanan #${loadedOrder.orderNumber?.replace(/^#/, "") || ""} sudah lunas & berstatus "${statusLabel}".`,
            {
              description: "Detail pesanan tidak dibuka untuk mencegah duplikasi pembayaran."
            }
          );
          return;
        }

        playScanSuccessBeep();
        setSelectedOrder(loadedOrder);
        toast.success(`Pesanan #${loadedOrder.orderNumber?.replace(/^#/, "") || ""} siap diproses pembayarannya`);
      } else {
        playScanErrorBeep();
        toast.error(`Pesanan #${orderNum} tidak ditemukan`);
      }
    } catch (err: any) {
      playScanErrorBeep();
      toast.error("Gagal memproses scanner pesanan");
    } finally {
      setIsSearchingScannedOrder(false);
    }
  };

  // Hardware barcode scanner listener (seamless background scanning)
  useBarcodeScanner({
    onScan: (code) => {
      setSearchQuery("");
      handleScanCode(code);
    },
    minLength: 3,
  });

  // Update local state when props change
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTx = payload.new as any;
            if (["PENDING", "NEW", "PROCESSING", "READY"].includes(newTx.status)) {
              router.refresh(); 
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedTx = payload.new as any;
            setOrders(prev => {
              const exists = prev.find(o => o.id === updatedTx.id);
              if (!exists && ["PENDING", "NEW", "PROCESSING", "READY"].includes(updatedTx.status)) {
                router.refresh();
                return prev;
              }
              
              if (exists && !["PENDING", "NEW", "PROCESSING", "READY"].includes(updatedTx.status)) {
                return prev.filter(o => o.id !== updatedTx.id);
              }

              return prev.map(o => o.id === updatedTx.id ? { 
                ...o, 
                status: updatedTx.status,
                paymentStatus: updatedTx.payment_status || updatedTx.paymentStatus || o.paymentStatus
              } : o);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, router]);

  const buildReceiptData = (order: Order, paymentOverride?: { paymentMethod?: string; cashReceived?: number; change?: number }): ReceiptData => ({
    transactionId: order.orderNumber || order.id.slice(0, 8).toUpperCase(),
    date: new Date(order.createdAt),
    cashierName: cashierName,
    subtotal: Number(order.totalAmount || order.grandTotal),
    discount: Number(order.discount || 0),
    promoCode: order.promoCode || undefined,
    tax: Number(order.tax || 0),
    serviceCharge: Number(order.serviceCharge || 0),
    rounding: Number(order.rounding || 0),
    totalAmount: Number(order.grandTotal),
    cashReceived: paymentOverride?.cashReceived != null ? paymentOverride.cashReceived : Number(order.grandTotal),
    change: paymentOverride?.change != null ? paymentOverride.change : 0,
    paymentMethod: (paymentOverride?.paymentMethod || order.paymentMethod || 'TUNAI').toUpperCase(),
    orderType: order.orderType,
    customerName: order.customerName || undefined,
    tableNumber: order.tableNumber || undefined,
    items: order.items.map(it => ({
      name: it.productName,
      quantity: it.quantity,
      price: it.price ? Number(it.price) : Number(it.subtotal) / it.quantity,
      subtotal: Number(it.subtotal),
      modifiers: Array.isArray(it.modifiers) ? it.modifiers : undefined,
      notes: it.notes,
    })),
  });

  const handlePrintReceipt = (order: Order, mode: 'customer' | 'kitchen' | 'all', paymentOverride?: { paymentMethod?: string; cashReceived?: number; change?: number }) => {
    setIsPrinting(true);
    const receipt = buildReceiptData(order, paymentOverride);
    setPrintData(receipt);
    setPrintMode(mode);

    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      const label = mode === 'kitchen' ? 'Tiket dapur' : mode === 'customer' ? 'Struk pelanggan' : 'Struk & tiket dapur';
      toast.success(`${label} dicetak.`);
    }, 250);
  };

  const handleConfirmPaymentFromModal = async (payload: {
    paymentMethod: 'CASH' | 'QRIS_STATIC' | 'QRIS_DYNAMIC' | 'CARD' | 'TRANSFER';
    cashReceived?: number;
    change?: number;
    printReceipt?: boolean;
    rounding?: number;
    grandTotal?: number;
  }) => {
    if (!selectedOrder) return;
    const targetOrder = selectedOrder;
    setIsSubmittingPayment(true);

    const updatedGrandTotal = payload.grandTotal != null ? payload.grandTotal.toString() : targetOrder.grandTotal;
    const updatedRounding = payload.rounding != null ? payload.rounding.toString() : (targetOrder.rounding || '0');

    // Optimistic UI update
    setOrders(prev =>
      prev.map(o => {
        if (o.id === targetOrder.id) {
          return {
            ...o,
            status: 'NEW',
            paymentStatus: 'PAID',
            paymentMethod: payload.paymentMethod,
            rounding: updatedRounding,
            grandTotal: updatedGrandTotal,
          };
        }
        return o;
      })
    );

    try {
      const res = await confirmOrderPaymentAtCashier(targetOrder.id, {
        paymentMethod: payload.paymentMethod,
        cashReceived: payload.cashReceived,
        change: payload.change,
        rounding: payload.rounding,
        grandTotal: payload.grandTotal,
      });

      if (res.error) {
        toast.error(res.error);
        router.refresh();
      } else {
        toast.success(`Pembayaran ${targetOrder.orderNumber || ''} berhasil dikonfirmasi!`);
        setSelectedOrder(null);

        // Trigger print if requested
        if (payload.printReceipt) {
          handlePrintReceipt({
            ...targetOrder,
            rounding: updatedRounding,
            grandTotal: updatedGrandTotal,
          }, 'customer', {
            paymentMethod: payload.paymentMethod,
            cashReceived: payload.cashReceived,
            change: payload.change,
          });
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengonfirmasi pembayaran pesanan");
      router.refresh();
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (updatingOrderId) return;
    setUpdatingOrderId(orderId);

    // Optimistic UI update
    setOrders(prev => {
      if (!["PENDING", "NEW", "PROCESSING", "READY"].includes(newStatus)) {
        return prev.filter(o => o.id !== orderId);
      }
      return prev.map(o => {
        if (o.id === orderId) {
          const isConfirming = o.status === "PENDING" && newStatus === "NEW";
          return { ...o, status: newStatus, paymentStatus: isConfirming ? "PAID" : o.paymentStatus };
        }
        return o;
      });
    });

    try {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.error) {
        toast.error(res.error);
        router.refresh();
      } else {
        toast.success("Status pesanan diperbarui");
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(null);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal memperbarui status pesanan");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getNextStatusTitle = (nextStatus: string): string => {
    switch (nextStatus) {
      case "NEW":
        return "Pesanan Baru";
      case "PROCESSING":
        return "Sedang Disiapkan";
      case "READY":
        return "Siap Disajikan";
      case "COMPLETED":
        return "Pesanan Selesai";
      default:
        return nextStatus;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await getActiveOrders();
      setOrders(fresh as any);
      toast.success("Antrean pesanan berhasil diperbarui");
    } catch (err) {
      router.refresh();
      toast.info("Memperbarui antrean pesanan...");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBulkAdvanceClick = (
    status: string,
    nextStatus: string,
    title: string,
    columnOrders: Order[]
  ) => {
    if (columnOrders.length === 0) {
      toast.info(`Tidak ada pesanan pada status ${title}`);
      return;
    }

    setBulkModalState({
      isOpen: true,
      currentStatus: status,
      nextStatus: nextStatus,
      currentStatusTitle: title,
      nextStatusTitle: getNextStatusTitle(nextStatus),
      orders: columnOrders,
    });
  };

  const handleConfirmBulkAdvance = async () => {
    const { currentStatus, nextStatus, currentStatusTitle, nextStatusTitle, orders: targetOrders } = bulkModalState;
    const orderIds = targetOrders.map(o => o.id);
    if (orderIds.length === 0) {
      setBulkModalState(prev => ({ ...prev, isOpen: false }));
      return;
    }

    setIsBulkUpdating(true);

    // Optimistic UI update
    setOrders(prev => {
      if (!["PENDING", "NEW", "PROCESSING", "READY"].includes(nextStatus)) {
        return prev.filter(o => !orderIds.includes(o.id));
      }
      return prev.map(o => {
        if (orderIds.includes(o.id)) {
          const isConfirming = o.status === "PENDING" && nextStatus === "NEW";
          const allItemsCompleted = ["READY", "COMPLETED"].includes(nextStatus);
          return {
            ...o,
            status: nextStatus,
            paymentStatus: isConfirming ? "PAID" : o.paymentStatus,
            items: allItemsCompleted ? o.items.map(it => ({ ...it, isCompleted: true })) : o.items
          };
        }
        return o;
      });
    });

    try {
      const res = await bulkUpdateOrderStatus(orderIds, nextStatus);
      if (res.error) {
        toast.error(res.error);
        router.refresh();
      } else {
        toast.success(`${orderIds.length} pesanan berhasil dipindahkan ke "${nextStatusTitle}"`);
      }
    } catch (err) {
      toast.error("Gagal memproses perubahan status pesanan");
      router.refresh();
    } finally {
      setIsBulkUpdating(false);
      setBulkModalState(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleCheckMidtransPayment = async (order: Order) => {
    setSyncingOrderId(order.id);
    const toastId = toast.loading("Memeriksa status pembayaran di Midtrans...");
    try {
      const res = await syncOrderPaymentStatus(order.id);
      toast.dismiss(toastId);
      if (res.success && res.isPaid) {
        toast.success(`Pembayaran untuk order ${order.orderNumber || ''} LUNAS terkonfirmasi!`);
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, paymentStatus: 'PAID', status: res.status || 'NEW' } : o));
        if (selectedOrder && selectedOrder.id === order.id) {
          setSelectedOrder(prev => prev ? { ...prev, paymentStatus: 'PAID', status: res.status || 'NEW' } : null);
        }
      } else if (res.success && !res.isPaid) {
        toast.info("Belum ada pembayaran lunas yang tercatat di Midtrans.");
      } else {
        toast.error(res.error || "Gagal sinkronisasi pembayaran.");
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Terjadi kesalahan saat memeriksa pembayaran.");
    } finally {
      setSyncingOrderId(null);
    }
  };

  const handleToggleItem = async (orderId: string, itemId: string, isCompleted: boolean) => {
    if (isUpdatingStatus) return;

    // Optimistic UI update
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        items: o.items.map(i => i.id === itemId ? { ...i, isCompleted } : i)
      };
    }));
    
    if (selectedOrder && selectedOrder.id === orderId) {
       setSelectedOrder(prev => {
          if (!prev) return prev;
          return {
             ...prev,
             items: prev.items.map(i => i.id === itemId ? { ...i, isCompleted } : i)
          };
       });
    }

    const res = await updateOrderItemStatus(itemId, isCompleted);
    if (res.error) {
      toast.error(res.error);
      router.refresh();
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Type filter
      if (!isAllSelected) {
        const isDineIn = o.orderType === "DINE_IN";
        const isTakeaway = o.orderType === "TAKE_AWAY" || o.orderType === "TAKEAWAY";
        const isOnline = o.orderType === "ONLINE";

        const matches = (
          (isDineIn && selectedTypes.includes("DINE_IN")) ||
          (isTakeaway && selectedTypes.includes("TAKEAWAY")) ||
          (isOnline && selectedTypes.includes("ONLINE"))
        );
        if (!matches) return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        o.orderNumber?.toLowerCase().includes(q) || 
        o.customerName?.toLowerCase().includes(q) ||
        (o.tableNumber && `meja ${o.tableNumber}`.toLowerCase().includes(q))
      );
    });
  }, [orders, selectedTypes, isAllSelected, searchQuery]);

  const renderColumn = (
    title: string, 
    status: string, 
    nextStatus: string, 
    actionText: string, 
    icon: React.ReactNode, 
    accentColor: { badge: string; dot: string; button: string }
  ) => {
    const columnOrders = filteredOrders.filter(o => o.status === status);

    return (
      <div className="flex-1 min-w-[320px] max-w-[390px] bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 flex flex-col h-[calc(100vh-170px)]">
        {/* Column Header */}
        <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-slate-200 dark:border-slate-800 px-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${accentColor.dot}`} />
            <h3 className="font-semibold text-xs text-foreground flex items-center gap-1.5 tracking-tight">
              {icon}
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 tabular-nums">
              {columnOrders.length}
            </span>
            {status !== "PENDING" && (
              <button
                type="button"
                onClick={() => handleBulkAdvanceClick(status, nextStatus, title, columnOrders)}
                disabled={columnOrders.length === 0}
                className={`h-6 w-6 rounded-md flex items-center justify-center transition-all ${
                  columnOrders.length === 0
                    ? "opacity-25 cursor-not-allowed text-slate-400"
                    : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs active:scale-90 hover:border-emerald-300 cursor-pointer"
                }`}
                title={`Selesaikan/Lanjutkan semua pesanan pada status "${title}" ke "${getNextStatusTitle(nextStatus)}"`}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>

        {/* Order Cards List (Matches Image 1 Card Architecture) */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
          {columnOrders.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-muted-foreground/60 text-xs text-center p-4">
              <UtensilsCrossed className="w-5 h-5 mb-2 opacity-30" />
              <span>Tidak ada pesanan di antrean ini</span>
            </div>
          ) : (
            columnOrders.map(order => {
              const completedCount = order.items.filter(i => i.isCompleted).length;
              const totalCount = order.items.length;

              const isTakeaway = order.orderType === "TAKE_AWAY" || order.orderType === "TAKEAWAY";
              const isOnline = order.orderType === "ONLINE";
              const isPendingOnline = order.status === "PENDING" && (isOnline || order.paymentMethod === "ONLINE");

              const tableBadge = getTableBadge(order);
              const orderTypeLabel = isTakeaway
                ? "Takeaway"
                : isOnline
                ? "Online"
                : order.tableNumber
                ? "Dine In"
                : "Makan di Tempat";

              let statusPillStyle = "bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
              let statusPillIcon = <Clock className="w-3 h-3 text-slate-900" />;
              let statusPillText = "Menunggu";
              let statusDotStyle = "bg-amber-500";
              let statusIndicatorText = order.paymentStatus === "PAID" ? "Lunas" : "Belum Bayar";

              if (status === "NEW") {
                statusPillStyle = "bg-blue-50 text-slate-900 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900";
                statusPillIcon = <Clock className="w-3 h-3 text-slate-900" />;
                statusPillText = "Pesanan Baru";
                statusDotStyle = "bg-blue-500";
                statusIndicatorText = formatElapsed(order.createdAt);
              } else if (status === "PROCESSING") {
                statusPillStyle = "bg-amber-50 text-slate-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900";
                statusPillIcon = <ChefHat className="w-3 h-3 text-slate-900" />;
                statusPillText = "In Progress";
                statusDotStyle = "bg-amber-500";
                statusIndicatorText = `${completedCount}/${totalCount} Selesai`;
              } else if (status === "READY") {
                statusPillStyle = "bg-emerald-50 text-slate-900 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900";
                statusPillIcon = <CheckCircle2 className="w-3 h-3 text-slate-900" />;
                statusPillText = "Siap Disajikan";
                statusDotStyle = "bg-emerald-500";
                statusIndicatorText = "Siap Diambil";
              }

              return (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)} 
                  className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3 relative"
                >
                  <div>
                    {/* Header: Table badge (B2), Customer name, Order #, Status pill, Subtext indicator */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className=" w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs">
                          {tableBadge.label}
                        </div>
                        <div className="min-w-0">
                          <div className="py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-snug">
                            {order.customerName || "Tamu / Umum"}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                            Order #{order.orderNumber || "-"} / {orderTypeLabel}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-1 py-2">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-sm border shrink-0",
                          statusPillStyle
                        )}>
                          {statusPillIcon}
                          <span>{statusPillText}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 shrink-0 mt-1 pr-2">
                          <span className={cn("w-1.5 h-1.5 rounded-full", statusDotStyle)} />
                          <span>{statusIndicatorText}</span>
                        </span>
                      </div>
                    </div>

                    {/* Date and Time Row */}
                    <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-medium pt-2 pb-1">
                      <span>{formatOrderFullDate(order.createdAt)}</span>
                      <span>{formatOrderTime(order.createdAt)}</span>
                    </div>

                    {/* Items List Table (Header: Items, Qty, Price) */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="grid grid-cols-12 text-[11px] font-medium text-slate-400 dark:text-slate-500 pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
                        <span className="col-span-7">Items</span>
                        <span className="col-span-2 text-center">Qty</span>
                        <span className="col-span-3 text-right">Price</span>
                      </div>

                      <div className="space-y-1.5 pt-1.5 max-h-36 overflow-y-auto pr-0.5 scrollbar-hide">
                        {order.items.map((item) => (
                          <div 
                            key={item.id} 
                            className="grid grid-cols-12 items-center text-sm py-1 group/item cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded px-1 -mx-1 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleItem(order.id, item.id, !item.isCompleted);
                            }}
                            title="Klik untuk menandai menu selesai/belum"
                          >
                            <div className="col-span-7 flex items-center gap-1.5 min-w-0 pr-1">
                              <div className={cn(
                                "w-3 h-3 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors",
                                item.isCompleted 
                                  ? "bg-blue-600 border-blue-600 text-white" 
                                  : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 opacity-60 group-hover/item:opacity-100"
                              )}>
                                {item.isCompleted && <Check className="w-2 h-2 stroke-[2.5]" />}
                              </div>
                              <span className={cn(
                                "truncate text-sm leading-tight",
                                item.isCompleted ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200 font-normal"
                              )}>
                                {item.productName}
                              </span>
                            </div>
                            <span className="col-span-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                              {item.quantity}
                            </span>
                            <span className="col-span-3 text-right text-sm font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                              {formatCurrency(Number(item.subtotal || 0))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Total & Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Total</span>
                      <span className="text-sm sm:text-sm  font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatCurrency(Number(order.grandTotal))}
                      </span>
                    </div>

                    {/* Two Action Buttons: See Details & Primary Status Action */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="h-9.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
                      >
                        Lihat Detail
                      </Button>

                      <Button 
                        type="button"
                        size="sm"
                        disabled={isUpdatingStatus && updatingOrderId === order.id}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (status === "PENDING") {
                            setSelectedOrder(order);
                          } else {
                            handleStatusChange(order.id, nextStatus); 
                          }
                        }}
                        className={cn(
                          "h-8 text-xs font-semibold rounded-xl shadow-xs transition-transform active:scale-95 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1",
                          accentColor.button
                        )}
                      >
                        {updatingOrderId === order.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-0.5" />
                            <span>Proses...</span>
                          </>
                        ) : (
                          <>
                            <span>{actionText}</span>
                            {status === "READY" ? <Check className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </>
                        )}
                      </Button>
                    </div>

                    {isPendingOnline && (
                      <div className="mt-2 pt-1.5 border-t border-dashed border-slate-100 dark:border-slate-800">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckMidtransPayment(order);
                          }}
                          disabled={syncingOrderId === order.id}
                          className="w-full h-7 text-[11px] px-2 border-blue-200 hover:bg-blue-50 text-blue-700 dark:border-blue-900 dark:text-blue-300"
                        >
                          {syncingOrderId === order.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5 mr-1" />
                          )}
                          Cek Midtrans
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Invisible print component */}
      <ReceiptPrinter 
        data={printData} 
        settings={receiptSettings || null} 
        printMode={printMode} 
      />

      {/* Search & Filter Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
        <div className="relative flex-1 max-w-full sm:max-w-xs md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
          <Input 
            placeholder="Cari meja, no order, nama..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
          {/* Dropdown Filter Jenis Pesanan (di samping kiri tombol scan qr) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-3 gap-1.5 text-xs font-medium border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs shrink-0 cursor-pointer"
                title="Filter berdasarkan jenis pesanan"
              >
                <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Jenis Pesanan</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  ({isAllSelected 
                    ? "Semua" 
                    : selectedTypes.length === 1 
                      ? (selectedTypes[0] === "DINE_IN" ? "Dine In" : selectedTypes[0] === "TAKEAWAY" ? "Bawa Pulang" : "Online")
                      : selectedTypes.length === 0 
                        ? "0" 
                        : `${selectedTypes.length}`
                  })
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
              <DropdownMenuCheckboxItem
                checked={isAllSelected}
                onCheckedChange={toggleSelectAll}
                onSelect={(e) => e.preventDefault()}
                className="text-xs py-1.5 cursor-pointer rounded-lg font-medium text-slate-700 dark:text-slate-200"
              >
                Semua
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedTypes.includes("DINE_IN")}
                onCheckedChange={() => toggleType("DINE_IN")}
                onSelect={(e) => e.preventDefault()}
                className="text-xs py-1.5 cursor-pointer rounded-lg font-medium text-slate-700 dark:text-slate-200"
              >
                Dine In (Meja)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedTypes.includes("TAKEAWAY")}
                onCheckedChange={() => toggleType("TAKEAWAY")}
                onSelect={(e) => e.preventDefault()}
                className="text-xs py-1.5 cursor-pointer rounded-lg font-medium text-slate-700 dark:text-slate-200"
              >
                Bawa Pulang
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedTypes.includes("ONLINE")}
                onCheckedChange={() => toggleType("ONLINE")}
                onSelect={(e) => e.preventDefault()}
                className="text-xs py-1.5 cursor-pointer rounded-lg font-medium text-slate-700 dark:text-slate-200"
              >
                Online
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tombol Scan QR (posisi di samping tombol refresh, jika layar kecil hanya icon) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCameraScannerOpen(true)}
            className="h-9 px-2.5 sm:px-3 gap-1.5 text-xs font-semibold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs shrink-0 cursor-pointer"
            title="Pindai QR pesanan pelanggan menggunakan kamera"
          >
            <Camera className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="hidden sm:inline">Scan QR</span>
          </Button>

          {/* Tombol Refresh */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 px-2.5 sm:px-3 gap-1.5 text-xs font-semibold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs shrink-0 active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Refresh antrean pesanan"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 shrink-0 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="flex gap-3.5 overflow-x-auto pb-2 flex-1 min-h-0">
        {renderColumn(
          "Menunggu Pesanan", 
          "PENDING", 
          "NEW", 
          "Bayar", 
          <CreditCard className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />,
          { 
            badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200", 
            dot: "bg-slate-800 dark:bg-slate-200", 
            button: "bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 shadow-xs" 
          }
        )}
        
        {renderColumn(
          "Pesanan Baru", 
          "NEW", 
          "PROCESSING", 
          "Mulai Siapkan", 
          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
          { 
            badge: "bg-blue-50 text-blue-700", 
            dot: "bg-blue-500", 
            button: "bg-blue-600 hover:bg-blue-700 text-white" 
          }
        )}
        
        {renderColumn(
          "Sedang Disiapkan", 
          "PROCESSING", 
          "READY", 
          "Tandai Siap", 
          <ChefHat className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
          { 
            badge: "bg-amber-50 text-amber-700", 
            dot: "bg-amber-500", 
            button: "bg-amber-600 hover:bg-amber-700 text-white" 
          }
        )}
        
        {renderColumn(
          "Siap Disajikan", 
          "READY", 
          "COMPLETED", 
          "Selesaikan", 
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
          { 
            badge: "bg-emerald-50 text-emerald-700", 
            dot: "bg-emerald-500", 
            button: "bg-emerald-600 hover:bg-emerald-700 text-white" 
          }
        )}
      </div>

      {/* Unified Image 2 Order Payment & Detail Modal */}
      <OrderPaymentModal
        isOpen={!!selectedOrder}
        onClose={() => {
          if (!isSubmittingPayment) setSelectedOrder(null);
        }}
        order={selectedOrder}
        posSettings={receiptSettings}
        onConfirm={handleConfirmPaymentFromModal}
        onStatusChange={handleStatusChange}
        onToggleItem={handleToggleItem}
        onPrintReceipt={handlePrintReceipt}
        onCheckMidtrans={handleCheckMidtransPayment}
        isProcessing={isSubmittingPayment}
        updatingOrderId={updatingOrderId}
        syncingOrderId={syncingOrderId}
      />

      {/* Modal Konfirmasi Selesaikan Semua Pesanan */}
      <Dialog 
        open={bulkModalState.isOpen} 
        onOpenChange={(open) => {
          if (!isBulkUpdating) {
            setBulkModalState(prev => ({ ...prev, isOpen: open }));
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
          <DialogHeader className="border-b pb-3 border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Lanjutkan Semua Pesanan?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Status: {bulkModalState.currentStatusTitle} → {bulkModalState.nextStatusTitle}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Apakah Anda yakin untuk menyelesaikan semua pesanan pada status{" "}
              <strong className="text-slate-900 dark:text-slate-100 font-bold">
                "{bulkModalState.currentStatusTitle}"
              </strong>{" "}
              sebanyak{" "}
              <strong className="text-emerald-600 font-bold">
                {bulkModalState.orders.length} pesanan
              </strong>{" "}
              dan lanjut ke status tahap selanjutnya (
              <strong className="text-blue-600 font-bold">
                "{bulkModalState.nextStatusTitle}"
              </strong>)?
            </p>

            {/* List of Affected Orders */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Daftar Pesanan ({bulkModalState.orders.length})
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {bulkModalState.orders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {o.orderNumber || "#-"}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[160px]">
                        {o.customerName || (o.tableNumber ? `Meja ${o.tableNumber}` : "Pesanan")}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {formatCurrency(Number(o.grandTotal))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-3 border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkModalState(prev => ({ ...prev, isOpen: false }))}
              disabled={isBulkUpdating}
              className="border-slate-200 dark:border-slate-800 text-xs font-semibold cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleConfirmBulkAdvance}
              disabled={isBulkUpdating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {isBulkUpdating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Ya, Lanjutkan Semua ({bulkModalState.orders.length})</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Camera Scanner Viewfinder Dialog */}
      <OrderCameraScannerDialog
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={handleScanCode}
      />

      {/* Physical Thermal Receipt Printer (Screen-hidden, active during window.print) */}
      <ReceiptPrinter 
        data={printData} 
        settings={receiptSettings} 
        printMode={printMode} 
      />
    </div>
  );
}

