import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore, getEffectiveDeviceId } from '@/store/auth-store';
import { getApiUrl } from '@/lib/api-client';

export default function Index() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCheckingDevice, setIsCheckingDevice] = useState(true);
  const [deviceRevoked, setDeviceRevoked] = useState(false);

  const deviceToken = useAuthStore((state) => state.deviceToken);
  const rawDeviceId = useAuthStore((state) => state.deviceId);
  const deviceId = rawDeviceId || getEffectiveDeviceId();
  const tenantId = useAuthStore((state) => state.tenantId);
  const unpairDevice = useAuthStore((state) => state.unpairDevice);

  useEffect(() => {
    setIsHydrated(true);

    if (!deviceToken || !deviceId) {
      setIsCheckingDevice(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    fetch(getApiUrl('/api/mobile/v1/auth/verify-device'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
      },
      body: JSON.stringify({ deviceId, tenantId }),
      signal: controller.signal,
    })
      .then(async (res) => {
        clearTimeout(timeoutId);
        if (!isMounted) return;

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 403 || res.status === 404 || data.error === 'DEVICE_REVOKED') {
            console.log('[Auth] Device has been deleted on the website. Unpairing device...');
            unpairDevice();
            setDeviceRevoked(true);
          }
        }
      })
      .catch((err) => {
        // Network timeout / offline: proceed with cached credentials
        console.warn('[Auth] Device verify network check skipped (offline/timeout):', err.message);
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingDevice(false);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [deviceToken, deviceId, tenantId]);

  if (!isHydrated || isCheckingDevice) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#014FFD" />
      </View>
    );
  }

  const currentDeviceToken = useAuthStore.getState().deviceToken;
  const currentUser = useAuthStore.getState().user;

  // 1. If device is not paired with an outlet (or was revoked/deleted), go to pairing screen
  if (!currentDeviceToken || deviceRevoked) {
    return <Redirect href="/(auth)/pairing" />;
  }

  // 2. If device is paired but no staff has entered PIN, go to PIN screen
  if (!currentUser) {
    return <Redirect href="/(auth)/pin" />;
  }

  // 3. If everything is set, go to main application
  if (currentUser.role === 'CASHIER' || currentUser.role === 'STAFF') {
    return <Redirect href="/(main)/(cashier)/dashboard" />;
  } else {
    return <Redirect href="/(main)/(owner)/dashboard" />;
  }
}
