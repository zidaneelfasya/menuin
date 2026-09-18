import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput, Alert, RefreshControl, useWindowDimensions } from 'react-native';
import { useAuthStore } from '@/store/auth-store';
import { LogOut, X, Clock, DollarSign, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react-native';
import { useActiveShift, useStartShift, useEndShift } from '@/hooks/use-shifts';
import { Badge, Button, EmptyState } from '@/components/ui';

export default function ShiftScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const user = useAuthStore((state) => state.user);
  const logoutUser = useAuthStore((state) => state.logoutUser);
  
  const { data: shiftData, isLoading, refetch, isRefetching } = useActiveShift();
  const startShiftMutation = useStartShift();
  const endShiftMutation = useEndShift();

  const [isStartModalVisible, setIsStartModalVisible] = useState(false);
  const [isEndModalVisible, setIsEndModalVisible] = useState(false);
  const [cashInput, setCashInput] = useState('');

  const activeShift = shiftData?.data;

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(price));
  };

  const handleStartShift = () => {
    const amount = Number(cashInput.replace(/\D/g, ''));
    startShiftMutation.mutate(amount, {
      onSuccess: () => {
        setIsStartModalVisible(false);
        setCashInput('');
      },
      onError: (err) => {
        Alert.alert('Gagal', err.message);
      }
    });
  };

  const handleEndShift = () => {
    const amount = Number(cashInput.replace(/\D/g, ''));
    if (!activeShift) return;

    endShiftMutation.mutate({ shiftId: activeShift.id, actualCash: amount }, {
      onSuccess: () => {
        setIsEndModalVisible(false);
        setCashInput('');
        Alert.alert('Berhasil', 'Shift telah ditutup.');
      },
      onError: (err) => {
        Alert.alert('Gagal', err.message);
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right']}>
      {/* Top Toolbar (Phone Only) */}
      {!isTablet && (
        <View className="px-4 py-3 bg-white border-b border-gray-100 flex-row items-center justify-between">
          <View>
            <Text className="text-base font-black text-gray-900 tracking-tight">Manajemen Shift</Text>
            <Text className="text-xs text-gray-500 font-medium">Buka dan tutup sesi operasional kasir</Text>
          </View>
          <TouchableOpacity 
            activeOpacity={0.7}
            className="bg-red-50 px-2.5 py-1.5 rounded-xl flex-row items-center active:bg-red-100"
            onPress={() => logoutUser()}
          >
            <LogOut size={13} color="#ef4444" />
            <Text className="text-red-600 font-bold text-xs ml-1.5">Keluar Sesi</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        className="flex-1 p-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: 'center',
          paddingBottom: (isTablet ? 24 : 76) + Math.max(insets.bottom, 8),
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View className="w-full max-w-2xl">
          {isLoading && !isRefetching ? (
            <View className="py-16 items-center justify-center">
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : !activeShift ? (
            <View className="bg-white p-6 rounded-3xl border border-gray-200 shadow-2xs items-center justify-center py-12 mt-6">
              <View className="w-16 h-16 rounded-2xl bg-amber-50 items-center justify-center mb-3.5 border border-amber-100">
                <Clock size={32} color="#d97706" />
              </View>
              <Text className="text-gray-900 font-black text-lg mb-1.5 text-center">Belum Ada Shift Aktif</Text>
              <Text className="text-gray-500 text-center text-xs leading-relaxed max-w-[280px] mb-6">
                Buka shift kasir terlebih dahulu dengan memasukkan modal saldo awal.
              </Text>
              <Button 
                title="Buka Shift Sekarang"
                variant="primary"
                size="lg"
                className="w-full shadow-sm max-w-sm"
                onPress={() => setIsStartModalVisible(true)}
              />
            </View>
          ) : (
            <View className="space-y-4">
              {/* Active Shift Header Card */}
              <View className="bg-white p-4 rounded-2xl border border-emerald-200/90 bg-emerald-50/20 shadow-2xs">
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />
                    <Text className="font-black text-emerald-900 text-sm">Shift Sedang Berlangsung</Text>
                  </View>
                  <Badge label="AKTIF" variant="success" size="sm" />
                </View>

                <Text className="text-gray-500 text-xs font-medium">Kasir Bertugas: <Text className="font-bold text-gray-900">{user?.name || 'Staff'}</Text></Text>
              </View>

              {/* Financial Summary */}
              <View className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs">
                <Text className="font-black text-xs uppercase tracking-wider text-gray-400 mb-3">Ringkasan Finansial Kas</Text>
                
                <View className="space-y-2.5">
                  <View className="flex-row justify-between py-1.5 border-b border-gray-100">
                    <Text className="text-gray-500 text-xs">Modal Awal Kasir</Text>
                    <Text className="text-gray-900 font-bold text-xs">{formatPrice(activeShift.metrics.startingCash)}</Text>
                  </View>
                  <View className="flex-row justify-between py-1.5 border-b border-gray-100">
                    <Text className="text-gray-500 text-xs">Penjualan Tunai</Text>
                    <Text className="text-emerald-700 font-bold text-xs">+{formatPrice(activeShift.metrics.totalCashSales)}</Text>
                  </View>
                  <View className="flex-row justify-between py-1.5 border-b border-gray-100">
                    <Text className="text-gray-500 text-xs">Total Seluruh Transaksi</Text>
                    <Text className="text-gray-900 font-bold text-xs">{formatPrice(activeShift.metrics.totalSales)}</Text>
                  </View>
                  <View className="flex-row justify-between pt-2">
                    <Text className="text-gray-900 font-black text-xs">Estimasi Kas di Laci</Text>
                    <Text className="text-blue-600 font-black text-sm">{formatPrice(activeShift.metrics.expectedCash)}</Text>
                  </View>
                </View>
              </View>

              <Button 
                title="Tutup Shift & Rekonsiliasi"
                variant="destructive"
                size="lg"
                className="w-full shadow-sm"
                onPress={() => setIsEndModalVisible(true)}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Start Shift Modal */}
      <Modal
        visible={isStartModalVisible}
        transparent
        animationType="fade"
        supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}
      >
        <View className="flex-1 bg-black/40 justify-center items-center p-4">
          <View className="bg-white rounded-3xl p-5 border border-gray-100 w-full max-w-md">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-black text-gray-900">Buka Shift Baru</Text>
              <TouchableOpacity onPress={() => setIsStartModalVisible(false)} className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                <X size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text className="text-gray-500 text-xs mb-4">Masukkan saldo awal (uang modal laci) sebelum memulai penjualan.</Text>
            
            <View className="mb-5">
              <Text className="text-xs font-bold text-gray-700 mb-1.5">Saldo Modal Kasir (Rp)</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base font-bold text-gray-900 bg-gray-50/60"
                keyboardType="numeric"
                placeholder="Contoh: 100000"
                placeholderTextColor="#9ca3af"
                value={cashInput}
                onChangeText={setCashInput}
              />
            </View>

            <Button 
              title="Mulai Shift"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={startShiftMutation.isPending}
              onPress={handleStartShift}
            />
          </View>
        </View>
      </Modal>

      {/* End Shift Modal */}
      <Modal
        visible={isEndModalVisible}
        transparent
        animationType="fade"
        supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}
      >
        <View className="flex-1 bg-black/40 justify-center items-center p-4">
          <View className="bg-white rounded-3xl p-5 border border-gray-100 w-full max-w-md">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-black text-gray-900">Tutup Shift & Rekonsiliasi</Text>
              <TouchableOpacity onPress={() => setIsEndModalVisible(false)} className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                <X size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text className="text-gray-500 text-xs mb-3">Hitung jumlah uang fisik aktual yang ada di laci kasir saat ini.</Text>
            
            <View className="bg-blue-50/70 p-3 rounded-xl mb-4 border border-blue-100">
              <Text className="text-blue-800 text-xs font-bold">
                Estimasi Sistem: {formatPrice(activeShift?.metrics.expectedCash || 0)}
              </Text>
            </View>

            <View className="mb-5">
              <Text className="text-xs font-bold text-gray-700 mb-1.5">Uang Fisik Aktual (Rp)</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base font-bold text-gray-900 bg-gray-50/60"
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#9ca3af"
                value={cashInput}
                onChangeText={setCashInput}
              />
            </View>

            <Button 
              title="Konfirmasi Tutup Shift"
              variant="destructive"
              size="lg"
              className="w-full"
              isLoading={endShiftMutation.isPending}
              onPress={handleEndShift}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
