import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useAuthMe } from '@/hooks/use-auth-me';
import { AlertCircle, LogOut, Smartphone } from 'lucide-react-native';
import { GlobalIncomingOrderToast } from '@/components/realtime/incoming-order-toast';

export default function MainLayout() {
  const [isHydrated, setIsHydrated] = useState(false);
  const deviceToken = useAuthStore((state) => state.deviceToken);
  const user = useAuthStore((state) => state.user);
  const logoutUser = useAuthStore((state) => state.logoutUser);
  const unpairDevice = useAuthStore((state) => state.unpairDevice);
  const {
    data: authMeResponse,
    isLoading: isAuthMeLoading,
    error: authMeError,
  } = useAuthMe();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated || isAuthMeLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#014FFD" />
      </View>
    );
  }

  if (!deviceToken) {
    return <Redirect href="/(auth)/pairing" />;
  }

  if (!user) {
    return <Redirect href="/(auth)/pin" />;
  }

  // 1. Check if Device has been Revoked / Deleted from Website
  const isDeviceRevoked =
    (authMeError as any)?.code === 'DEVICE_REVOKED' ||
    (authMeError as any)?.status === 403 ||
    (authMeResponse as any)?.error === 'DEVICE_REVOKED';

  if (isDeviceRevoked) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center p-6">
          <View className="bg-red-50 p-5 rounded-full mb-6 border border-red-200">
            <Smartphone size={52} color="#ef4444" />
          </View>
          <Text className="text-2xl font-black text-gray-900 mb-2 text-center">
            Perangkat Telah Dihapus
          </Text>
          <Text className="text-gray-500 text-center mb-8 text-base leading-relaxed">
            Perangkat ini telah dihapus dari daftar POS outlet oleh Owner melalui website MENUIN. Akses kasir di perangkat ini telah dinonaktifkan.
          </Text>

          <View className="bg-white p-4 rounded-2xl border border-gray-200 w-full mb-6">
            <Text className="text-gray-700 text-center font-medium text-xs">
              Untuk menghubungkan kembali perangkat ini, mintalah kode pairing baru dari halaman Pengaturan POS & Devices di website.
            </Text>
          </View>

          <TouchableOpacity
            className="bg-[#014FFD] px-6 py-4 rounded-xl flex-row items-center justify-center w-full shadow-sm active:bg-blue-700"
            onPress={() => unpairDevice()}
          >
            <LogOut size={20} color="#ffffff" className="mr-2" />
            <Text className="text-white font-bold text-base">Pairing Ulang Perangkat</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Check Subscription Status
  if (authMeResponse?.success) {
    const { tenant, subscription } = authMeResponse.data;
    const isSubscriptionValid =
      tenant.subscriptionTier === 'FREE' ||
      (subscription && subscription.status === 'ACTIVE');

    if (!isSubscriptionValid) {
      return (
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-1 items-center justify-center p-6">
            <View className="bg-red-50 p-4 rounded-full mb-6">
              <AlertCircle size={48} color="#ef4444" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Langganan Kedaluwarsa
            </Text>
            <Text className="text-gray-500 text-center mb-8 text-base">
              Masa aktif langganan {tenant.name} telah berakhir. Aplikasi POS tidak dapat digunakan hingga perpanjangan dilakukan.
            </Text>

            <View className="bg-white p-4 rounded-xl border border-gray-200 w-full mb-6">
              <Text className="text-gray-700 text-center font-medium">
                Harap hubungi Owner atau Manager outlet untuk melakukan perpanjangan via Website MENUIN.
              </Text>
            </View>

            <TouchableOpacity
              className="bg-gray-900 px-6 py-4 rounded-xl flex-row items-center justify-center w-full shadow-sm"
              onPress={() => logoutUser()}
            >
              <LogOut size={20} color="#ffffff" className="mr-2" />
              <Text className="text-white font-semibold text-lg">Keluar Akun</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
  }

  // 3. Role-based Redirection
  if (user.role === 'CASHIER' || user.role === 'STAFF') {
    return (
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(cashier)" />
        </Stack>
        <GlobalIncomingOrderToast />
      </View>
    );
  } else if (user.role === 'OWNER' || user.role === 'MANAGER') {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(owner)" />
      </Stack>
    );
  }

  // Fallback
  return <Redirect href="/(auth)/pin" />;
}
