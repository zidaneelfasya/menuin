import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '@/features/auth/auth-context';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !pin) {
      Alert.alert('Error', 'Silakan masukkan email dan PIN');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/mobile/v1/auth/login-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Login Gagal', data.error || 'Terjadi kesalahan saat login');
        return;
      }

      if (data.token && data.user) {
        // Cek role
        const role = data.user.role;
        if (role !== 'STAFF' && role !== 'SUPERVISOR' && role !== 'OWNER') {
          Alert.alert('Akses Ditolak', 'Akun ini tidak dikenali.');
          return;
        }

        await signIn(data.token, data.user);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Koneksi ke server gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-8">
        <View className="items-center mb-10">
          <View className="w-20 h-20 bg-blue-500 rounded-2xl items-center justify-center mb-4">
            <Text className="text-white text-3xl font-bold">M</Text>
          </View>
          <Text className="text-2xl font-bold text-slate-900">POS Login</Text>
          <Text className="text-slate-500 mt-2 text-center">Gunakan PIN 8 digit untuk login ke aplikasi kasir.</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-slate-700 mb-1">Email</Text>
            <TextInput
              className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900"
              placeholder="nama@menuin.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>
          
          <View>
            <Text className="text-sm font-medium text-slate-700 mb-1">PIN 8 Digit</Text>
            <TextInput
              className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900"
              placeholder="••••••••"
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              keyboardType="numeric"
              maxLength={8}
              editable={!loading}
            />
          </View>

          <TouchableOpacity 
            className={`bg-blue-600 rounded-xl py-4 items-center justify-center mt-2 ${loading ? 'opacity-70' : 'active:bg-blue-700'}`}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-lg">Masuk</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
