'use client';

import * as React from 'react';
import { ProductCatalog } from './product-catalog';
import { ShoppingCart } from './shopping-cart';
import { useCartStore } from '../stores/use-cart-store';
import { toast } from 'sonner';
import { ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { createTransaction } from '@/lib/actions/transactions';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle
} from '@/components/ui/drawer';
import { PaymentModal } from './payment-modal';
import { ReceiptPrinter, ReceiptData } from './receipt-printer';

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
  modifierGroups
}: { 
  initialProducts: Product[], 
  initialCategories: Category[],
  posSettings: any,
  modifierGroups?: any[]
}) {
  const [mounted, setMounted] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  const [receiptData, setReceiptData] = React.useState<ReceiptData | null>(null);
  
  const { items, clearCart, getTotal } = useCartStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleCheckoutClick = () => {
    if (items.length === 0) {
      toast.error('Keranjang kosong!');
      return;
    }
    setIsPaymentModalOpen(true);
  };

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
      
      // Prepare receipt data
      const newReceipt: ReceiptData = {
        transactionId: result.transactionId || 'TRX-UNKNOWN',
        date: new Date(),
        cashierName: 'Kasir',
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
        }))
      };
      
      setReceiptData(newReceipt);
      setIsPaymentModalOpen(false);
      clearCart();
      
      // Delay printing to allow React to render the receipt DOM
      setTimeout(() => {
        window.print();
      }, 300);
      
    } else {
      toast.error(result.error || 'Terjadi kesalahan.', { id: toastId });
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4' && !isPaymentModalOpen) {
        e.preventDefault();
        handleCheckoutClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items]);

  const totalItems = mounted ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const cartTotal = mounted ? getTotal() : 0;

  return (
    <>
      <div className="flex h-full relative print:hidden w-full overflow-hidden">
        <div className="flex-1 min-w-0 h-full pb-20 lg:pb-0">
          <ProductCatalog products={initialProducts} categories={initialCategories} modifierGroups={modifierGroups || []} />
        </div>

        <div className="hidden lg:block w-[300px] xl:w-[350px] 2xl:w-[400px] h-full flex-shrink-0 ml-4 lg:ml-6 relative">
        <div className="h-full pb-[140px]">
          <ShoppingCart />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-background border-t p-4 pt-4 z-10">
          <div className="flex justify-between text-lg font-bold mb-4">
            <span>Total:</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
          <button 
            onClick={handleCheckoutClick}
            disabled={totalItems === 0 || isProcessing}
            className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Bayar Sekarang (F4)
          </button>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <Drawer>
          <DrawerTrigger asChild>
            <button className="w-full h-14 bg-primary text-primary-foreground rounded-xl flex items-center justify-between px-6 font-semibold shadow-md active:scale-95 transition-transform">
              <div className="flex items-center">
                <div className="relative">
                  <ShoppingBag size={20} />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-destructive text-white text-[10px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </div>
                <span className="ml-3">Lihat Keranjang</span>
              </div>
              <span className="text-lg">{formatCurrency(cartTotal)}</span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="h-[85vh] p-0 flex flex-col">
            <DrawerTitle className="sr-only">Keranjang Belanja</DrawerTitle>
            <div className="flex-1 overflow-hidden">
              <ShoppingCart />
            </div>
            <div className="p-4 border-t bg-background mt-auto">
              <button 
                onClick={handleCheckoutClick}
                disabled={totalItems === 0 || isProcessing}
                className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-bold shadow-md disabled:opacity-50"
              >
                Bayar Sekarang
              </button>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        subtotalAmount={cartTotal}
        onConfirm={handleConfirmPayment}
        posSettings={posSettings}
      />
      
      <ReceiptPrinter data={receiptData} />
    </>
  );
}
