"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Copy, Check, QrCode, Store, Info, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

export interface OrderQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  grandTotal: number;
  customerName?: string | null;
  tableNumber?: string | null;
  orderType?: string | null;
  primaryColor?: string;
  paymentStatus?: string | null;
  status?: string | null;
}

export function OrderQrModal({
  isOpen,
  onClose,
  orderNumber,
  grandTotal,
  customerName,
  tableNumber,
  orderType,
  primaryColor = "#0E59F9",
  paymentStatus,
  status,
}: OrderQrModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  const isPaid =
    (paymentStatus || "").toUpperCase() === "PAID" ||
    (status && (status || "").toUpperCase() !== "PENDING");

  const handleCopy = () => {
    if (!orderNumber) return;
    navigator.clipboard.writeText(orderNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const dynamicThemeStyle = {
    "--outlet-primary": primaryColor,
  } as React.CSSProperties;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        style={dynamicThemeStyle}
        className="max-w-xs sm:max-w-sm rounded-3xl p-5 sm:p-6 bg-white border-none shadow-2xl overflow-hidden select-none"
      >
        <DialogHeader className="text-center sm:text-center space-y-1">
          <div
            className={`mx-auto w-10 h-10 rounded-2xl flex items-center justify-center mb-1 ${
              isPaid ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
            }`}
          >
            {isPaid ? (
              <CheckCircle2 className="w-5 h-5 stroke-[2.2] text-emerald-600" />
            ) : (
              <QrCode
                className="w-5 h-5 stroke-[2.2]"
                style={{ color: "var(--outlet-primary, #0E59F9)" }}
              />
            )}
          </div>
          <DialogTitle className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
            {isPaid ? "Pesanan Sudah Dibayar & Diterima" : "QR Pembayaran Kasir"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {isPaid
              ? "Pembayaran pesanan ini telah berhasil dan diverifikasi kasir."
              : "Tunjukkan kode QR ini ke kasir saat melakukan pembayaran."}
          </DialogDescription>
        </DialogHeader>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center my-1 relative">
          <div className="p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-150 shadow-2xs flex items-center justify-center relative overflow-hidden">
            <QRCodeSVG
              value={orderNumber}
              size={185}
              level="H"
              includeMargin={false}
              className={`w-[170px] h-[170px] sm:w-[185px] sm:h-[185px] transition-opacity ${
                isPaid ? "opacity-20 blur-[1px]" : "opacity-100"
              }`}
            />

            {/* Paid Verification Watermark Overlay */}
            {isPaid && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center p-3 text-center z-10 border border-emerald-300/80 shadow-inner animate-in fade-in duration-200">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-2xs">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <span className="font-semibold text-xs uppercase tracking-wider text-emerald-800">
                  Sudah Dibayar & Diterima
                </span>
                <span className="text-[11px] text-slate-500 mt-1 max-w-[170px] leading-tight">
                  Pesanan telah lunas & masuk antrean dapur.
                </span>
              </div>
            )}
          </div>

          {/* Order Number pill with Copy button */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 shadow-2xs border-none text-xs">
            <span className="text-slate-400 font-medium">No:</span>
            <span className="font-numeric tabular-nums font-semibold text-slate-900">{orderNumber}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors ml-0.5 cursor-pointer"
              title="Salin nomor pesanan"
              aria-label="Salin nomor pesanan"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Order Brief Info Card */}
        <div className="bg-slate-50 rounded-2xl p-3.5 shadow-sm-md border-none text-xs space-y-1.5">
          <div className="flex justify-between items-center text-slate-600">
            <span>Tipe Pesanan:</span>
            <span className="font-semibold text-slate-900">
              {orderType === "DINE_IN"
                ? `Dine-In${tableNumber ? ` (Meja ${tableNumber})` : ""}`
                : orderType === "TAKEAWAY"
                ? "Bawa Pulang"
                : "Delivery"}
            </span>
          </div>
          {customerName && (
            <div className="flex justify-between items-center text-slate-600">
              <span>Pelanggan:</span>
              <span className="font-semibold text-slate-900">{customerName}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/70">
            <span className="text-slate-700 font-medium">
              {isPaid ? "Status Pembayaran:" : "Total Tagihan Tunai:"}
            </span>
            <span
              className={`font-semibold text-sm font-numeric tabular-nums ${
                isPaid ? "text-emerald-600" : ""
              }`}
              style={isPaid ? undefined : { color: "var(--outlet-primary, #0E59F9)" }}
            >
              {isPaid ? "LUNAS (Sudah Diterima)" : formatCurrency(Number(grandTotal))}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] shadow-sm-md cursor-pointer border-none"
        >
          {isPaid ? "Tutup" : "Selesai / Tutup"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
