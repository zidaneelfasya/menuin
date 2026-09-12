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
    modifiers?: any[];
    notes?: string | null;
  }[];
};

export type TenantReceiptSettings = {
  name?: string;
  storeLogoUrl?: string | null;
  storeDescription?: string | null;
  receiptHeader?: string | null;
  receiptFooter?: string | null;
  receiptLogoUrl?: string | null;
  receiptShowLogo?: boolean;
  receiptShowCustomer?: boolean;
  receiptShowCashier?: boolean;
  receiptShowTable?: boolean;
  receiptShowNotes?: boolean;
  receiptCustomNote?: string | null;
  // Kitchen Ticket Settings
  kitchenPrintEnabled?: boolean;
  kitchenTicketTitle?: string | null;
  kitchenTicketNotes?: string | null;
  kitchenShowCustomer?: boolean;
  kitchenShowCashier?: boolean;
  kitchenShowTable?: boolean;
  kitchenShowNotes?: boolean;
  kitchenAutoCut?: boolean;
};

interface ReceiptPrinterProps {
  data: ReceiptData | null;
  settings?: TenantReceiptSettings | null;
  printMode?: 'all' | 'customer' | 'kitchen';
}

export const ReceiptPrinter = React.forwardRef<HTMLDivElement, ReceiptPrinterProps>(
  ({ data, settings, printMode = 'all' }, ref) => {
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

    const showCustomerReceipt = printMode === 'all' || printMode === 'customer';
    const showKitchenTicket = (printMode === 'all' && settings?.kitchenPrintEnabled) || printMode === 'kitchen';

    const logoUrl = settings?.receiptLogoUrl || settings?.storeLogoUrl;
    const showLogo = settings?.receiptShowLogo !== false && !!logoUrl;
    const showCustomer = settings?.receiptShowCustomer !== false;
    const showCashier = settings?.receiptShowCashier !== false;
    const showTable = settings?.receiptShowTable !== false;
    const showItemNotes = settings?.receiptShowNotes !== false;

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
            color: #000;
          }

          @media print {
            @page {
              margin: 0;
              size: 58mm ${pageHeight};
            }
            body {
              margin: 0;
              padding: 0;
              background-color: #fff !important;
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
            padding: 3mm 2mm;
            font-family: 'JetBrains Mono', 'SF Mono', 'Roboto Mono', 'Menlo', 'Consolas', monospace;
            font-size: 11px;
            line-height: 1.35;
            color: #000;
            font-variant-numeric: tabular-nums;
          }
          .receipt-divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .receipt-divider-solid {
            border-top: 1px solid #000;
            margin: 6px 0;
          }
          .receipt-cut-line {
            border-top: 1px dashed #444;
            margin: 14px 0 10px 0;
            text-align: center;
            font-size: 9px;
            color: #444;
            padding-top: 4px;
            letter-spacing: 0.5px;
          }
          .receipt-text-center { text-align: center; }
          .receipt-text-right { text-align: right; }
          .receipt-text-left { text-align: left; }
          .receipt-flex-between { display: flex; justify-content: space-between; align-items: baseline; }
        `}</style>
        
        <div id="print-area" className="receipt-container" ref={contentRef}>
          
          {/* ================= SECTION 1: STRUK PELANGGAN ================= */}
          {showCustomerReceipt && (
            <div>
              {/* Header */}
              <div className="receipt-text-center" style={{ marginBottom: '8px' }}>
                {showLogo && (
                  <img 
                    src={logoUrl!} 
                    alt="Logo" 
                    style={{ width: '44px', height: '44px', objectFit: 'contain', margin: '0 auto 6px auto', filter: 'grayscale(100%) contrast(200%)' }}
                  />
                )}
                <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {settings?.name || 'MENUIN RESTO'}
                </div>
                {settings?.receiptHeader ? (
                  <div style={{ fontSize: '10px', whiteSpace: 'pre-line', marginTop: '3px', lineHeight: '1.25' }}>
                    {settings.receiptHeader}
                  </div>
                ) : (
                  settings?.storeDescription && (
                    <div style={{ fontSize: '10px', marginTop: '3px' }}>{settings.storeDescription}</div>
                  )
                )}
              </div>

              <div className="receipt-divider" />

              {/* Transaction Meta */}
              <div style={{ marginBottom: '6px', fontSize: '10px', lineHeight: '1.4' }}>
                <div className="receipt-flex-between">
                  <span>WAKTU</span>
                  <span>{format(data.date, 'dd/MM/yyyy HH:mm', { locale: id })}</span>
                </div>
                <div className="receipt-flex-between">
                  <span>NO. STRUK</span>
                  <span style={{ fontWeight: 'bold' }}>#{data.transactionId.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="receipt-flex-between">
                  <span>CHANNEL</span>
                  <span>{data.orderType || 'DINE_IN'}</span>
                </div>
                {showCashier && (
                  <div className="receipt-flex-between">
                    <span>KASIR</span>
                    <span>{data.cashierName || 'Kasir'}</span>
                  </div>
                )}
                {showCustomer && data.customerName && (
                  <div className="receipt-flex-between">
                    <span>PELANGGAN</span>
                    <span>{data.customerName}</span>
                  </div>
                )}
                {showTable && data.tableNumber && (
                  <div className="receipt-flex-between">
                    <span>MEJA</span>
                    <span style={{ fontWeight: 'bold' }}>NO. {data.tableNumber}</span>
                  </div>
                )}
                <div className="receipt-flex-between">
                  <span>METODE</span>
                  <span>{data.paymentMethod || 'TUNAI'}</span>
                </div>
              </div>

              <div className="receipt-divider" />

              {/* Items List */}
              <div style={{ margin: '6px 0' }}>
                {data.items.map((item, index) => (
                  <div key={index} style={{ marginBottom: '5px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{item.name}</div>
                    <div className="receipt-flex-between" style={{ fontSize: '10px' }}>
                      <span>{item.quantity} x {formatCurrency(item.price).replace('Rp','').trim()}</span>
                      <span>{formatCurrency(item.subtotal).replace('Rp','').trim()}</span>
                    </div>
                    {showItemNotes && item.notes && (
                      <div style={{ fontSize: '9.5px', paddingLeft: '8px', color: '#222' }}>
                        - {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="receipt-divider" />

              {/* Subtotal & Calculations */}
              <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
                <div className="receipt-flex-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(itemsSubtotal).replace('Rp','').trim()}</span>
                </div>

                {(data.discount ?? 0) > 0 && (
                  <div className="receipt-flex-between">
                    <span>Diskon {data.promoCode ? `(${data.promoCode})` : ''}</span>
                    <span>-{formatCurrency(data.discount || 0).replace('Rp','').trim()}</span>
                  </div>
                )}

                {(data.tax ?? 0) > 0 && (
                  <div className="receipt-flex-between">
                    <span>Pajak</span>
                    <span>+{formatCurrency(data.tax || 0).replace('Rp','').trim()}</span>
                  </div>
                )}

                {(data.serviceCharge ?? 0) > 0 && (
                  <div className="receipt-flex-between">
                    <span>Layanan</span>
                    <span>+{formatCurrency(data.serviceCharge || 0).replace('Rp','').trim()}</span>
                  </div>
                )}
              </div>

              <div className="receipt-divider-solid" />

              {/* Grand Total */}
              <div className="receipt-flex-between" style={{ margin: '4px 0', fontWeight: 'bold', fontSize: '12px' }}>
                <span>TOTAL</span>
                <span>{formatCurrency(data.totalAmount).replace('Rp','').trim()}</span>
              </div>

              <div className="receipt-divider-solid" />

              {/* Payment Details */}
              <div style={{ margin: '4px 0', fontSize: '10px', lineHeight: '1.4' }}>
                <div className="receipt-flex-between">
                  <span>Bayar</span>
                  <span>{formatCurrency(data.cashReceived).replace('Rp','').trim()}</span>
                </div>
                <div className="receipt-flex-between">
                  <span>Kembali</span>
                  <span>{formatCurrency(data.change).replace('Rp','').trim()}</span>
                </div>
              </div>

              {/* Custom Note (e.g. WiFi) */}
              {settings?.receiptCustomNote && (
                <div style={{ margin: '8px 0', padding: '4px', border: '1px solid #000', fontSize: '9.5px', textAlign: 'center' }}>
                  {settings.receiptCustomNote}
                </div>
              )}

              {/* Footer */}
              <div className="receipt-text-center" style={{ marginTop: '10px', marginBottom: '4px', fontSize: '10px' }}>
                {settings?.receiptFooter ? (
                  <div style={{ whiteSpace: 'pre-line', lineHeight: '1.3' }}>{settings.receiptFooter}</div>
                ) : (
                  <div style={{ fontWeight: 'bold', letterSpacing: '0.5px' }}>TERIMA KASIH</div>
                )}
              </div>
            </div>
          )}

          {/* ================= CUT SEPARATOR ================= */}
          {showCustomerReceipt && showKitchenTicket && (
            <div className="receipt-cut-line">
              - - - - - - - - - - - - - - - - - -<br />
              Gunting Di Sini<br />
              - - - - - - - - - - - - - - - - - -
            </div>
          )}

          {/* ================= SECTION 2: TIKET PESANAN DAPUR ================= */}
          {showKitchenTicket && (
            <div style={{ paddingTop: showCustomerReceipt ? '8px' : '0' }}>
              <div className="receipt-text-center" style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {settings?.kitchenTicketTitle || 'TIKET DAPUR'}
                </div>
                <div style={{ fontSize: '9.5px', marginTop: '2px' }}>
                  {format(data.date, 'dd/MM/yyyy HH:mm:ss', { locale: id })}
                </div>
              </div>

              <div className="receipt-divider-solid" />

              {/* Table & Order Info */}
              <div style={{ margin: '4px 0', fontSize: '11px', lineHeight: '1.4' }}>
                <div className="receipt-flex-between">
                  <span>CHANNEL</span>
                  <span style={{ fontWeight: 'bold' }}>{data.orderType || 'DINE_IN'}</span>
                </div>
                {settings?.kitchenShowTable !== false && data.tableNumber && (
                  <div className="receipt-flex-between" style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '2px' }}>
                    <span>MEJA</span>
                    <span>NO. {data.tableNumber}</span>
                  </div>
                )}
                <div className="receipt-flex-between" style={{ fontSize: '10px' }}>
                  <span>NO. ORDER</span>
                  <span>#{data.transactionId.substring(0, 8).toUpperCase()}</span>
                </div>
                {settings?.kitchenShowCustomer !== false && data.customerName && (
                  <div className="receipt-flex-between" style={{ fontSize: '10px' }}>
                    <span>PELANGGAN</span>
                    <span>{data.customerName}</span>
                  </div>
                )}
                {settings?.kitchenShowCashier !== false && (
                  <div className="receipt-flex-between" style={{ fontSize: '10px' }}>
                    <span>KASIR</span>
                    <span>{data.cashierName || 'Kasir'}</span>
                  </div>
                )}
              </div>

              <div className="receipt-divider" />

              {/* Kitchen Items */}
              <div style={{ margin: '6px 0' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Pesanan Masak:
                </div>
                {data.items.map((item, index) => (
                  <div key={index} style={{ marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px dotted #ccc' }}>
                    <div className="receipt-flex-between" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                      <span>{item.name}</span>
                      <span style={{ fontSize: '13px' }}>x{item.quantity}</span>
                    </div>
                    {settings?.kitchenShowNotes !== false && item.notes && (
                      <div style={{ fontSize: '10px', fontWeight: '500', color: '#111', marginTop: '2px', paddingLeft: '6px' }}>
                        * Catatan: {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="receipt-divider" />

              {/* Total Qty */}
              <div className="receipt-flex-between" style={{ fontWeight: 'bold', fontSize: '11px', margin: '4px 0' }}>
                <span>TOTAL ITEM</span>
                <span>{data.items.reduce((acc, it) => acc + it.quantity, 0)} Pcs</span>
              </div>

              {/* Kitchen Footer Note */}
              {settings?.kitchenTicketNotes && (
                <div style={{ marginTop: '8px', padding: '4px', border: '1px solid #000', fontSize: '9.5px', textAlign: 'center' }}>
                  {settings.kitchenTicketNotes}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    );

    return createPortal(receiptContent, document.body);
  }
);

ReceiptPrinter.displayName = 'ReceiptPrinter';
