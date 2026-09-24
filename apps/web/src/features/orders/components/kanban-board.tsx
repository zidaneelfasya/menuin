"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { updateOrderStatus, updateOrderItemStatus, syncOrderPaymentStatus, bulkUpdateOrderStatus, getActiveOrders, getOrderByNumberForOutlet } from "@/lib/actions/orders";
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
  Camera
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReceiptPrinter, ReceiptData, TenantReceiptSettings } from "@/features/pos/components/receipt-printer";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { OrderCameraScannerDialog } from "./order-camera-scanner-dialog";
import { playScanSuccessBeep, playScanErrorBeep } from "@/lib/utils/sound";

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
  totalAmount: string;
  grandTotal: string;
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
    }).format(date);
  } catch {
    return "--:--";
  }
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

export function   KanbanBoard({ initialOrders, tenantId, cashierName = "Kasir", receiptSettings }: KanbanBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToPrepare, setOrderToPrepare] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPrepareModalOpen, setIsPrepareModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "DINE_IN" | "TAKEAWAY" | "ONLINE">("ALL");
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  
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
      playScanSuccessBeep();
      setSelectedOrder(existingOrder);
      setIsDialogOpen(true);
      toast.success(`Pesanan #${existingOrder.orderNumber?.replace(/^#/, "") || ""} ditemukan`);
      return;
    }

    // 2. Fallback to server action if not yet in state
    setIsSearchingScannedOrder(true);
    try {
      const res = await getOrderByNumberForOutlet(orderNum);
      if (res) {
        playScanSuccessBeep();
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
        setSelectedOrder(loadedOrder);
        setIsDialogOpen(true);
        toast.success(`Pesanan #${loadedOrder.orderNumber?.replace(/^#/, "") || ""} ditemukan`);
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

  const buildReceiptData = (order: Order): ReceiptData => ({
    transactionId: order.orderNumber || order.id.slice(0, 8).toUpperCase(),
    date: new Date(order.createdAt),
    cashierName: cashierName,
    totalAmount: Number(order.grandTotal),
    cashReceived: Number(order.grandTotal),
    change: 0,
    paymentMethod: (order.paymentMethod || 'TUNAI').toUpperCase(),
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

  const handlePrintReceipt = (order: Order, mode: 'customer' | 'kitchen' | 'all') => {
    setIsPrinting(true);
    const receipt = buildReceiptData(order);
    setPrintData(receipt);
    setPrintMode(mode);

    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 250);
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
          setIsDialogOpen(false);
          setSelectedOrder(null);
        }
        if (orderToPrepare && orderToPrepare.id === orderId) {
          setIsPrepareModalOpen(false);
          setOrderToPrepare(null);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal memperbarui status pesanan");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleStartPrepareClick = (order: Order) => {
    setOrderToPrepare(order);
    setIsPrepareModalOpen(true);
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
      if (typeFilter === "DINE_IN" && o.orderType !== "DINE_IN") return false;
      if (typeFilter === "TAKEAWAY" && o.orderType !== "TAKE_AWAY" && o.orderType !== "TAKEAWAY") return false;
      if (typeFilter === "ONLINE" && o.orderType !== "ONLINE") return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        o.orderNumber?.toLowerCase().includes(q) || 
        o.customerName?.toLowerCase().includes(q) ||
        (o.tableNumber && `meja ${o.tableNumber}`.toLowerCase().includes(q))
      );
    });
  }, [orders, typeFilter, searchQuery]);

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
      <div className="flex-1 min-w-[310px] max-w-[380px] bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 flex flex-col h-[calc(100vh-170px)]">
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
          </div>
        </div>

        {/* Order Cards List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-hide">
          {columnOrders.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-muted-foreground/60 text-xs text-center p-4">
              <UtensilsCrossed className="w-5 h-5 mb-2 opacity-30" />
              <span>Tidak ada pesanan di antrean ini</span>
            </div>
          ) : (
            columnOrders.map(order => {
              const completedCount = order.items.filter(i => i.isCompleted).length;
              const totalCount = order.items.length;
              const allDone = totalCount > 0 && completedCount === totalCount;

              const isTakeaway = order.orderType === "TAKE_AWAY" || order.orderType === "TAKEAWAY";
              const isOnline = order.orderType === "ONLINE";
              const isPendingOnline = order.status === "PENDING" && (isOnline || order.paymentMethod === "ONLINE");

              return (
                <div 
                  key={order.id} 
                  onClick={() => { setSelectedOrder(order); setIsDialogOpen(true); }} 
                  className="group cursor-pointer bg-white dark:bg-slate-950 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm transition-all duration-150 relative flex flex-col justify-between"
                >
                  {/* Top Meta Bar */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-sans text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 tracking-wider">
                          {order.orderNumber || "#-"}
                        </span>
                        
                        {order.paymentStatus === "PAID" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Belum Bayar
                          </span>
                        )}
                      </div>

                      <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80 font-medium">
                        <Clock className="w-3 h-3 opacity-60" />
                        <span>{formatElapsed(order.createdAt)}</span>
                      </div>
                    </div>

                    {/* Order Title & Customer Info */}
                    <div className="mt-2.5">
                      <div className="text-[13px] font-semibold text-foreground tracking-tight flex items-center gap-1.5">
                        {order.tableNumber ? (
                          <>
                            <UtensilsCrossed className="w-3.5 h-3.5 text-blue-600" />
                            <span>Meja {order.tableNumber}</span>
                          </>
                        ) : isTakeaway ? (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                            <span>Bawa Pulang (Takeaway)</span>
                          </>
                        ) : isOnline ? (
                          <>
                            <Store className="w-3.5 h-3.5 text-blue-600" />
                            <span>Pesanan Online</span>
                          </>
                        ) : (
                          <>
                            <UtensilsCrossed className="w-3.5 h-3.5 text-blue-600" />
                            <span>Makan di Tempat</span>
                          </>
                        )}
                      </div>
                      
                      {order.customerName && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 font-normal">
                          <User className="w-3 h-3 opacity-60" />
                          <span className="truncate max-w-[200px]">{order.customerName}</span>
                        </div>
                      )}
                    </div>

                    {/* Items Checklist */}
                    <div className="space-y-1.5 my-2.5 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                      {order.items.map((item) => (
                        <div 
                          key={item.id} 
                          className="group/item flex items-center justify-between text-xs py-0.5 rounded px-1 -mx-1 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleItem(order.id, item.id, !item.isCompleted);
                          }}
                        >
                          <div className="flex items-center gap-1.5 flex-1 pr-2 min-w-0">
                            <div className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${
                              item.isCompleted 
                                ? "bg-blue-600 border-blue-600 text-white" 
                                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            }`}>
                              {item.isCompleted && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                            </div>
                            
                            <span className="inline-flex items-center justify-center font-semibold text-[10px] min-w-[20px] h-[18px] px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 tabular-nums shrink-0">
                              {item.quantity}x
                            </span>

                            <span className={`text-xs truncate ${item.isCompleted ? "line-through text-muted-foreground/50" : "text-foreground/90 font-normal"}`}>
                              {item.productName}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer: Price + Action Button */}
                  <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 mt-1">
                    <div className="text-xs font-semibold text-foreground tracking-tight tabular-nums">
                      {formatCurrency(Number(order.grandTotal))}
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      {isPendingOnline && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckMidtransPayment(order);
                          }}
                          disabled={syncingOrderId === order.id}
                          className="h-7 text-[11px] px-2 border-blue-200 hover:bg-blue-50 text-blue-700 dark:border-blue-900 dark:text-blue-300"
                          title="Periksa status pembayaran Midtrans"
                        >
                          {syncingOrderId === order.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <RefreshCw className="w-3 h-3 mr-1" />
                          )}
                          Cek Midtrans
                        </Button>
                      )}

                      <Button 
                        size="sm"
                        disabled={isUpdatingStatus && updatingOrderId === order.id}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (status === "NEW") {
                            // Open preparation & print modal first!
                            handleStartPrepareClick(order);
                          } else {
                            handleStatusChange(order.id, nextStatus); 
                          }
                        }}
                        className={`h-7 text-xs font-medium gap-1 px-3 rounded-lg shadow-2xs transition-transform active:scale-95 ${accentColor.button} disabled:opacity-60 cursor-pointer`}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 w-full sm:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <Input 
              placeholder="Cari meja, no order, nama..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCameraScannerOpen(true)}
            className="h-9 px-3 gap-1.5 text-xs font-semibold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs shrink-0 cursor-pointer"
            title="Pindai QR pesanan pelanggan menggunakan kamera"
          >
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            <span>Scan QR</span>
          </Button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setTypeFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === "ALL" 
                ? "bg-blue-600 text-white shadow-xs font-semibold" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setTypeFilter("DINE_IN")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === "DINE_IN" 
                ? "bg-blue-600 text-white shadow-xs font-semibold" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground"
            }`}
          >
            Dine In (Meja)
          </button>
          <button
            onClick={() => setTypeFilter("TAKEAWAY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === "TAKEAWAY" 
                ? "bg-blue-600 text-white shadow-xs font-semibold" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground"
            }`}
          >
            Bawa Pulang
          </button>
          <button
            onClick={() => setTypeFilter("ONLINE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === "ONLINE" 
                ? "bg-blue-600 text-white shadow-xs font-semibold" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground"
            }`}
          >
            Online
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />

          {/* Tombol Refresh di samping kanan pilihan filter online */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-foreground transition-all shadow-xs shrink-0 active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Refresh antrean pesanan"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="flex gap-3.5 overflow-x-auto pb-2 flex-1 min-h-0">
        {renderColumn(
          "Menunggu Bayar", 
          "PENDING", 
          "NEW", 
          "Konfirmasi", 
          <CreditCard className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />,
          { 
            badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200", 
            dot: "bg-amber-500", 
            button: "bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-200 dark:hover:bg-slate-100 dark:text-slate-900 shadow-xs" 
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

      {/* Preparation & Print Receipt Modal (Before starting kitchen preparation) */}
      <Dialog 
        open={isPrepareModalOpen} 
        onOpenChange={(open) => {
          if (!isUpdatingStatus) setIsPrepareModalOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
          <DialogHeader className="border-b pb-3 border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Siapkan Pesanan & Cetak Struk
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {orderToPrepare?.orderNumber} • {orderToPrepare?.tableNumber ? `Meja ${orderToPrepare.tableNumber}` : orderToPrepare?.orderType.replace("_", " ")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {orderToPrepare && (
            <div className="space-y-4 py-2">
              {/* Order Item Summary */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span>Menu yang Akan Dimasak</span>
                  <span className="text-[11px] text-muted-foreground">{orderToPrepare.items.length} Menu</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {orderToPrepare.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-dashed border-slate-200 dark:border-slate-800 last:border-0">
                      <span className="text-slate-800 dark:text-slate-200">
                        <strong className="text-blue-600 font-sans mr-1.5">{item.quantity}x</strong>
                        {item.productName}
                        {item.notes && <span className="block text-[10px] text-slate-400 italic">({item.notes})</span>}
                      </span>
                      <span className="text-slate-500 text-[11px] font-sans">{formatCurrency(Number(item.subtotal))}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Receipt Print Quick Actions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Cetak Dokumen Fisik</span>
                  <span className="text-[11px] text-slate-400">Opsional</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handlePrintReceipt(orderToPrepare, 'kitchen')}
                    disabled={isPrinting || isUpdatingStatus}
                    className="h-10 text-xs font-medium border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-slate-700 dark:text-slate-300 gap-1.5 disabled:opacity-50"
                  >
                    
                    Tiket Dapur
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handlePrintReceipt(orderToPrepare, 'customer')}
                    disabled={isPrinting || isUpdatingStatus}
                    className="h-10 text-xs font-medium border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-slate-700 dark:text-slate-300 gap-1.5 disabled:opacity-50"
                  >
                    
                    Struk Pelanggan
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePrintReceipt(orderToPrepare, 'all')}
                  disabled={isPrinting || isUpdatingStatus}
                  className="w-full h-9 text-xs border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700 dark:text-slate-300 gap-1.5 disabled:opacity-50"
                >
                  
                  Cetak Keduanya
                </Button>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  disabled={isUpdatingStatus}
                  onClick={() => setIsPrepareModalOpen(false)}
                  className="h-10 text-xs disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </Button>
                <Button 
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange(orderToPrepare.id, 'PROCESSING')}
                  className="h-10 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm disabled:opacity-75 cursor-pointer"
                >
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      
                      <span>Proses Pesanan</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Detail Modal */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          if (!isUpdatingStatus) setIsDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <DialogHeader className="border-b pb-3 border-slate-100 dark:border-slate-800">
            <DialogTitle className="flex items-center gap-2 text-base">
              <span>Detail Pesanan</span>
              <span className="font-sans text-blue-600">{selectedOrder?.orderNumber || ""}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Waktu: {selectedOrder ? formatDate(selectedOrder.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 pt-2">
              {/* Order Info Card */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Tipe Pesanan</span>
                  <span className="font-semibold text-foreground">
                    {selectedOrder.tableNumber ? `Meja ${selectedOrder.tableNumber}` : selectedOrder.orderType.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Pelanggan</span>
                  <span className="font-semibold text-foreground">
                    {selectedOrder.customerName || "Tamu / Umum"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Metode Bayar</span>
                  <span className="font-semibold text-foreground">
                    {selectedOrder.paymentMethod || "CASH"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Status Pembayaran</span>
                  <span className={`font-semibold ${selectedOrder.paymentStatus === "PAID" ? "text-blue-600" : "text-amber-600"}`}>
                    {selectedOrder.paymentStatus === "PAID" ? "LUNAS" : "BELUM LUNAS"}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Daftar Menu
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedOrder.items.filter(i => i.isCompleted).length} dari {selectedOrder.items.length} selesai
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.items.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-2 rounded-lg transition-colors text-xs ${
                        isUpdatingStatus ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                      }`}
                      onClick={() => !isUpdatingStatus && handleToggleItem(selectedOrder.id, item.id, !item.isCompleted)}
                    >
                      <div className="flex items-center gap-2.5 flex-1">
                        <Checkbox 
                          id={`modal-item-${item.id}`} 
                          checked={item.isCompleted} 
                          disabled={isUpdatingStatus}
                          onCheckedChange={(checked) => !isUpdatingStatus && handleToggleItem(selectedOrder.id, item.id, checked as boolean)}
                          className="w-4 h-4 disabled:opacity-50"
                        />
                        <label 
                          htmlFor={`modal-item-${item.id}`}
                          className={`leading-tight ${
                            isUpdatingStatus ? "cursor-not-allowed" : "cursor-pointer"
                          } ${item.isCompleted ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}
                        >
                          <span className="font-bold font- mr-1">{item.quantity}x</span> {item.productName}
                        </label>
                      </div>
                      <span className="font-sans text-muted-foreground">{formatCurrency(Number(item.subtotal))}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Print buttons inside detail */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">Cetak Struk:</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPrinting || isUpdatingStatus}
                    onClick={() => handlePrintReceipt(selectedOrder, 'customer')}
                    className="flex-1 h-8 text-xs gap-1 border-slate-200 text-slate-700 dark:text-slate-300 hover:bg-white disabled:opacity-50"
                  >
                    
                    Struk Pelanggan
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPrinting || isUpdatingStatus}
                    onClick={() => handlePrintReceipt(selectedOrder, 'kitchen')}
                    className="flex-1 h-8 text-xs gap-1 border-slate-200 text-slate-700 dark:text-slate-300 hover:bg-white disabled:opacity-50"
                  >
                    
                    Tiket Dapur
                  </Button>
                </div>
              </div>

              {/* Total & Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span>Total Tagihan</span>
                  <span className="font-sans text-blue-600 text-base">
                    {formatCurrency(Number(selectedOrder.grandTotal))}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {selectedOrder.status === "PENDING" && (selectedOrder.orderType === "ONLINE" || selectedOrder.paymentMethod === "ONLINE") && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleCheckMidtransPayment(selectedOrder)}
                      disabled={isUpdatingStatus || syncingOrderId === selectedOrder.id}
                      className="w-full h-9 text-xs border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100/60 font-semibold gap-1.5 disabled:opacity-50"
                    >
                      {syncingOrderId === selectedOrder.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Periksa Status Pembayaran Midtrans
                    </Button>
                  )}

                  <Button
                    onClick={() => {
                      const status = selectedOrder.status;
                      if (status === "NEW") {
                        setIsDialogOpen(false);
                        handleStartPrepareClick(selectedOrder);
                        return;
                      }
                      const next = status === "PENDING" ? "NEW" : status === "PROCESSING" ? "READY" : "COMPLETED";
                      handleStatusChange(selectedOrder.id, next);
                    }}
                    disabled={isUpdatingStatus}
                    className="w-full h-10 font-semibold gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-75 cursor-pointer"
                  >
                    {isUpdatingStatus ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> 
                        {selectedOrder.status === "PENDING" ? "Konfirmasi Pembayaran" : 
                         selectedOrder.status === "NEW" ? "Mulai Siapkan Pesanan" :
                         selectedOrder.status === "PROCESSING" ? "Tandai Siap Disajikan" : "Selesaikan Pesanan"}
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    disabled={isUpdatingStatus}
                    onClick={() => {
                      if (confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) {
                        handleStatusChange(selectedOrder.id, "FAILED");
                      }
                    }}
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-9 disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Batalkan Pesanan
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
    </div>
  );
}

