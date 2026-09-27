'use client';

import * as React from 'react';
import { ProductCatalog } from './product-catalog';
import { ShoppingCart } from './shopping-cart';
import { useCartStore } from '../stores/use-cart-store';
import { toast } from 'sonner';
import { ShoppingBag, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { createTransaction } from '@/lib/actions/transactions';
import { getActiveShift } from '@/lib/actions/shifts';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle
} from '@/components/ui/drawer';
import { PaymentModal } from './payment-modal';
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

  const handleConfirmPayment = async (paymentData: {
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
    grandTotal: number;
  }) => {
    setIsProcessing(true);
    const toastId = toast.loading('Memproses transaksi...');

    const payload = {
      totalAmount: getTotal(),
      discount: paymentData.discount,
      promoCode: paymentData.promoCode,
      tax: paymentData.tax,
      serviceCharge: paymentData.serviceCharge,
      platformFee: paymentData.platformFee,
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

    const result = await createTransaction(payload);
    setIsProcessing(false);

    if (result.success && result.transactionId) {
      toast.success('Transaksi berhasil!', { id: toastId });
      
      const cashier = currentShift?.cashierName || 'Kasir';
      const newReceipt: ReceiptData = {
        transactionId: result.transactionId || 'TRX-UNKNOWN',
        date: new Date(),
        cashierName: cashier,
        subtotal: getTotal(),
        discount: paymentData.discount,
        promoCode: paymentData.promoCode,
        tax: paymentData.tax,
        serviceCharge: paymentData.serviceCharge,
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
    } else {
      toast.error(result.error || 'Terjadi kesalahan.', { id: toastId });
    }
  };

  const handlePrint = (mode: 'all' | 'customer' | 'kitchen') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4' && !isPaymentModalOpen && !isSuccessModalOpen) {
        e.preventDefault();
        handleCheckoutClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, isPaymentModalOpen, isSuccessModalOpen, handleCheckoutClick]);

  const totalItems = mounted ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const cartSubtotal = mounted ? getSubtotal() : 0;
  const discount = mounted ? useCartStore.getState().discount : 0;
  const taxRate = parseFloat(posSettings?.posTaxRate || '0');
  const serviceRate = parseFloat(posSettings?.serviceChargeRate || '0');
  const taxableSubtotal = Math.max(0, cartSubtotal - discount);
  const serviceChargeAmount = serviceRate > 0 ? (taxableSubtotal * serviceRate) / 100 : 0;
  const taxAmount = taxRate > 0 ? (taxableSubtotal * taxRate) / 100 : 0;
  const cartGrandTotal = taxableSubtotal + serviceChargeAmount + taxAmount;

  return (
    <>
      <div className="flex flex-col h-full relative print:hidden w-full overflow-hidden">
        {/* Cashier Shift Status Banner */}
        

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
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur-sm border-t border-border/80 z-20 shadow-xs">
          <Drawer open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
            <DrawerTrigger asChild>
              <button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-between px-4 font-semibold shadow-xs active:scale-[0.98] transition-transform cursor-pointer">
                <div className="flex items-center">
                  <div className="relative">
                    <ShoppingBag size={18} />
                    {totalItems > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[10px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center font-semibold">
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <span className="ml-2.5 text-xs">Lihat Pesanan</span>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(cartGrandTotal)}</span>
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
