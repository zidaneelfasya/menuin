import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const getApiBaseUrl = () => {
  // If we have an explicit environment variable set, use it
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // In development with Expo Go, get the local IP address dynamically
  if (__DEV__) {
    // debuggerHost looks like "192.168.1.100:8081"
    const debuggerHost = Constants.expoConfig?.hostUri;
    
    if (debuggerHost) {
      // Extract just the IP part and point to the Next.js port (3000)
      const ip = debuggerHost.split(':')[0];
      return `http://${ip}:3000`;
    }

    // Fallback for Android emulator
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000';
    }
    
    // Fallback for iOS simulator
    return 'http://localhost:3000';
  }

  // Production fallback (should ideally be set via EXPO_PUBLIC_API_URL)
  return 'https://menuin.id';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper to construct full API URLs
export const getApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const fetchWithAuth = async (path: string, options: RequestInit = {}) => {
  const { useAuthStore, getEffectiveDeviceId } = require('@/store/auth-store');
  const sessionToken = useAuthStore.getState().sessionToken;
  const deviceId = getEffectiveDeviceId ? getEffectiveDeviceId() : useAuthStore.getState().deviceId;
  
  const headers = new Headers(options.headers);
  if (sessionToken) {
    headers.set('Authorization', `Bearer ${sessionToken}`);
  }
  if (deviceId) {
    headers.set('x-device-id', deviceId);
  }
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(getApiUrl(path), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 403 && (errorData.error === 'DEVICE_REVOKED' || errorData.code === 'DEVICE_REVOKED')) {
      useAuthStore.getState().unpairDevice();
    }
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
};
