import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore, getEffectiveDeviceId } from '@/store/auth-store';
import { User, LogOut } from 'lucide-react-native';
import { getApiUrl } from '@/lib/api-client';

export default function PinScreen() {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const outletName = useAuthStore((state) => state.deviceName);
  const loginUser = useAuthStore((state) => state.loginUser);
  const unpairDevice = useAuthStore((state) => state.unpairDevice);
  const router = useRouter();

  // Proactively check if device has been deleted from the website while sitting on PIN screen
  React.useEffect(() => {
    const checkDeviceStatus = async () => {
      const deviceId = useAuthStore.getState().deviceId || getEffectiveDeviceId();
      const tenantId = useAuthStore.getState().tenantId;

      if (!deviceId) {
        unpairDevice();
        router.replace('/(auth)/pairing');
        return;
      }

      try {
        const res = await fetch(
          getApiUrl(`/api/mobile/v1/auth/verify-device?deviceId=${encodeURIComponent(deviceId)}&tenantId=${encodeURIComponent(tenantId || '')}`)
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 403 || res.status === 404 || data.error === 'DEVICE_REVOKED') {
            unpairDevice();
            Alert.alert(
              'Perangkat Telah Dihapus',
              'Perangkat ini telah dihapus oleh Owner dari website MENUIN. Silakan lakukan pairing ulang.',
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/(auth)/pairing'),
                },
              ]
            );
          }
        }
      } catch (err) {
        // Offline / network timeout, skip
      }
    };

    checkDeviceStatus();
  }, []);

  const handleKeyPress = (key: string) => {
    if (pin.length < 6) {
      const newPin = pin + key;
      setPin(newPin);
      
      if (newPin.length === 6) {
        verifyAuth(email, newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const verifyAuth = async (currentEmail: string, currentPin: string) => {
    if (!currentEmail.trim()) {
      Alert.alert('Error', 'Masukkan email Anda terlebih dahulu.');
      setPin('');
      return;
    }

    const tenantId = useAuthStore.getState().tenantId;
    const deviceId = useAuthStore.getState().deviceId || getEffectiveDeviceId();
    
    if (!tenantId) {
      Alert.alert('Error', 'Outlet ID tidak ditemukan. Harap unpair dan ulangi pairing device.');
      setPin('');
      return;
    }

    try {
      const response = await fetch(getApiUrl('/api/mobile/v1/auth/login-pin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId || '',
        },
        body: JSON.stringify({
          username: currentEmail,
          pin: currentPin,
          tenantId: tenantId,
          deviceId: deviceId,
        })
      });

      const data = await response.json();

      if (response.status === 403 || data.error === 'DEVICE_REVOKED') {
        unpairDevice();
        Alert.alert(
          'Perangkat Telah Dihapus',
          'Perangkat ini telah dihapus oleh Owner dari website MENUIN. Silakan lakukan pairing ulang.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/pairing'),
            },
          ]
        );
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Gagal login. Periksa kembali email dan PIN Anda.');
      }

      // Login success
      loginUser(data.token, {
        id: data.user.id,
        name: data.user.name,
        username: data.user.username,
        role: data.user.role,
        tenantId: data.user.tenantId,
        tenantName: data.user.tenantName,
      });
      
      if (data.user.role === 'CASHIER' || data.user.role === 'STAFF') {
        router.replace('/(main)/(cashier)/dashboard');
      } else {
        router.replace('/(main)/(owner)/dashboard');
      }
    } catch (error: any) {
      Alert.alert('Gagal Login', error.message || 'Terjadi kesalahan jaringan.');
      setPin('');
    }
  };

  const handleUnpair = () => {
    Alert.alert(
      'Unpair Device',
      'Apakah Anda yakin ingin memutuskan perangkat ini dari Outlet?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Unpair', 
          style: 'destructive',
          onPress: () => {
            unpairDevice();
            router.replace('/(auth)/pairing');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 items-center py-12 px-6">
            
            {/* Header */}
            <View className="items-center mt-4 mb-8">
              <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4">
                <User size={32} color="#2563eb" />
              </View>
              <Text className="text-xl font-semibold text-gray-900 mb-1">{outletName}</Text>
              <Text className="text-sm text-gray-500">Login dengan Email & PIN Anda</Text>
            </View>

            {/* Email Input */}
            <View className="w-full max-w-[280px] mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Email Staff</Text>
              <TextInput
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-gray-900"
                placeholder="email@domain.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* PIN Indicators */}
            <View className="flex-row gap-4 mb-8">
              {[...Array(6)].map((_, i) => (
                <View 
                  key={i} 
                  className={`w-4 h-4 rounded-full ${i < pin.length ? 'bg-blue-600' : 'bg-gray-200'}`}
                />
              ))}
            </View>

            {/* Numpad */}
            <View className="w-full max-w-[280px]">
              <View className="flex-row justify-between mb-6">
                {['1', '2', '3'].map((num) => (
                  <NumpadButton key={num} num={num} onPress={() => handleKeyPress(num)} />
                ))}
              </View>
              <View className="flex-row justify-between mb-6">
                {['4', '5', '6'].map((num) => (
                  <NumpadButton key={num} num={num} onPress={() => handleKeyPress(num)} />
                ))}
              </View>
              <View className="flex-row justify-between mb-6">
                {['7', '8', '9'].map((num) => (
                  <NumpadButton key={num} num={num} onPress={() => handleKeyPress(num)} />
                ))}
              </View>
              <View className="flex-row justify-between">
                <View className="w-20 h-20" /> 
                <NumpadButton num="0" onPress={() => handleKeyPress('0')} />
                <TouchableOpacity 
                  className="w-20 h-20 items-center justify-center rounded-full active:bg-gray-100"
                  onPress={handleDelete}
                >
                  <Text className="text-gray-500 text-lg font-medium">Hapus</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer actions */}
            <View className="flex-1 justify-end mt-8">
              <TouchableOpacity 
                className="flex-row items-center py-4"
                onPress={handleUnpair}
              >
                <LogOut size={16} color="#ef4444" className="mr-2" />
                <Text className="text-red-500 font-medium">Unpair Device</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function NumpadButton({ num, onPress }: { num: string, onPress: () => void }) {
  return (
    <TouchableOpacity 
      className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center border border-gray-100 shadow-sm active:bg-gray-200"
      onPress={onPress}
    >
      <Text className="text-3xl font-medium text-gray-800">{num}</Text>
    </TouchableOpacity>
  );
}
