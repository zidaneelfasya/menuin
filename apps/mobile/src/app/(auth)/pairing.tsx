import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { Store, QrCode } from 'lucide-react-native';
import { getApiUrl } from '@/lib/api-client';
import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';

export default function PairingScreen() {
  const [pairingCode, setPairingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const pairDevice = useAuthStore((state) => state.pairDevice);
  const router = useRouter();

  const handlePair = async () => {
    if (!pairingCode || pairingCode.length < 6) return;
    
    setIsLoading(true);
    
    try {
      const deviceName = Device.modelName || Device.deviceName || `${Platform.OS} Device`;
      // We generate a UUID for the device identifier if it's not natively available, or just use a random one for now
      // In a real app we might store this identifier securely so it survives reinstalls.
      const deviceIdentifier = Crypto.randomUUID();

      const response = await fetch(getApiUrl('/api/pos/pair'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: pairingCode,
          deviceName,
          deviceIdentifier
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memverifikasi kode pairing');
      }

      // decode token to get tenantId
      // normally we'd use jwt-decode, but we can do a simple base64 decode for the payload
      const payloadBase64 = data.token.split('.')[1];
      const payloadString = atob(payloadBase64);
      const payload = JSON.parse(payloadString);
      
      const tenantId = payload.tenantId;

      pairDevice(data.token, data.device.id, tenantId, data.device.name);
      
      Alert.alert('Berhasil', 'Perangkat berhasil terhubung ke outlet!');
      router.replace('/(auth)/pin');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Terjadi kesalahan jaringan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 items-center justify-center p-6">
      <View className="w-full max-w-sm bg-white p-8 rounded-2xl border border-gray-200 shadow-sm items-center">
        <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-6">
          <Store size={32} color="#2563eb" />
        </View>
        
        <Text className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
          Pairing Device
        </Text>
        <Text className="text-sm text-center text-gray-500 mb-8">
          Masukkan 6 digit kode dari dashboard MENUIN atau scan QR Code untuk menghubungkan device ini dengan outlet Anda.
        </Text>

        <TextInput
          className="w-full h-14 bg-gray-50 border border-gray-200 rounded-xl px-4 text-center text-2xl tracking-[0.5em] font-medium text-gray-900 mb-6"
          placeholder="••••••"
          placeholderTextColor="#9ca3af"
          keyboardType="default"
          maxLength={6}
          value={pairingCode}
          onChangeText={(text) => setPairingCode(text.toUpperCase())}
          autoCapitalize="characters"
        />

        <TouchableOpacity 
          className={`w-full h-12 rounded-xl items-center justify-center flex-row ${pairingCode.length === 6 ? 'bg-blue-600' : 'bg-blue-300'}`}
          disabled={pairingCode.length < 6 || isLoading}
          onPress={handlePair}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-medium text-base">Hubungkan Device</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="mx-4 text-gray-400 text-sm">ATAU</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        <TouchableOpacity 
          className="w-full h-12 bg-white border border-gray-200 rounded-xl items-center justify-center flex-row"
        >
          <QrCode size={20} color="#374151" className="mr-2" />
          <Text className="text-gray-700 font-medium text-base">Scan QR Code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
