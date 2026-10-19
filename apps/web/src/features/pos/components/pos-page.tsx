'use client';

import * as React from 'react';
import { ProductCatalog } from './product-catalog';
import { ShoppingCart } from './shopping-cart';
import { useCartStore } from '../stores/use-cart-store';
import { toast } from 'sonner';
import { ShoppingBag, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { createTransaction } from '@/lib/actions/transactions';
import { startPosQrisCheckout, type PosQrisSession } from '@/lib/actions/pos-qris';
import { getActiveShift } from '@/lib/actions/shifts';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle
} from '@/components/ui/drawer';
import { PaymentModal } from './payment-modal';
import { QrisPaymentDialog } from './qris-payment-dialog';
import { PaymentSuccessModal } from './payment-success-modal';
import { ReceiptPrinter, ReceiptData } from './receipt-printer';
import { StartShiftModal } from './start-shift-modal';
import { ShiftSummaryModal } from './shift-summary-modal';

type Category = { id: string; name: string; };
type Product = {
  id: string; sku: string; name: string; price: string; stock: number;
  categoryName: string | null; categoryId: string | null; status: string;
  imageUrl: string | null; barcode: string | null;
};

type PaymentData = {
  cashReceived: number;
  change: number;
  paymentMethod: string;
  orderType: string;
  customerName?: string;
  tableNumber?: string;
  discount: number;
  promoCode?: string;
  tax: number;
  serviceCharge: number;
  platformFee: number;
  rounding?: number;
  grandTotal: number;
};

export function POSPage({ 
  initialProducts, 
  initialCategories,
  posSettings,
  modifierGroups,
  activeShift
}: { 
  initialProducts: Product[], 
  initialCategories: Category[],
  posSettings: any,
  modifierGroups?: any[],
  activeShift?: any
}) {
  const [mounted, setMounted] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = React.useState(false);
  const [isStartShiftModalOpen, setIsStartShiftModalOpen] = React.useState(false);
  const [isShiftSummaryOpen, setIsShiftSummaryOpen] = React.useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = React.useState(false);
  const [receiptData, setReceiptData] = React.useState<ReceiptData | null>(null);
  // QRIS dinamis yang sedang ditampilkan ke pelanggan, beserta data pembayarannya untuk struk.
  const [qrisSession, setQrisSession] = React.useState<PosQrisSession | null>(null);
  const qrisPaymentDataRef = React.useRef<PaymentData | null>(null);
  const [printMode, setPrintMode] = React.useState<'all' | 'customer' | 'kitchen'>('all');
  const [currentShift, setCurrentShift] = React.useState(activeShift);
  
  const { items, clearCart, getTotal, getSubtotal } = useCartStore();

  React.useEffect(() => {
    setMounted(true);
    if (initialProducts && initialProducts.length > 0) {
      const mapped = initialProducts.map((p, idx) => ({
        id: p.id,
        imageUrl: p.imageUrl,
        colorIndex: idx,
      }));
      useCartStore.getState().syncProductImages(mapped);
    }
  }, [initialProducts]);

  const handleCheckoutClick = React.useCallback(() => {
    if (items.length === 0) {
      toast.error('Keranjang kosong!');
      return;
    }
    if (!currentShift) {
      toast.warning('Silakan mulai shift terlebih dahulu.');
      setIsStartShiftModalOpen(true);
      return;
    }
    setIsPaymentModalOpen(true);
  }, [items.length, currentShift]);

  const completeCheckout = (transactionId: string, paymentData: PaymentData) => {
    const cashier = currentShift?.cashierName || 'Kasir';
    const newReceipt: ReceiptData = {
      transactionId: transactionId || 'TRX-UNKNOWN',
      date: new Date(),
      cashierName: cashier,
      subtotal: getTotal(),
      discount: paymentData.discount,
      promoCode: paymentData.promoCode,
      tax: paymentData.tax,
      serviceCharge: paymentData.serviceCharge,
      rounding: paymentData.rounding || 0,
      totalAmount: paymentData.grandTotal,
      cashReceived: paymentData.cashReceived,
      change: paymentData.change,
      paymentMethod: paymentData.paymentMethod.toUpperCase(),
      orderType: paymentData.orderType,
      customerName: paymentData.customerName,
      tableNumber: paymentData.tableNumber,
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
        notes: item.notes,
        modifiers: item.modifiers,
      }))
    };

    const initialMode = (posSettings?.kitchenPrintEnabled ?? false) ? 'all' : 'customer';
    setPrintMode(initialMode);
    setReceiptData(newReceipt);
    setIsPaymentModalOpen(false);
    setIsSuccessModalOpen(true);
    clearCart();
  };

  const isSubmittingPaymentRef = React.useRef(false);

  const handleConfirmPayment = async (paymentData: PaymentData) => {
    if (isSubmittingPaymentRef.current) return;
    isSubmittingPaymentRef.current = true;
    setIsProcessing(true);

    const isQrisDynamic = paymentData.paymentMethod === 'qris_dynamic';
    const toastId = toast.loading(isQrisDynamic ? 'Membuat QRIS...' : 'Memproses transaksi...');

    try {
      const payload = {
        totalAmount: getTotal(),
        discount: paymentData.discount,
        promoCode: paymentData.promoCode,
        tax: paymentData.tax,
        serviceCharge: paymentData.serviceCharge,
        platformFee: paymentData.platformFee,
        rounding: paymentData.rounding || 0,
        grandTotal: paymentData.grandTotal,
        paymentMethod: paymentData.paymentMethod,
        customerName: paymentData.customerName,
        tableNumber: paymentData.tableNumber,
        orderType: paymentData.orderType || 'DINE_IN',
        posKitchenSync: posSettings?.posKitchenSync || false,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
          modifiers: item.modifiers,
          notes: item.notes,
        }))
      };

      if (isQrisDynamic) {
        const qris = await startPosQrisCheckout(payload);
        if (qris.success && qris.session) {
          toast.dismiss(toastId);
          qrisPaymentDataRef.current = { ...paymentData, cashReceived: paymentData.grandTotal, change: 0 };
          setIsPaymentModalOpen(false);
          setQrisSession(qris.session);
        } else {
          toast.error(qris.error || 'Gagal membuat QRIS.', { id: toastId });
        }
        return;
      }

      const result = await createTransaction(payload);
      if (result.success && result.transactionId) {
        toast.success('Transaksi berhasil!', { id: toastId });
        completeCheckout(result.transactionId, paymentData);
      } else {
        toast.error(result.error || 'Terjadi kesalahan.', { id: toastId });
      }
    } catch (err: any) {
      console.error('Error in handleConfirmPayment:', err);
      toast.dismiss(toastId);
      toast.error(err?.message || 'Gagal memproses transaksi. Silakan coba lagi.', { id: toastId });
    } finally {
      setIsProcessing(false);
      isSubmittingPaymentRef.current = false;
    }
  };

  const handleQrisPaid = (transactionId: string) => {
    const paymentData = qrisPaymentDataRef.current;
    setQrisSession(null);
    qrisPaymentDataRef.current = null;
    if (paymentData) completeCheckout(transactionId, paymentData);
  };

  const handleQrisCancelled = () => {
    setQrisSession(null);
    qrisPaymentDataRef.current = null;
    // Keranjang tetap utuh; buka lagi pilihan metode pembayaran.
    setIsPaymentModalOpen(true);
  };

  const handlePrint = (mode: 'all' | 'customer' | 'kitchen') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4' && !isPaymentModalOpen && !isSuccessModalOpen && !qrisSession) {
        e.preventDefault();
        handleCheckoutClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, isPaymentModalOpen, isSuccessModalOpen, qrisSession, handleCheckoutClick]);

  const totalItems = mounted ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const cartSubtotal = mounted ? getSubtotal() : 0;
  const discount = mounted ? useCartStore.getState().discount : 0;
  const taxRate = parseFloat(posSettings?.posTaxRate || '0');
  const serviceRate = parseFloat(posSettings?.serviceChargeRate || '0');
  const taxableSubtotal = Math.max(0, cartSubtotal - discount);
  const serviceChargeAmount = serviceRate > 0 ? (taxableSubtotal * serviceRate) / 100 : 0;
  const taxAmount = taxRate > 0 ? (taxableSubtotal * taxRate) / 100 : 0;
  const rawTotal = taxableSubtotal + serviceChargeAmount + taxAmount;
  let roundingAmount = 0;
  if (posSettings?.posRounding) {
    const roundedInt = Math.round(rawTotal);
    const remainder = roundedInt % 100;
    if (remainder > 0) {
      roundingAmount = 100 - remainder;
    }
  }
  const cartGrandTotal = Math.round(rawTotal) + roundingAmount;

  return (
    <>
      <div className="flex flex-col h-full relative print:hidden w-full overflow-hidden">
        {/* Cashier Shift Status Banner */}
        {currentShift ? (
          <div className="mb-3 px-3.5 py-2 rounded-xl bg-white border border-[#EAEFF8] flex items-center justify-between text-xs shadow-2xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-semibold text-slate-800 shrink-0">Shift Aktif</span>
              <span className="text-slate-300 shrink-0">•</span>
              <span className="text-slate-600 truncate">{currentShift.cashierName || 'Kasir'}</span>
              {currentShift.startTime && (
                <>
                  <span className="text-slate-300 shrink-0 hidden sm:inline">•</span>
                  <span className="text-slate-500 font-financial tabular-nums shrink-0 hidden sm:inline">
                    Mulai {new Date(currentShift.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsShiftSummaryOpen(true)}
              className="text-[11px] font-semibold text-[#0e59f9] hover:text-[#0b4de0] transition-colors cursor-pointer shrink-0 ml-2"
            >
              Ringkasan & Tutup Shift ➔
            </button>
          </div>
        ) : (
          <div className="mb-3 px-3.5 py-2 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between text-xs shadow-2xs shrink-0">
            <div className="flex items-center gap-2 text-amber-900 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-semibold shrink-0">Shift Belum Dibuka</span>
              <span className="text-amber-700/90 truncate hidden md:inline">— Buka shift kasir untuk mencatat kas awal dan transaksi.</span>
            </div>
            <button
              type="button"
              onClick={() => setIsStartShiftModalOpen(true)}
              className="text-[11px] font-semibold px-3 py-1 rounded-lg bg-[#0e59f9] hover:bg-[#0b4de0] text-white transition-colors cursor-pointer shadow-xs shrink-0 ml-2"
            >
              Mulai Shift Kasir
            </button>
          </div>
        )}

        {/* Main Workspace (Catalog + Cart) */}
        <div className="flex-1 min-w-0 flex overflow-hidden">
          <div className="flex-1 min-w-0 h-full pb-16 lg:pb-0">
            <ProductCatalog products={initialProducts} categories={initialCategories} modifierGroups={modifierGroups || []} />
          </div>

          {/* Desktop Cart Sidebar */}
          <div className="hidden lg:block w-[320px] xl:w-[360px] 2xl:w-[400px] h-full flex-shrink-0 ml-4 lg:ml-6">
            <ShoppingCart 
              posSettings={posSettings} 
              onCheckout={handleCheckoutClick} 
              isProcessing={isProcessing} 
            />
          </div>
        </div>

        {/* Mobile Cart Floating Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur-sm border-t border-[#EAEFF8] z-20 shadow-xs">
          <Drawer open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
            <DrawerTrigger asChild>
              <button className="w-full h-12 bg-[#0e59f9] hover:bg-[#0b4de0] text-white rounded-xl flex items-center justify-between px-4 font-semibold shadow-xs active:scale-[0.98] transition-transform cursor-pointer">
                <div className="flex items-center">
                  <div className="relative">
                    <ShoppingBag size={18} />
                    {totalItems > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[10px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center font-semibold font-financial tabular-nums">
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <span className="ml-2.5 text-xs">Lihat Pesanan</span>
                </div>
                <span className="text-sm font-semibold font-financial tabular-nums">{formatCurrency(cartGrandTotal)}</span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="h-[88vh] p-0 flex flex-col">
              <DrawerTitle className="sr-only">Keranjang Belanja</DrawerTitle>
              <div className="flex-1 overflow-hidden p-2">
                <ShoppingCart 
                  posSettings={posSettings} 
                  onCheckout={() => {
                    setIsMobileCartOpen(false);
                    handleCheckoutClick();
                  }} 
                  isProcessing={isProcessing} 
                />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        subtotalAmount={cartSubtotal}
        onConfirm={handleConfirmPayment}
        posSettings={posSettings}
      />

      <QrisPaymentDialog
        session={qrisSession}
        onPaid={handleQrisPaid}
        onCancelled={handleQrisCancelled}
      />

      <PaymentSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        receiptData={receiptData}
        posSettings={posSettings}
        onPrint={handlePrint}
      />
      
      <StartShiftModal
        isOpen={isStartShiftModalOpen}
        onClose={() => setIsStartShiftModalOpen(false)}
        onSuccess={async () => {
          const shiftRes = await getActiveShift();
          if (shiftRes.success) {
            setCurrentShift(shiftRes.data);
          }
        }}
      />

      <ShiftSummaryModal
        isOpen={isShiftSummaryOpen}
        onClose={() => setIsShiftSummaryOpen(false)}
        shiftData={currentShift}
        onShiftClosed={() => {
          setCurrentShift(null);
        }}
      />
      
      <ReceiptPrinter data={receiptData} settings={posSettings} printMode={printMode} />
    </>
  );
}
