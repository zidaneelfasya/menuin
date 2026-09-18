import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, ChevronRight, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { Badge, EmptyState } from '@/components/ui';

export default function ShiftHistoryScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(isTablet ? 'SHF-1000' : null);

  // Mock list of closed shifts
  const shifts = Array.from({ length: 15 }).map((_, i) => ({
    id: `SHF-${1000 + i}`,
    date: 'Hari ini, 08:00 - 16:00',
    cashier: i % 2 === 0 ? 'Budi Santoso' : 'Siti Aminah',
    expected: 'Rp 2.500.000',
    actual: i % 3 === 0 ? 'Rp 2.450.000' : 'Rp 2.500.000',
    status: 'Ditutup'
  }));

  const renderList = () => (
    <View className={`${isTablet ? 'w-[38%] border-r border-gray-200' : 'flex-1'} bg-gray-50 h-full`}>
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <Text className="text-base font-black text-gray-900 tracking-tight">Riwayat Shift</Text>
        <Text className="text-gray-500 text-xs mt-0.5">Daftar shift yang telah ditutup</Text>
      </View>
      <ScrollView className="flex-1 px-3 py-2.5" showsVerticalScrollIndicator={false}>
        {shifts.map(shift => {
          const isSelected = selectedShiftId === shift.id;
          const isMismatch = shift.expected !== shift.actual;
          return (
            <TouchableOpacity
              key={shift.id}
              activeOpacity={0.7}
              onPress={() => setSelectedShiftId(shift.id)}
              className={`p-3.5 rounded-2xl mb-2 flex-row justify-between items-center border ${
                isSelected ? 'bg-blue-50/70 border-blue-300 shadow-2xs' : 'bg-white border-gray-200/90 shadow-2xs'
              }`}
            >
              <View>
                <Text className={`font-black text-xs ${isSelected ? 'text-blue-800' : 'text-gray-900'}`}>{shift.date}</Text>
                <Text className="text-gray-500 text-[11px] font-medium mt-1">Kasir: {shift.cashier}</Text>
              </View>
              <View className="items-end">
                {isMismatch ? (
                  <Badge label="Selisih" variant="warning" size="sm" />
                ) : (
                  <Badge label="Sesuai" variant="success" size="sm" />
                )}
                {!isTablet && <ChevronRight size={14} color={isSelected ? '#2563eb' : '#9ca3af'} className="mt-1" />}
              </View>
            </TouchableOpacity>
          );
        })}
        <View className="h-10" />
      </ScrollView>
    </View>
  );

  const renderDetail = () => {
    if (!selectedShiftId && isTablet) {
      return (
        <View className="flex-1 items-center justify-center bg-white h-full">
          <EmptyState
            icon={<Clock size={32} color="#9ca3af" />}
            title="Pilih Shift"
            description="Pilih riwayat shift di sebelah kiri untuk melihat laporan rekonsiliasi."
          />
        </View>
      );
    }

    if (!selectedShiftId) return null;

    const DetailContent = (
      <View className="flex-1 bg-white h-full">
        {/* Top Header */}
        <View className="px-4 py-3 border-b border-gray-100 flex-row items-center bg-white">
          {!isTablet && (
            <TouchableOpacity onPress={() => setSelectedShiftId(null)} className="mr-2.5 p-1.5 bg-gray-50 rounded-full">
              <ArrowLeft size={18} color="#374151" />
            </TouchableOpacity>
          )}
          <View>
            <Text className="text-base font-black text-gray-900">Laporan Shift</Text>
            <Text className="text-gray-500 text-xs font-medium">ID: {selectedShiftId}</Text>
          </View>
        </View>

        <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
          {/* Cashier Badge Card */}
          <View className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 mb-5 flex-row justify-between items-center">
            <View>
              <Text className="text-blue-700 text-xs font-bold mb-0.5">Kasir Bertugas</Text>
              <Text className="text-base font-black text-blue-950">Budi Santoso</Text>
            </View>
            <View className="w-8 h-8 rounded-xl bg-blue-100 items-center justify-center">
              <CheckCircle2 size={18} color="#1d4ed8" />
            </View>
          </View>

          {/* Time Context */}
          <Text className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-2">Ringkasan Waktu</Text>
          <View className="bg-gray-50/60 p-3.5 rounded-2xl border border-gray-200/80 mb-5 space-y-2">
            <View className="flex-row justify-between py-1 border-b border-gray-100">
              <Text className="text-gray-500 text-xs">Waktu Buka</Text>
              <Text className="font-bold text-gray-900 text-xs">08:00:15 WIB</Text>
            </View>
            <View className="flex-row justify-between py-1 border-b border-gray-100">
              <Text className="text-gray-500 text-xs">Waktu Tutup</Text>
              <Text className="font-bold text-gray-900 text-xs">16:05:30 WIB</Text>
            </View>
            <View className="flex-row justify-between pt-1">
              <Text className="text-gray-500 text-xs font-medium">Total Durasi</Text>
              <Text className="font-black text-gray-900 text-xs">8 Jam 5 Menit</Text>
            </View>
          </View>

          {/* Cash Reconciliation */}
          <Text className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-2">Rekonsiliasi Kas (Tunai)</Text>
          <View className="bg-gray-50/60 p-3.5 rounded-2xl border border-gray-200/80 mb-5 space-y-2">
            <View className="flex-row justify-between py-1 border-b border-gray-100">
              <Text className="text-gray-500 text-xs">Modal Awal</Text>
              <Text className="font-bold text-gray-900 text-xs">Rp 500.000</Text>
            </View>
            <View className="flex-row justify-between py-1 border-b border-gray-100">
              <Text className="text-gray-500 text-xs">Pemasukan Tunai</Text>
              <Text className="font-bold text-emerald-700 text-xs">+Rp 2.000.000</Text>
            </View>
            <View className="flex-row justify-between py-1 border-b border-gray-100">
              <Text className="text-gray-500 text-xs">Pengeluaran/Refund</Text>
              <Text className="font-bold text-gray-900 text-xs">Rp 0</Text>
            </View>
            <View className="flex-row justify-between pt-2">
              <Text className="text-gray-700 font-bold text-xs">Total Diharapkan</Text>
              <Text className="font-black text-gray-900 text-xs">Rp 2.500.000</Text>
            </View>
            <View className="flex-row justify-between pt-2 bg-white p-3 rounded-xl border border-gray-200 mt-2">
              <Text className="text-gray-900 font-bold text-xs">Total Aktual Fisik</Text>
              <Text className="font-black text-blue-600 text-sm">Rp 2.500.000</Text>
            </View>
          </View>
          
          <View className="h-16" />
        </ScrollView>
      </View>
    );

    if (isTablet) {
      return <View className="w-[62%] h-full">{DetailContent}</View>;
    }

    return (
      <Animated.View 
        entering={SlideInRight} 
        exiting={SlideOutRight} 
        style={[StyleSheet.absoluteFill, { zIndex: 10, backgroundColor: 'white' }]}
      >
        {DetailContent}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <View className="flex-1 flex-row relative">
        {renderList()}
        {renderDetail()}
      </View>
    </SafeAreaView>
  );
}
