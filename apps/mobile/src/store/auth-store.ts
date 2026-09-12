import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'STAFF';

export interface UserSession {
  id: string; // Membership ID
  name: string;
  username: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
}

interface AuthState {
  // Device Pairing State (Persistent)
  deviceToken: string | null;
  deviceId: string | null;
  tenantId: string | null;
  deviceName: string | null;
  
  // User Session State (Persistent during shift/login)
  sessionToken: string | null;
  user: UserSession | null;
  
  // Actions
  pairDevice: (deviceToken: string, deviceId: string, tenantId: string, deviceName: string) => void;
  unpairDevice: () => void;
  loginUser: (sessionToken: string, user: UserSession) => void;
  logoutUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      deviceToken: null,
      deviceId: null,
      tenantId: null,
      deviceName: null,
      
      sessionToken: null,
      user: null,

      pairDevice: (deviceToken, deviceId, tenantId, deviceName) => 
        set({ deviceToken, deviceId, tenantId, deviceName }),
        
      unpairDevice: () => 
        set({ deviceToken: null, deviceId: null, tenantId: null, deviceName: null, sessionToken: null, user: null }),
        
      loginUser: (sessionToken, user) => 
        set({ sessionToken, user }),
        
      logoutUser: () => 
        set({ sessionToken: null, user: null }),
    }),
    {
      name: 'menuin-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const getEffectiveDeviceId = (): string | null => {
  const state = useAuthStore.getState();
  if (state.deviceId) return state.deviceId;
  if (state.deviceToken) {
    try {
      const parts = state.deviceToken.split('.');
      if (parts.length >= 2) {
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        if (typeof atob !== 'undefined') {
          const payloadStr = atob(base64);
          const payload = JSON.parse(payloadStr);
          if (payload?.deviceId) return payload.deviceId;
        }
      }
    } catch (e) {}
  }
  return null;
};

