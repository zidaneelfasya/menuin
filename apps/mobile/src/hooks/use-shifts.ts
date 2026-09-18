import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

export interface ShiftMetrics {
  totalCashSales: number;
  totalCashIn: number;
  totalCashOut: number;
  startingCash: number;
  expectedCash: number;
  totalTransactions: number;
  totalSales: number;
}

export interface Shift {
  id: string;
  tenantId: string;
  membershipId: string;
  startTime: string;
  endTime: string | null;
  startingCash: string;
  actualCash: string | null;
  expectedCash: string | null;
  cashDifference: string | null;
  status: 'ACTIVE' | 'ENDED';
  cashierName: string;
  metrics: ShiftMetrics;
}

export interface ShiftResponse {
  success: boolean;
  data: Shift | null;
}

export const useActiveShift = () => {
  const sessionToken = useAuthStore((state) => state.sessionToken);

  return useQuery({
    queryKey: ['active-shift'],
    queryFn: async (): Promise<ShiftResponse> => {
      const response = await fetch(getApiUrl('/api/mobile/v1/shifts'), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch active shift');
      }

      return response.json();
    },
    enabled: !!sessionToken,
    refetchInterval: 10000, // Refetch every 10 seconds to update metrics
  });
};

export const useStartShift = () => {
  const sessionToken = useAuthStore((state) => state.sessionToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (startingCash: number) => {
      const response = await fetch(getApiUrl('/api/mobile/v1/shifts'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ startingCash })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start shift');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
    }
  });
};

export const useEndShift = () => {
  const sessionToken = useAuthStore((state) => state.sessionToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shiftId, actualCash }: { shiftId: string, actualCash: number }) => {
      const response = await fetch(getApiUrl('/api/mobile/v1/shifts'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ shiftId, actualCash })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to end shift');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
    }
  });
};
