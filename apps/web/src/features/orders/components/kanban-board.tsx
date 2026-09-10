"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { updateOrderStatus, updateOrderItemStatus } from "@/lib/actions/orders";
import { toast } from "sonner";
import { 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  ChevronRight, 
  Check, 
  CreditCard, 
  Search, 
  XCircle, 
  UtensilsCrossed, 
  Store, 
  ShoppingBag,
  User,
  AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type OrderItem = {
  id: string;
  transactionId: string;
  quantity: number;
  productName: string;
  subtotal: string;
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

export function KanbanBoard({ initialOrders, tenantId }: KanbanBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "DINE_IN" | "TAKEAWAY" | "ONLINE">("ALL");
  const router = useRouter();

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

              return prev.map(o => o.id === updatedTx.id ? { ...o, status: updatedTx.status } : o);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, router]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
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

    const res = await updateOrderStatus(orderId, newStatus);
    if (res.error) {
      toast.error(res.error);
      router.refresh();
    } else {
      toast.success("Status pesanan diperbarui");
      if (selectedOrder && selectedOrder.id === orderId) {
        setIsDialogOpen(false);
      }
    }
  };

  const handleToggleItem = async (orderId: string, itemId: string, isCompleted: boolean) => {
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
      <div className="flex-1 min-w-[310px] max-w-[380px] bg-muted/40 border border-border/60 rounded-2xl p-3 flex flex-col h-[calc(100vh-170px)]">
        {/* Column Header */}
        <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-border/60 px-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${accentColor.dot}`} />
            <h3 className="font-semibold text-xs text-foreground flex items-center gap-1.5 tracking-tight">
              {icon}
              {title}
            </h3>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-background border border-border/60 text-muted-foreground tabular-nums">
            {columnOrders.length}
          </span>
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

              return (
                <div 
                  key={order.id} 
                  onClick={() => { setSelectedOrder(order); setIsDialogOpen(true); }} 
                  className="group cursor-pointer bg-card rounded-xl p-3.5 border border-border/70 hover:border-border hover:shadow-xs transition-all duration-150 relative flex flex-col justify-between"
                >
                  {/* Top Meta Bar */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-muted/80 text-foreground/80 border border-border/40 tracking-wider">
                          {order.orderNumber || "#-"}
                        </span>
                        
                        {order.paymentStatus === "PAID" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
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
                            <UtensilsCrossed className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Meja {order.tableNumber}</span>
                          </>
                        ) : isTakeaway ? (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Bawa Pulang (Takeaway)</span>
                          </>
                        ) : isOnline ? (
                          <>
                            <Store className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Pesanan Online</span>
                          </>
                        ) : (
                          <>
                            <UtensilsCrossed className="w-3.5 h-3.5 text-muted-foreground" />
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
                    <div className="space-y-1.5 my-2.5 pt-2 border-t border-dashed border-border/60">
                      {order.items.map((item) => (
                        <div 
                          key={item.id} 
                          className="group/item flex items-center justify-between text-xs py-0.5 rounded px-1 -mx-1 hover:bg-muted/40 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleItem(order.id, item.id, !item.isCompleted);
                          }}
                        >
                          <div className="flex items-center gap-1.5 flex-1 pr-2 min-w-0">
                            <div className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${
                              item.isCompleted 
                                ? "bg-primary border-primary text-primary-foreground" 
                                : "border-border group-hover/item:border-muted-foreground/40 bg-background"
                            }`}>
                              {item.isCompleted && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                            </div>
                            
                            <span className="inline-flex items-center justify-center font-semibold text-[10px] min-w-[20px] h-[18px] px-1 rounded bg-muted/80 text-foreground/80 tabular-nums shrink-0">
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
                  <div className="pt-2.5 border-t border-border/60 flex items-center justify-between gap-2 mt-1">
                    <div className="text-xs font-semibold text-foreground tracking-tight tabular-nums">
                      {formatCurrency(Number(order.grandTotal))}
                    </div>
                    
                    <Button 
                      size="sm"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleStatusChange(order.id, nextStatus); 
                      }}
                      className={`h-7 text-xs font-medium gap-1 px-3 rounded-lg shadow-2xs transition-transform active:scale-95 ${accentColor.button}`}
                    >
                      <span>{actionText}</span>
                      {status === "READY" ? <Check className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </Button>
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
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
          <Input 
            placeholder="Cari meja, no order, nama..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-card rounded-lg"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setTypeFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === "ALL" 
                ? "bg-foreground text-background shadow-xs font-semibold" 
                : "bg-muted/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setTypeFilter("DINE_IN")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === "DINE_IN" 
                ? "bg-foreground text-background shadow-xs font-semibold" 
                : "bg-muted/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            Dine In (Meja)
          </button>
          <button
            onClick={() => setTypeFilter("TAKEAWAY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === "TAKEAWAY" 
                ? "bg-foreground text-background shadow-xs font-semibold" 
                : "bg-muted/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            Bawa Pulang
          </button>
          <button
            onClick={() => setTypeFilter("ONLINE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === "ONLINE" 
                ? "bg-foreground text-background shadow-xs font-semibold" 
                : "bg-muted/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            Online
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
          <CreditCard className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />,
          { 
            badge: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200", 
            dot: "bg-zinc-600 dark:bg-zinc-400", 
            button: "bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-zinc-200 dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-xs" 
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

      {/* Order Detail Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <span>Detail Pesanan</span>
              <span className="font-mono text-primary">{selectedOrder?.orderNumber || ""}</span>
            </DialogTitle>
            <DialogDescription>
              Waktu: {selectedOrder ? formatDate(selectedOrder.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 pt-2">
              {/* Order Info Card */}
              <div className="grid grid-cols-2 gap-2 bg-muted/40 p-3 rounded-xl border text-xs">
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
                  <span className="font-semibold text-emerald-600">
                    {selectedOrder.paymentStatus === "PAID" ? "LUNAS" : "BELUM LUNAS"}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Daftar Menu
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedOrder.items.filter(i => i.isCompleted).length} dari {selectedOrder.items.length} selesai
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.items.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors text-xs"
                      onClick={() => handleToggleItem(selectedOrder.id, item.id, !item.isCompleted)}
                    >
                      <div className="flex items-center gap-2.5 flex-1 cursor-pointer">
                        <Checkbox 
                          id={`modal-item-${item.id}`} 
                          checked={item.isCompleted} 
                          onCheckedChange={(checked) => handleToggleItem(selectedOrder.id, item.id, checked as boolean)}
                          className="w-4 h-4"
                        />
                        <label 
                          htmlFor={`modal-item-${item.id}`}
                          className={`cursor-pointer leading-tight ${item.isCompleted ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}
                        >
                          <span className="font-bold font-mono">{item.quantity}x</span> {item.productName}
                        </label>
                      </div>
                      <span className="font-mono text-muted-foreground">{formatCurrency(Number(item.subtotal))}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Action Buttons */}
              <div className="pt-3 border-t space-y-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span>Total Tagihan</span>
                  <span className="font-mono text-primary text-base">
                    {formatCurrency(Number(selectedOrder.grandTotal))}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => {
                      const status = selectedOrder.status;
                      const next = status === "PENDING" ? "NEW" : status === "NEW" ? "PROCESSING" : status === "PROCESSING" ? "READY" : "COMPLETED";
                      handleStatusChange(selectedOrder.id, next);
                    }}
                    className="w-full h-10 font-semibold gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> 
                    {selectedOrder.status === "PENDING" ? "Konfirmasi Pembayaran" : 
                     selectedOrder.status === "NEW" ? "Mulai Siapkan Pesanan" :
                     selectedOrder.status === "PROCESSING" ? "Tandai Siap Disajikan" : "Selesaikan Pesanan"}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) {
                        handleStatusChange(selectedOrder.id, "FAILED");
                      }
                    }}
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-9"
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
    </div>
  );
}
