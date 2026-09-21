import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/api-client';
import { useAuthStore, getEffectiveDeviceId } from '@/store/auth-store';

export interface AuthMeResponse {
  success: boolean;
  error?: string;
  message?: string;
  data: {
    user: {
      id: string;
      name: string;
      role: string;
    };
    tenant: {
      id: string;
      name: string;
      slug: string | null;
      subscriptionTier: string;
    };
    subscription: {
      plan: string;
      status: string;
      currentPeriodEnd: string | null;
    } | null;
  };
}

export const useAuthMe = () => {
  const sessionToken = useAuthStore((state) => state.sessionToken);
  const storedDeviceId = useAuthStore((state) => state.deviceId);
  const unpairDevice = useAuthStore((state) => state.unpairDevice);
  const logoutUser = useAuthStore((state) => state.logoutUser);

  const effectiveDeviceId = storedDeviceId || getEffectiveDeviceId();

  return useQuery({
    queryKey: ['auth-me', sessionToken, effectiveDeviceId],
    queryFn: async (): Promise<AuthMeResponse> => {
      const response = await fetch(getApiUrl('/api/mobile/v1/auth/me'), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
          'x-device-id': effectiveDeviceId || '',
        },
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));

        // 1. Session expired or invalid -> logout to PIN screen
        if (response.status === 401 || errJson.error === 'Unauthorized') {
          console.warn('[useAuthMe] Session expired (401). Logging out user to PIN screen...');
          logoutUser();
        }

        // 2. Device revoked or deleted
        if (response.status === 403 || errJson.error === 'DEVICE_REVOKED') {
          console.warn('[useAuthMe] Device revoked or deleted on website. Unpairing device...');
          unpairDevice();
        }

        const err = new Error(errJson.message || errJson.error || 'Failed to fetch auth me');
        (err as any).code = errJson.error;
        (err as any).status = response.status;
        throw err;
      }

      return response.json();
    },
    enabled: !!sessionToken,
    retry: false,
    refetchInterval: (query) => {
      // Never poll repeatedly if the query returned 401 or 403
      const errStatus = (query.state.error as any)?.status;
      if (errStatus === 401 || errStatus === 403) {
        return false;
      }
      return 5000; // Check every 5 seconds for real-time device revoke detection
    },
  });
};
