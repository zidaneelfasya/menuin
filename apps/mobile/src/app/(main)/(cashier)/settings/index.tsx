import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Printer, Receipt, Smartphone, Info, ChevronRight, Store, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { Badge } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const user = useAuthStore((state) => state.user);
  const deviceName = useAuthStore((state) => state.deviceName);
  const deviceId = useAuthStore((state) => state.deviceId);

  const handlePrinterSettings = () => {
    Alert.alert('Printer Thermal', 'Fitur pencarian dan koneksi printer Bluetooth/USB akan segera tersedia.');
  };

  const handleReceiptSettings = () => {
    Alert.alert('Pengaturan Nota', 'Format struk kasir otomatis dicetak menggunakan template standar MENUIN.');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right']}>
      {/* Top Header */}
      <View className="px-5 py-3 bg-white border-b border-gray-100">
        <View style={{ maxWidth: 760, width: '100%', alignSelf: 'center' }}>
          <Text className="text-base font-black text-gray-900 tracking-tight">Pengaturan</Text>
          <Text className="text-xs text-gray-500 font-medium">Preferensi perangkat & koneksi operasional kasir</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 p-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: (isTablet ? 24 : 76) + Math.max(insets.bottom, 8) }}
      >
        <View style={{ maxWidth: 760, width: '100%', alignSelf: 'center' }}>
          {/* Outlet Profile Card */}
          <View className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs mb-4">
            <Text className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">Informasi Outlet</Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 items-center justify-center mr-3">
                  <Store size={20} color="#014FFD" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                    {user?.tenantName || user?.name || 'Kedai Kopi Kita'}
                  </Text>
                  <Text className="text-xs text-gray-500 font-medium">
                    Kasir: {user?.name || user?.username || 'Staff Kasir'}
                  </Text>
                </View>
              </View>
              <Badge label={user?.role || 'CASHIER'} variant="primary" size="sm" />
            </View>
          </View>

          {/* Device & Hardware Settings */}
          <View className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs mb-4 overflow-hidden divide-y divide-gray-100">
            <View className="p-3.5 bg-gray-50/50">
              <Text className="font-bold text-xs uppercase tracking-wider text-gray-400">Perangkat Kasir</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePrinterSettings}
              className="p-4 flex-row items-center justify-between active:bg-gray-50"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center mr-3">
                  <Printer size={16} color="#4b5563" />
                </View>
                <View>
                  <Text className="text-xs font-bold text-gray-900">Printer Thermal (Bluetooth / USB)</Text>
                  <Text className="text-[11px] text-gray-400 font-medium">Belum tersambung</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleReceiptSettings}
              className="p-4 flex-row items-center justify-between active:bg-gray-50"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center mr-3">
                  <Receipt size={16} color="#4b5563" />
                </View>
                <View>
                  <Text className="text-xs font-bold text-gray-900">Format Struk & Nota</Text>
                  <Text className="text-[11px] text-gray-400 font-medium">Header & footer otomatis</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#9ca3af" />
            </TouchableOpacity>

            <View className="p-4 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center mr-3">
                  <Smartphone size={16} color="#4b5563" />
                </View>
                <View>
                  <Text className="text-xs font-bold text-gray-900">Nama Perangkat</Text>
                  <Text className="text-[11px] text-gray-400 font-medium">
                    {deviceName || 'Mobile POS'} ({deviceId ? `${deviceId.slice(0, 10)}...` : 'Device'})
                  </Text>
                </View>
              </View>
              <Badge label="Terhubung" variant="success" size="sm" />
            </View>
          </View>

          {/* App Info */}
          <View className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs mb-6">
            <Text className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">Tentang Aplikasi</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between py-1 border-b border-gray-100">
                <Text className="text-xs text-gray-500">Versi POS</Text>
                <Text className="text-xs font-bold text-gray-900">v1.0.0 (Production)</Text>
              </View>
              <View className="flex-row justify-between py-1 border-b border-gray-100">
                <Text className="text-xs text-gray-500">Status Server Cloud</Text>
                <Badge label="Online & Sinkron" variant="success" size="sm" />
              </View>
              <View className="flex-row justify-between py-1">
                <Text className="text-xs text-gray-500">Keamanan Pairing</Text>
                <View className="flex-row items-center">
                  <ShieldCheck size={13} color="#10b981" className="mr-1" />
                  <Text className="text-xs font-bold text-emerald-700">Terverifikasi</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
