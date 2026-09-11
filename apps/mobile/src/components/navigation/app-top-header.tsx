import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Store, ChevronDown, Unlink, User, ShieldCheck, X, Info, CheckCircle2 } from 'lucide-react-native';
import { useAuthStore } from '@/store/auth-store';
import { useActiveShift } from '@/hooks/use-shifts';

export const MENUIN_BLUE = '#014FFD';

export function AppTopHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const user = useAuthStore((state) => state.user);
  const deviceName = useAuthStore((state) => state.deviceName);
  const deviceId = useAuthStore((state) => state.deviceId);
  const unpairDevice = useAuthStore((state) => state.unpairDevice);
  const logoutUser = useAuthStore((state) => state.logoutUser);

  const { data: shiftData } = useActiveShift();
  const activeShift = shiftData?.data;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const outletName = user?.tenantName || 'Kedai Kopi Kita';
  const staffName = user?.name || user?.username || 'Staff Kasir';
  const staffRole = user?.role || 'CASHIER';

  const handleConfirmUnpair = () => {
    setIsModalOpen(false);
    Alert.alert(
      'Putuskan Sambungan Perangkat?',
      `Perangkat "${deviceName || 'Perangkat Ini'}" akan diputuskan dari outlet "${outletName}". Untuk menghubungkan kembali, Anda harus memasukkan kode pairing baru dari website MENUIN.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Putuskan Perangkat',
          style: 'destructive',
          onPress: () => {
            unpairDevice();
          },
        },
      ]
    );
  };

  const handleLogoutStaff = () => {
    setIsModalOpen(false);
    Alert.alert(
      'Keluar Akun Kasir',
      'Apakah Anda ingin keluar dari sesi kasir saat ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: () => {
            logoutUser();
          },
        },
      ]
    );
  };

  return (
    <>
      <View
        style={{
          paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 12 : 8),
          paddingBottom: 8,
          paddingLeft: Math.max(insets.left, 16),
          paddingRight: Math.max(insets.right, 16),
          position: 'relative',
        }}
        className="bg-white border-b border-gray-200/90 shadow-2xs z-30"
      >
        {/* SISI TENGAH: LOGO MENUIN BEWARNA BIRU (ABSOLUTELY CENTERED INDEPENDENT OF LEFT/RIGHT WIDTHS) */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 12 : 8),
              paddingBottom: 8,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            },
          ]}
        >
          <ExpoImage
            source={require('@/assets/images/menuin.png')}
            style={{
              width: isTablet ? 110 : 88,
              height: isTablet ? 26 : 22,
            }}
            contentFit="contain"
            priority="high"
            cachePolicy="memory-disk"
          />
        </View>

        <View className="flex-row items-center justify-between z-10">
          {/* SISI KIRI: NAMA OUTLET BESERTA LOGONYA (CLICKABLE POPOVER) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsModalOpen(true)}
            className="flex-row items-center py-1 px-2 rounded-xl bg-gray-50/80 border border-gray-200/70 active:bg-gray-100"
            style={{ maxWidth: isTablet ? 260 : width * 0.38 }}
          >
            <View className="w-7 h-7 rounded-lg bg-[#014FFD] items-center justify-center mr-2 shadow-2xs">
              <Text className="text-white font-black text-xs">
                {outletName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1 mr-1">
              <Text className="text-xs font-black text-gray-900 leading-tight" numberOfLines={1}>
                {outletName}
              </Text>
              <View className="flex-row items-center">
                <View
                  className={`w-1.5 h-1.5 rounded-full mr-1 ${
                    activeShift ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <Text className="text-[9px] text-gray-500 font-semibold" numberOfLines={1}>
                  {activeShift ? 'Shift Aktif' : 'Shift Tutup'}
                </Text>
              </View>
            </View>
            <ChevronDown size={13} color="#6b7280" />
          </TouchableOpacity>

          {/* SISI KANAN: NAMA PENGGUNA YANG LOGIN & ROLENYA */}
          <View
            className="flex-row items-center justify-end py-1 px-2"
            style={{ maxWidth: isTablet ? 240 : width * 0.38 }}
          >
            <View className="items-end mr-2">
              <Text className="text-xs font-bold text-gray-900 leading-tight" numberOfLines={1}>
                {staffName}
              </Text>
              <Text className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                {staffRole}
              </Text>
            </View>
            <View className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 items-center justify-center">
              <User size={14} color="#4b5563" />
            </View>
          </View>
        </View>
      </View>

      {/* ============================================================ */}
      {/* MODAL PILIHAN OUTLET & KONEKSI PERANGKAT                    */}
      {/* ============================================================ */}
      <Modal
        visible={isModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsModalOpen(false)}
          className="flex-1 bg-black/40 justify-center items-center p-4"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-xl border border-gray-100"
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 items-center justify-center mr-3">
                  <Store size={20} color="#014FFD" />
                </View>
                <View>
                  <Text className="text-sm font-black text-gray-900">{outletName}</Text>
                  <Text className="text-[11px] text-gray-500 font-medium">Perangkat POS Terdaftar</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={14} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Device Info Badge */}
            <View className="bg-gray-50 p-3 rounded-2xl border border-gray-200/80 mb-4 space-y-1">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-gray-500 text-xs">Nama Perangkat</Text>
                <Text className="text-gray-900 font-bold text-xs">{deviceName || 'Mobile POS'}</Text>
              </View>
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-gray-500 text-xs">Status Sambungan</Text>
                <View className="flex-row items-center">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                  <Text className="text-emerald-700 font-bold text-xs">Terhubung Aktif</Text>
                </View>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-500 text-xs">ID Perangkat</Text>
                <Text className="text-gray-400 text-[10px] font-mono" numberOfLines={1}>
                  {deviceId?.slice(0, 14)}...
                </Text>
              </View>
            </View>

            {/* Actions List */}
            <View className="gap-2">
              {/* Action 1: Profile Outlet */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setIsModalOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="flex-row items-center p-3 rounded-2xl bg-white border border-gray-200 active:bg-gray-50"
              >
                <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center mr-3">
                  <Info size={16} color="#014FFD" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-900">Profil Outlet</Text>
                  <Text className="text-[10px] text-gray-500">Lihat rincian informasi dan alamat outlet</Text>
                </View>
              </TouchableOpacity>

              {/* Action 2: Keluar Sesi Kasir */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleLogoutStaff}
                className="flex-row items-center p-3 rounded-2xl bg-white border border-gray-200 active:bg-gray-50"
              >
                <View className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center mr-3">
                  <User size={16} color="#4b5563" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-900">Keluar Sesi Kasir</Text>
                  <Text className="text-[10px] text-gray-500">Ganti akun kasir di perangkat ini</Text>
                </View>
              </TouchableOpacity>

              {/* Action 3: Putuskan Perangkat (Unpair) */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleConfirmUnpair}
                className="flex-row items-center p-3 rounded-2xl bg-red-50/70 border border-red-200 active:bg-red-100"
              >
                <View className="w-9 h-9 rounded-xl bg-red-100 items-center justify-center mr-3">
                  <Unlink size={16} color="#dc2626" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-red-700">Putuskan Sambungan Perangkat</Text>
                  <Text className="text-[10px] text-red-500">Lepas pairing perangkat dari outlet ini</Text>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL DETAIL PROFIL OUTLET                                   */}
      {/* ============================================================ */}
      <Modal
        visible={isProfileModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsProfileModalOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsProfileModalOpen(false)}
          className="flex-1 bg-black/40 justify-center items-center p-4"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-xl border border-gray-100"
          >
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 items-center justify-center mr-3">
                  <Store size={20} color="#014FFD" />
                </View>
                <View>
                  <Text className="text-sm font-black text-gray-900">Profil Outlet</Text>
                  <Text className="text-[11px] text-gray-500 font-medium">Informasi Operasional</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsProfileModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={14} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View className="space-y-2.5 mb-5">
              <View className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Nama Outlet</Text>
                <Text className="text-sm font-bold text-gray-900">{outletName}</Text>
              </View>
              <View className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Lokasi / Cabang</Text>
                <Text className="text-xs font-semibold text-gray-800">Malang, Jawa Timur</Text>
              </View>
              <View className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Status Sistem</Text>
                <View className="flex-row items-center mt-0.5">
                  <CheckCircle2 size={13} color="#10b981" className="mr-1" />
                  <Text className="text-xs font-bold text-emerald-700">Online & Tersinkronisasi</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsProfileModalOpen(false)}
              className="bg-[#014FFD] py-3 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-xs">Tutup</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
