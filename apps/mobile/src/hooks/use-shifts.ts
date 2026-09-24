import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api-client';
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
      const data = await fetchWithAuth('/api/mobile/v1/shifts');
      return data as ShiftResponse;
    },
    enabled: !!sessionToken,
    refetchInterval: (query) => {
      const errStatus = (query.state.error as any)?.status;
      if (errStatus === 401 || errStatus === 403) return false;
      return 10000; // Refetch every 10 seconds to update metrics
    },
  });
};

export const useStartShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (startingCash: number) => {
      return fetchWithAuth('/api/mobile/v1/shifts', {
        method: 'POST',
        body: JSON.stringify({ startingCash }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
    },
  });
};

export const useEndShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shiftId, actualCash }: { shiftId: string; actualCash: number }) => {
      return fetchWithAuth('/api/mobile/v1/shifts', {
        method: 'PUT',
        body: JSON.stringify({ shiftId, actualCash }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
    },
  });
};
