'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency } from '@/lib/utils/format';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export type ReceiptData = {
  transactionId: string;
  date: Date;
  cashierName: string;
  subtotal?: number;
  discount?: number;
  promoCode?: string;
  tax?: number;
  serviceCharge?: number;
  totalAmount: number;
  cashReceived: number;
  change: number;
  paymentMethod?: string;
  orderType?: string;
  customerName?: string;
  tableNumber?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
};

interface ReceiptPrinterProps {
  data: ReceiptData | null;
}

export const ReceiptPrinter = React.forwardRef<HTMLDivElement, ReceiptPrinterProps>(
  ({ data }, ref) => {
    const [mounted, setMounted] = React.useState(false);
    const [pageHeight, setPageHeight] = React.useState('auto');
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    React.useEffect(() => {
      if (mounted && data && contentRef.current) {
        setTimeout(() => {
          if (contentRef.current) {
            const height = contentRef.current.offsetHeight + 30;
            setPageHeight(`${height}px`);
          }
        }, 150);
      }
    }, [data, mounted]);

    if (!data || !mounted) return null;

    const itemsSubtotal = data.subtotal || data.items.reduce((acc, item) => acc + item.subtotal, 0);

    const receiptContent = (
      <div 
        id="receipt-portal-container"
        ref={ref} 
      >
        <style>{`
          #receipt-portal-container {
            position: absolute;
            top: -9999px;
            left: -9999px;
            visibility: hidden;
            width: 58mm;
            background: white;
            color: black;
          }

          @media print {
            @page {
              margin: 0;
              size: 58mm ${pageHeight};
            }
            body {
              margin: 0;
              padding: 0;
              background-color: white !important;
            }
            body > *:not(#receipt-portal-container) {
              display: none !important;
            }
            #receipt-portal-container {
              position: static;
              visibility: visible;
            }
          }
          
          .receipt-container {
            width: 100%;
            margin: 0 auto;
            padding: 2mm;
            font-family: 'Consolas', 'Monaco', 'Bitstream Vera Sans Mono', monospace;
            font-size: 11px;
            line-height: 1.3;
            color: black;
            text-transform: uppercase;
          }
          .receipt-divider {
            border-top: 1px dashed black;
            margin: 5px 0;
          }
          .receipt-text-center { text-align: center; }
          .receipt-text-right { text-align: right; }
          .receipt-text-left { text-align: left; }
          .receipt-flex-between { display: flex; justify-content: space-between; }
        `}</style>
        
        <div id="print-area" className="receipt-container" ref={contentRef}>
          {/* Header */}
          <div className="receipt-text-center" style={{ marginBottom: '10px' }}>
            <img 
              src="/logo-menuin-memanjang.svg" 
              alt="Logo Menuin" 
              style={{ width: '50px', height: '50px', margin: '0 auto 6px auto', filter: 'grayscale(100%) contrast(200%)' }}
            />
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Toko Oleh Oleh Anisa</div>
            <div>Jl. Beringin</div>
            <div>Instagram : bolu_anisa</div>
          </div>

          {/* Transaction Info */}
          <div style={{ marginBottom: '6px' }}>
            <div className="receipt-flex-between">
              <span>Kasir</span>
              <span>{data.cashierName || 'Kasir'}</span>
            </div>
            <div className="receipt-flex-between">
              <span>Waktu</span>
              <span>{format(data.date, 'dd/MM/yy HH:mm', { locale: id })}</span>
            </div>
            <div className="receipt-flex-between">
              <span>No. Struk</span>
              <span>{data.transactionId.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="receipt-flex-between">
              <span>Channel</span>
              <span>{data.orderType || 'DINE_IN'}</span>
            </div>
            {data.customerName && (
              <div className="receipt-flex-between">
                <span>Pelanggan</span>
                <span>{data.customerName}</span>
              </div>
            )}
            {data.tableNumber && (
              <div className="receipt-flex-between">
                <span>Meja</span>
                <span>{data.tableNumber}</span>
              </div>
            )}
            <div className="receipt-flex-between">
              <span>Metode</span>
              <span>{data.paymentMethod || 'TUNAI'}</span>
            </div>
          </div>

          <div className="receipt-divider" />

          {/* Items */}
          <div style={{ margin: '5px 0' }}>
            {data.items.map((item, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                <div style={{ marginBottom: '1px' }}>{item.name}</div>
                <div className="receipt-flex-between">
                  <span>{formatCurrency(item.price).replace('Rp','').trim()} x {item.quantity}</span>
                  <span>{formatCurrency(item.subtotal).replace('Rp','').trim()}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="receipt-divider" />

          {/* Subtotal */}
          <div className="receipt-flex-between" style={{ margin: '3px 0' }}>
            <span>Subtotal</span>
            <span>{formatCurrency(itemsSubtotal).replace('Rp','').trim()}</span>
          </div>

          {/* Discounts */}
          {(data.discount ?? 0) > 0 && (
            <div className="receipt-flex-between" style={{ margin: '3px 0' }}>
              <span>Diskon {data.promoCode ? `(${data.promoCode})` : ''}</span>
              <span>-{formatCurrency(data.discount || 0).replace('Rp','').trim()}</span>
            </div>
          )}

          {/* Tax */}
          {(data.tax ?? 0) > 0 && (
            <div className="receipt-flex-between" style={{ margin: '3px 0' }}>
              <span>Pajak</span>
              <span>+{formatCurrency(data.tax || 0).replace('Rp','').trim()}</span>
            </div>
          )}

          {/* Service Charge */}
          {(data.serviceCharge ?? 0) > 0 && (
            <div className="receipt-flex-between" style={{ margin: '3px 0' }}>
              <span>Layanan</span>
              <span>+{formatCurrency(data.serviceCharge || 0).replace('Rp','').trim()}</span>
            </div>
          )}

          <div className="receipt-divider" />

          {/* Grand Total */}
          <div className="receipt-flex-between" style={{ margin: '5px 0', fontWeight: 'bold' }}>
            <span>TOTAL TAGIHAN</span>
            <span>{formatCurrency(data.totalAmount).replace('Rp','').trim()}</span>
          </div>

          <div className="receipt-divider" />

          {/* Payment */}
          <div style={{ margin: '6px 0' }}>
            <div className="receipt-flex-between" style={{ marginBottom: '2px' }}>
              <span>Bayar</span>
              <span>{formatCurrency(data.cashReceived).replace('Rp','').trim()}</span>
            </div>
            <div className="receipt-flex-between">
              <span>Kembali</span>
              <span>{formatCurrency(data.change).replace('Rp','').trim()}</span>
            </div>
          </div>

          <div style={{ height: '12px' }} />

          {/* Footer */}
          <div className="receipt-text-center" style={{ marginBottom: '10px' }}>
            <div style={{ marginBottom: '2px' }}>TERIMA KASIH</div>
            <div>SELAMAT BERBELANJA KEMBALI</div>
          </div>
        </div>
      </div>
    );

    return createPortal(receiptContent, document.body);
  }
);

ReceiptPrinter.displayName = 'ReceiptPrinter';
