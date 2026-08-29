"use client";

import { useRealtimeOrder } from "@/components/providers/realtime-order-provider";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { updateOrderStatus } from "@/lib/actions/orders";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Loader2, ChefHat, Check, User, Hash, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function IncomingOrderModal({ activeOrders }: { activeOrders: any[] }) {
  const { incomingOrders, acceptOrder, dismissPopup } = useRealtimeOrder();
  const [isLoading, setIsLoading] = useState(false);

  // We process them one by one (FIFO). The first order in the array is shown.
  const currentOrder = activeOrders[0];

  useEffect(() => {
    if (!currentOrder) return;
    // Auto-dismiss after 3 seconds to not block the screen
    const timer = setTimeout(() => {
      dismissPopup(currentOrder.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [currentOrder, dismissPopup]);

  if (!currentOrder) return null;

  const handleAccept = async () => {
    setIsLoading(true);
    const res = await updateOrderStatus(currentOrder.id, 'PROCESSING');
    setIsLoading(false);
    
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Pesanan diterima dan mulai diproses.");
      acceptOrder(currentOrder.id); // Remove from queue locally
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentOrder.id}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 relative"
        >
          {/* Header */}
          <div className="bg-blue-600 p-6 text-white flex flex-col items-center justify-center text-center relative overflow-hidden">
            <button 
              onClick={() => dismissPopup(currentOrder.id)}
              className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 p-2 rounded-full transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
            <div className="bg-white/20 p-3 rounded-full mb-3 backdrop-blur-sm relative z-10">
              <ChefHat className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black tracking-tight relative z-10">PESANAN BARU MASUK!</h2>
            <p className="font-medium text-blue-100 mt-1 relative z-10">{currentOrder.orderType.replace('_', ' ')}</p>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  {currentOrder.tableNumber ? <Hash className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    {currentOrder.tableNumber ? 'Meja' : 'Pelanggan'}
                  </p>
                  <p className="font-bold text-slate-900 text-lg leading-tight">
                    {currentOrder.tableNumber ? currentOrder.tableNumber : (currentOrder.customerName || 'Tamu')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Waktu Pesan</p>
                <p className="font-bold text-slate-900 leading-tight">
                  {formatDate(currentOrder.createdAt).split(' ')[1]}
                </p>
              </div>
            </div>

            <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2 scrollbar-hide">
              <h3 className="font-bold text-slate-800 border-b pb-2">Daftar Item:</h3>
              {currentOrder.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start text-sm">
                  <div className="flex gap-3">
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md min-w-[28px] text-center">{item.quantity}x</span> 
                    <span className="font-semibold text-slate-700">{item.productName}</span>
                  </div>
                  <span className="text-slate-500 font-medium">{formatCurrency(Number(item.subtotal))}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-dashed flex justify-between items-center">
              <span className="text-slate-500 font-bold">Total Pembayaran</span>
              <span className="text-2xl font-black text-blue-600">{formatCurrency(Number(currentOrder.grandTotal))}</span>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 bg-slate-50 border-t flex flex-col gap-3 relative pb-5">
            <button
              onClick={handleAccept}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex justify-center items-center gap-2 text-lg disabled:opacity-70"
            >
              {isLoading ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Memproses...</>
              ) : (
                <><Check className="w-6 h-6" /> Terima & Mulai Dimasak</>
              )}
            </button>
            {incomingOrders.length > 1 && (
              <p className="text-center text-xs font-bold text-slate-500">
                + {incomingOrders.length - 1} pesanan lainnya menunggu...
              </p>
            )}
            
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3, ease: "linear" }}
              className="absolute bottom-0 left-0 h-1.5 bg-blue-500"
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
