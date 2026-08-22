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
  totalAmount: number;
  cashReceived: number;
  change: number;
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

    // Trik "Nakal" untuk mengakali printer A4:
    // Kita hitung tinggi fisik elemen struk ini di layar (dalam pixel),
    // lalu kita paksa Google Chrome untuk menganggap panjang kertasnya adalah persis sama dengan panjang struk!
    React.useEffect(() => {
      if (mounted && data && contentRef.current) {
        setTimeout(() => {
          if (contentRef.current) {
            // offsetHeight mengambil tinggi total konten. Kita tambah sedikit buffer (30px) agar tidak terlalu mepet.
            const height = contentRef.current.offsetHeight + 30;
            setPageHeight(`${height}px`);
          }
        }, 150);
      }
    }, [data, mounted]);

    if (!data || !mounted) return null;

    const receiptContent = (
      <div 
        id="receipt-portal-container"
        ref={ref} 
      >
        <style>{`
          /* Sembunyikan dari layar normal, tapi biarkan tetap di-render agar bisa dihitung tingginya */
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
              /* INI DIA TRIKNYA! Kita berikan ukuran halaman persis setinggi struk */
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
            padding: 2mm; /* Reduced padding slightly to give more room */
            font-family: 'Consolas', 'Monaco', 'Bitstream Vera Sans Mono', monospace;
            font-size: 12px; /* Reduced from 14px to 11px */
            line-height: 1.3;
            color: black;
            text-transform: uppercase;
          }
          .receipt-divider {
            border-top: 1px dashed black;
            margin: 6px 0;
          }
          .receipt-text-center { text-align: center; }
          .receipt-text-right { text-align: right; }
          .receipt-text-left { text-align: left; }
          .receipt-flex-between { display: flex; justify-content: space-between; }
        `}</style>
        
        <div id="print-area" className="receipt-container" ref={contentRef}>
          {/* Header */}
          <div className="receipt-text-center" style={{ marginBottom: '12px' }}>
            <img 
              src="/logo-bolu-anisa.svg" 
              alt="Logo Bolu Anisa" 
              style={{ width: '60px', height: '60px', margin: '0 auto 8px auto', filter: 'grayscale(100%) contrast(200%)' }}
            />
            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Toko Oleh Oleh Anisa</div>
            
            <div>Jl. Beringin</div>
            <div>Instagram : bolu_anisa</div>
          </div>

          {/* Transaction Info */}
          <div style={{ marginBottom: '8px' }}>
            <div className="receipt-flex-between">
              <span>Kasir</span>
              <span>{data.cashierName || 'Bolu Anisa'}</span>
            </div>
            <div className="receipt-flex-between">
              <span>Waktu</span>
              <span>{format(data.date, 'dd MMM yyyy, HH:mm', { locale: id })}</span>
            </div>
            <div className="receipt-flex-between">
              <span>No. Struk</span>
              <span>{data.transactionId.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="receipt-flex-between">
              <span>Bayar</span>
              <span>Tunai</span>
            </div>
          </div>

          <div className="receipt-divider" />
          
          <div className="receipt-text-center" style={{ margin: '6px 0' }}>
            <span>### SALINAN ###</span>
          </div>

          <div className="receipt-divider" />

          {/* Items */}
          <div style={{ margin: '6px 0' }}>
            {data.items.map((item, index) => (
              <div key={index} style={{ marginBottom: '6px' }}>
                <div style={{ marginBottom: '2px' }}>{item.name}</div>
                <div className="receipt-flex-between">
                  <span>{formatCurrency(item.price).replace('Rp','').trim()} x {item.quantity}</span>
                  <span>{formatCurrency(item.subtotal).replace('Rp','').trim()}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="receipt-divider" />

          {/* Subtotal */}
          <div className="receipt-flex-between" style={{ margin: '6px 0' }}>
            <span>Subtotal</span>
            <span>{formatCurrency(data.totalAmount).replace('Rp','').trim()}</span>
          </div>

          <div className="receipt-divider" />

          {/* Total */}
          <div className="receipt-flex-between" style={{ margin: '6px 0' }}>
            <span>Total ({data.items.reduce((acc, item) => acc + item.quantity, 0)})</span>
            <span>{formatCurrency(data.totalAmount).replace('Rp','').trim()}</span>
          </div>

          <div className="receipt-divider" />

          {/* Payment */}
          <div style={{ margin: '8px 0' }}>
            <div className="receipt-flex-between" style={{ marginBottom: '2px' }}>
              <span>Bayar</span>
              <span>{formatCurrency(data.cashReceived).replace('Rp','').trim()}</span>
            </div>
            <div className="receipt-flex-between">
              <span>Kembali</span>
              <span>{formatCurrency(data.change).replace('Rp','').trim()}</span>
            </div>
          </div>

          <div style={{ height: '16px' }} />

          {/* Footer */}
          <div className="receipt-text-center" style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '2px' }}>TERIMA KASIH</div>
            <div>SELAMAT BELANJA KEMBALI</div>
          </div>
        </div>
      </div>
    );

    return createPortal(receiptContent, document.body);
  }
);

ReceiptPrinter.displayName = 'ReceiptPrinter';
