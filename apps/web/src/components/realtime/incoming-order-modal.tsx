"use client";

import { useRealtimeOrder } from "@/components/providers/realtime-order-provider";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { updateOrderStatus } from "@/lib/actions/orders";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Loader2, ChefHat, Check, User, Hash, X, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function IncomingOrderModal({ activeOrders }: { activeOrders: any[] }) {
  const { incomingOrders, acceptOrder, dismissPopup } = useRealtimeOrder();
  const [isLoading, setIsLoading] = useState(false);

  // We process them one by one (FIFO). The first order in the array is shown.
  const currentOrder = activeOrders[0];

  useEffect(() => {
    if (!currentOrder) return;
    // Auto-dismiss after 5 seconds to not block the screen permanently
    const timer = setTimeout(() => {
      dismissPopup(currentOrder.id);
    }, 5000);
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
    <div 
      className="fixed top-20 right-6 flex flex-col gap-3 pointer-events-none w-full max-w-[360px]"
      style={{ zIndex: 999999 }}
    >
      <AnimatePresence mode="popLayout">
        <motion.div 
          key={currentOrder.id}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl overflow-hidden relative flex flex-col"
        >
          {/* Top color bar */}
          <div className="h-1.5 w-full bg-blue-600" />
          
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 text-blue-700 p-1.5 rounded-lg shadow-sm">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm leading-none tracking-tight">Pesanan Baru</h3>
                  <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">{currentOrder.orderType.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeOrders.length > 1 && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    1 of {activeOrders.length}
                  </span>
                )}
                <button 
                  onClick={() => dismissPopup(currentOrder.id)} 
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customer Info */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100/80 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="text-slate-400">
                  {currentOrder.tableNumber ? <Hash className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {currentOrder.tableNumber ? 'Meja' : 'Pelanggan'}
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {currentOrder.tableNumber || currentOrder.customerName || 'Tamu'}
                  </span>
                </div>
              </div>
              <div className="text-right flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total</span>
                <span className="font-black text-blue-600 text-sm">{formatCurrency(Number(currentOrder.grandTotal))}</span>
              </div>
            </div>

            {/* Item List */}
            <div className="space-y-2 max-h-[100px] overflow-y-auto pr-2 text-xs scrollbar-thin scrollbar-thumb-slate-200">
              {currentOrder.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] min-w-[24px] text-center">{item.quantity}x</span> 
                    <span className="font-semibold text-slate-700">{item.productName}</span>
                  </div>
                  <span className="text-slate-500 font-medium whitespace-nowrap ml-2">{formatCurrency(Number(item.subtotal))}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button 
                onClick={() => dismissPopup(currentOrder.id)} 
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" /> Nanti Saja
              </button>
              <button 
                onClick={handleAccept} 
                disabled={isLoading}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 border-2 border-blue-600 rounded-xl hover:bg-blue-700 hover:border-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" /> 
                )}
                Terima
              </button>
            </div>
          </div>

          {/* Progress Bar (Timer) */}
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 5, ease: "linear" }}
            className="absolute bottom-0 left-0 h-1 bg-blue-400"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
