import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const getApiBaseUrl = () => {
  // If we have an explicit environment variable set and not localhost on physical device
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // In development with Expo Go, get the local IP address dynamically
  if (__DEV__) {
    const hostUri = 
      Constants.expoConfig?.hostUri || 
      (Constants as any).manifest2?.extra?.expoClient?.hostUri || 
      (Constants as any).manifest?.debuggerHost ||
      Constants.linkingUri;
    
    if (hostUri) {
      const match = hostUri.match(/^https?:\/\/([^/:]+)/) || hostUri.match(/^([^/:]+)/);
      const ip = match ? match[1] : hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:3000`;
      }
    }

    if (envUrl) {
      return envUrl;
    }

    // Fallback for Android emulator
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000';
    }
    
    // Fallback for local LAN IP
    return 'http://192.168.1.2:3000';
  }

  return envUrl || 'https://menuin.id';
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
