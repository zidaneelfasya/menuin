"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { updateOrderStatus, updateOrderItemStatus } from "@/lib/actions/orders";
import { toast } from "sonner";
import { Clock, Utensils, CheckCircle2, ChevronRight, Check, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

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

export function KanbanBoard({ initialOrders, tenantId }: KanbanBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  // Update local state when props change
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          // A full production app would re-fetch the data or manually patch the state.
          // For simplicity in UI, we can just reload the page or trigger a router.refresh() 
          // But patching state is faster:
          
          if (payload.eventType === 'INSERT') {
            const newTx = payload.new as any;
            if (['PENDING', 'NEW', 'PROCESSING', 'READY'].includes(newTx.status)) {
              router.refresh(); 
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedTx = payload.new as any;
            setOrders(prev => {
              const exists = prev.find(o => o.id === updatedTx.id);
              if (!exists && ['PENDING', 'NEW', 'PROCESSING', 'READY'].includes(updatedTx.status)) {
                router.refresh();
                return prev;
              }
              
              if (exists && !['PENDING', 'NEW', 'PROCESSING', 'READY'].includes(updatedTx.status)) {
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
  }, [tenantId]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    // Optimistic UI update
    setOrders(prev => {
      if (!['PENDING', 'NEW', 'PROCESSING', 'READY'].includes(newStatus)) {
        return prev.filter(o => o.id !== orderId); // removing from board if completed
      }
      return prev.map(o => {
        if (o.id === orderId) {
          const isConfirming = o.status === 'PENDING' && newStatus === 'NEW';
          return { ...o, status: newStatus, paymentStatus: isConfirming ? 'PAID' : o.paymentStatus };
        }
        return o;
      });
    });

    const res = await updateOrderStatus(orderId, newStatus);
    if (res.error) {
      toast.error(res.error);
      router.refresh(); // Revert
    } else {
      toast.success("Status pesanan diubah.");
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
      router.refresh(); // Revert
    }
  };

  const renderColumn = (title: string, status: string, nextStatus: string, actionText: string, icon: any, color: string) => {
    const columnOrders = orders.filter(o => o.status === status);

    return (
      <div className="flex-1 min-w-[320px] bg-slate-50/50 rounded-xl p-4 flex flex-col h-[calc(100vh-140px)] border">
        <div className={`flex items-center justify-between mb-4 pb-4 border-b-2 ${color}`}>
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            {icon} {title}
          </h3>
          <span className="bg-white text-slate-700 font-bold px-3 py-1 rounded-full shadow-sm border text-sm">
            {columnOrders.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
          {columnOrders.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-sm">
              <span className="text-2xl mb-2 opacity-50">🍽️</span>
              Belum ada pesanan
            </div>
          ) : (
            columnOrders.map(order => (
              <div key={order.id} onClick={() => { setSelectedOrder(order); setIsDialogOpen(true); }} className="cursor-pointer bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${color.replace('border-', 'bg-').split(' ')[0]}`} />
                
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-sm border border-slate-200">
                        {order.orderNumber || '#-'}
                      </span>
                      {order.paymentStatus === 'PAID' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                          Lunas
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-lg text-slate-900">
                      {order.tableNumber ? `Meja ${order.tableNumber}` : order.orderType.replace('_', ' ')}
                    </div>
                    {order.customerName && (
                      <div className="text-sm text-slate-500 font-medium">An. {order.customerName}</div>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 bg-slate-50 border px-2 py-1 rounded-md">
                    {formatDate(order.createdAt).split(' ')[1]}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className={`text-slate-600 ${item.isCompleted ? 'line-through opacity-50' : ''}`}><span className="font-semibold text-slate-900">{item.quantity}x</span> {item.productName}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t flex items-center justify-between">
                  <span className="font-bold text-slate-800">{formatCurrency(Number(order.grandTotal))}</span>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, nextStatus); }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-sm text-white transition-all active:scale-95 shadow-sm ${
                      status === 'PENDING' ? 'bg-purple-600 hover:bg-purple-700' :
                      status === 'NEW' ? 'bg-blue-600 hover:bg-blue-700' :
                      status === 'PROCESSING' ? 'bg-amber-500 hover:bg-amber-600' :
                      'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {actionText} {status === 'READY' ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 h-full">
      {renderColumn('Menunggu Pembayaran', 'PENDING', 'NEW', 'Konfirmasi', <Wallet className="w-5 h-5 text-purple-500" />, 'border-purple-500')}
      {renderColumn('Pesanan Baru', 'NEW', 'PROCESSING', 'Proses', <Clock className="w-5 h-5 text-blue-500" />, 'border-blue-500')}
      {renderColumn('Sedang Dimasak', 'PROCESSING', 'READY', 'Siap', <Utensils className="w-5 h-5 text-amber-500" />, 'border-amber-500')}
      {renderColumn('Siap Disajikan', 'READY', 'COMPLETED', 'Selesai', <CheckCircle2 className="w-5 h-5 text-emerald-500" />, 'border-emerald-500')}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Pesanan {selectedOrder?.orderNumber || ''}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 pt-4">
              <div className="flex justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <div className="text-sm text-slate-500">Tipe Pesanan</div>
                  <div className="font-bold text-slate-800">{selectedOrder.tableNumber ? `Meja ${selectedOrder.tableNumber}` : selectedOrder.orderType.replace('_', ' ')}</div>
                </div>
                {selectedOrder.customerName && (
                  <div className="text-right">
                    <div className="text-sm text-slate-500">Atas Nama</div>
                    <div className="font-bold text-slate-800">{selectedOrder.customerName}</div>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-bold text-slate-800 mb-4 pb-2 border-b flex justify-between">
                  <span>Daftar Menu</span>
                  <span className="text-sm font-normal text-slate-500">
                    {selectedOrder.items.filter(i => i.isCompleted).length} / {selectedOrder.items.length} selesai
                  </span>
                </h4>
                <div className="space-y-4">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                      <Checkbox 
                        id={`item-${item.id}`} 
                        checked={item.isCompleted} 
                        onCheckedChange={(checked) => handleToggleItem(selectedOrder.id, item.id, checked as boolean)}
                        className="mt-1 w-5 h-5"
                      />
                      <label 
                        htmlFor={`item-${item.id}`}
                        className={`flex-1 cursor-pointer leading-tight ${item.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                      >
                        <span className="font-bold mr-2">{item.quantity}x</span> 
                        {item.productName}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <button
                  onClick={() => {
                    const status = selectedOrder.status;
                    const next = status === 'PENDING' ? 'NEW' : status === 'NEW' ? 'PROCESSING' : status === 'PROCESSING' ? 'READY' : 'COMPLETED';
                    handleStatusChange(selectedOrder.id, next);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle2 className="w-5 h-5" /> 
                  {selectedOrder.status === 'PENDING' ? 'Konfirmasi Pembayaran' : 
                   selectedOrder.status === 'NEW' ? 'Mulai Proses Pesanan' :
                   selectedOrder.status === 'PROCESSING' ? 'Tandai Siap Disajikan' : 'Selesaikan Pesanan'}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
