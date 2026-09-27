"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { getOrderById } from "@/lib/actions/orders";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import { IncomingOrderModal } from "@/components/realtime/incoming-order-modal";

type Order = any; // We'll just use any for brevity, or define the exact type if needed.

type RealtimeOrderContextType = {
  incomingOrders: Order[];
  acceptOrder: (orderId: string) => void;
  dismissPopup: (orderId: string) => void;
};

const RealtimeOrderContext = createContext<RealtimeOrderContextType | undefined>(undefined);

export function useRealtimeOrder() {
  const context = useContext(RealtimeOrderContext);
  if (!context) {
    throw new Error("useRealtimeOrder must be used within a RealtimeOrderProvider");
  }
  return context;
}

export function RealtimeOrderProvider({ children, tenantId }: { children: ReactNode; tenantId: string }) {
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  const [dismissedPopupIds, setDismissedPopupIds] = useState<Set<string>>(new Set());
  const notifiedOrderIdsRef = useState(() => new Set<string>())[0];

  useEffect(() => {
    if (!tenantId) return;

    const supabase = createClient();

    const channel = supabase
      .channel('global-incoming-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `tenant_id=eq.${tenantId}`
        },
        async (payload: any) => {
          const tx = payload.new as any;
          if (!tx) return;

          const isNewInsert = payload.eventType === 'INSERT' && tx.status === 'NEW';
          const isPaidUpdate = payload.eventType === 'UPDATE' && tx.status === 'NEW';
          const isPendingInsert = payload.eventType === 'INSERT' && tx.status === 'PENDING';

          if (isNewInsert || isPaidUpdate || isPendingInsert) {
            // Check if already in queue
            setIncomingOrders(prev => {
              if (prev.find(o => o.id === tx.id)) return prev;
              return prev; // We don't add it yet until we fetch the items
            });

            // Wait 500ms to allow transactionItems to be inserted on the server
            await new Promise(resolve => setTimeout(resolve, 500));

            // Fetch full order with items
            const fullOrder = await getOrderById(tx.id);
            if (fullOrder && (fullOrder.status === 'NEW' || fullOrder.status === 'PENDING')) {
              setIncomingOrders(prev => {
                const existingIndex = prev.findIndex(o => o.id === fullOrder.id);
                if (existingIndex >= 0) {
                  const newOrders = [...prev];
                  newOrders[existingIndex] = fullOrder;
                  return newOrders;
                }
                return [...prev, fullOrder];
              });

              if (isPendingInsert) {
                setDismissedPopupIds(prev => {
                  const newSet = new Set(prev);
                  newSet.add(fullOrder.id); // dismiss popup for pending
                  return newSet;
                });
              } else {
                setDismissedPopupIds(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(fullOrder.id); // show popup for NEW
                  return newSet;
                });

                // Deduplicate: only play audio and show toast ONCE per order ID
                if (!notifiedOrderIdsRef.has(fullOrder.id)) {
                  notifiedOrderIdsRef.add(fullOrder.id);
                  toast.success(`Pesanan Baru Masuk! #${fullOrder.orderNumber || fullOrder.id.slice(0, 6).toUpperCase()}`);
                  try {
                    const audio = new Audio('/notification.mp3');
                    audio.play().catch(e => console.log('Audio auto-play blocked', e));
                  } catch (e) {
                    console.log('Audio notification error', e);
                  }
                }
              }
              
              if (pathname.includes('/pos') || pathname.includes('/transactions') || pathname.includes('/orders')) {
                router.refresh();
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            // If the order status is no longer NEW or PENDING, remove it from queue (e.g. accepted on another device)
            if (tx.status !== 'NEW' && tx.status !== 'PENDING') {
              setIncomingOrders(prev => prev.filter(o => o.id !== tx.id));
              setDismissedPopupIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(tx.id);
                return newSet;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, router, pathname, notifiedOrderIdsRef]);

  // Actually accepts and updates DB, removing from both
  const acceptOrder = (orderId: string) => {
    setIncomingOrders(prev => prev.filter(o => o.id !== orderId));
    setDismissedPopupIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(orderId);
      return newSet;
    });
    router.refresh();
  };

  // Only hides the popup, leaves it in the badge
  const dismissPopup = (orderId: string) => {
    setDismissedPopupIds(prev => {
      const newSet = new Set(prev);
      newSet.add(orderId);
      return newSet;
    });
  };

  const activePopupOrders = incomingOrders.filter(o => !dismissedPopupIds.has(o.id));

  return (
    <RealtimeOrderContext.Provider value={{ incomingOrders, acceptOrder, dismissPopup }}>
      {children}
      {activePopupOrders.length > 0 && <IncomingOrderModal activeOrders={activePopupOrders} />}
    </RealtimeOrderContext.Provider>
  );
}
