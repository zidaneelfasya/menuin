import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { formatCurrency } from '@menuin/utils';
import { Check, Copy, QrCode, CheckCircle2, X } from 'lucide-react-native';

export interface OrderQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  grandTotal: number;
  customerName?: string | null;
  tableNumber?: string | null;
  orderType?: string | null;
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
  paymentStatus,
  status,
}: OrderQrModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  // Pencegahan scan ulang: jika sudah bayar atau tidak pending, QR diblur & dikunci
  const isPaid =
    (paymentStatus || '').toUpperCase() === 'PAID' ||
    (status && (status || '').toUpperCase() !== 'PENDING');

  const handleCopy = () => {
    if (!orderNumber) return;
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/60 items-center justify-center p-4"
        onPress={onClose}
      >
        <Pressable
          className="bg-white w-full max-w-sm rounded-3xl p-5 border border-slate-200 shadow-2xl overflow-hidden"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
          >
            <X size={16} color="#64748b" />
          </TouchableOpacity>

          {/* Header */}
          <View className="items-center text-center space-y-1 mb-2">
            <View
              className={`w-11 h-11 rounded-2xl items-center justify-center mb-1 ${
                isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
              }`}
            >
              {isPaid ? (
                <CheckCircle2 size={24} color="#059669" strokeWidth={2.2} />
              ) : (
                <QrCode size={24} color="#2563eb" strokeWidth={2.2} />
              )}
            </View>
            <Text className="text-base font-semibold text-slate-900 text-center tracking-tight">
              {isPaid ? 'Pesanan Sudah Dibayar & Diterima' : 'QR Pembayaran Kasir'}
            </Text>
            <Text className="text-xs text-slate-500 text-center px-2">
              {isPaid
                ? 'Pembayaran pesanan ini telah berhasil dan diverifikasi kasir.'
                : 'Tunjukkan kode QR ini ke kasir saat melakukan pembayaran.'}
            </Text>
          </View>

          {/* QR Code Container with Paid Watermark Overlay */}
          <View className="items-center justify-center my-3 relative">
            <View className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs items-center justify-center relative overflow-hidden">
              <View className={isPaid ? 'opacity-20' : 'opacity-100'}>
                <QRCode
                  value={orderNumber || 'ORDER'}
                  size={175}
                  color="#0f172a"
                  backgroundColor="#ffffff"
                />
              </View>

              {/* Paid Verification Watermark Overlay (Pencegahan Scan Ulang) */}
              {isPaid && (
                <View className="absolute inset-0 bg-white/95 rounded-2xl items-center justify-center p-3 z-10 border border-emerald-300">
                  <View className="w-12 h-12 rounded-full bg-emerald-100 items-center justify-center mb-2 shadow-2xs">
                    <Check size={26} color="#059669" strokeWidth={3} />
                  </View>
                  <Text className="font-semibold text-xs uppercase tracking-wider text-emerald-800 text-center">
                    Sudah Dibayar & Diterima
                  </Text>
                  <Text className="text-[11px] text-slate-500 mt-1 text-center max-w-[170px] leading-tight">
                    Pesanan telah lunas & masuk antrean dapur.
                  </Text>
                </View>
              )}
            </View>

            {/* Order Number pill with Copy button */}
            <View className="mt-3 flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
              <Text className="text-slate-400 font-medium text-xs">No:</Text>
              <Text className="font-mono font-semibold text-slate-900 text-xs">
                {orderNumber}
              </Text>
              <TouchableOpacity
                onPress={handleCopy}
                className="p-1 rounded-md ml-0.5"
                accessibilityLabel="Salin nomor pesanan"
              >
                {isCopied ? (
                  <Check size={13} color="#059669" strokeWidth={2.5} />
                ) : (
                  <Copy size={13} color="#64748b" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Order Brief Info Card */}
          <View className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1 mb-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-slate-500 text-xs font-medium">Layanan:</Text>
              <Text className="text-slate-800 text-xs font-semibold">
                {tableNumber
                  ? `Meja ${tableNumber}`
                  : (orderType || 'Dine In').replace('_', ' ')}
              </Text>
            </View>
            {customerName && (
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-500 text-xs font-medium">Pelanggan:</Text>
                <Text className="text-slate-800 text-xs font-semibold">
                  {customerName}
                </Text>
              </View>
            )}
            <View className="flex-row justify-between items-center pt-1.5 border-t border-slate-200/60 mt-1">
              <Text className="text-slate-600 text-xs font-medium">
                {isPaid ? 'Status Pembayaran:' : 'Total Tagihan:'}
              </Text>
              <Text
                className={`text-xs font-semibold ${
                  isPaid ? 'text-emerald-600' : 'text-blue-600 font-mono'
                }`}
              >
                {isPaid ? 'LUNAS (Sudah Diterima)' : formatCurrency(Number(grandTotal))}
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            className="w-full py-2.5 rounded-xl bg-slate-900 items-center justify-center shadow-2xs active:bg-slate-800"
          >
            <Text className="text-xs font-semibold text-white">
              {isPaid ? 'Tutup' : 'Selesai / Tutup'}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default OrderQrModal;
