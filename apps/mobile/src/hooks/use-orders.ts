import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

export interface OrderItem {
  id: string;
  transactionId: string;
  quantity: number;
  productName: string;
  subtotal: string;
  isCompleted: boolean;
  modifiers?: any;
  notes?: string | null;
}

export interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  status: 'PENDING' | 'NEW' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  paymentMethod?: string | null;
  orderType: string;
  customerName: string | null;
  tableNumber: string | null;
  totalAmount: string;
  grandTotal: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
}

export const useOrders = () => {
  const sessionToken = useAuthStore((state) => state.sessionToken);
  const queryClient = useQueryClient();
  const prevOrderIds = useRef<Set<string>>(new Set());

  const query = useQuery({
    queryKey: ['orders'],
    queryFn: async (): Promise<OrdersResponse> => {
      const data = await fetchWithAuth('/api/mobile/v1/orders');
      return data as OrdersResponse;
    },
    enabled: !!sessionToken,
    refetchInterval: (query) => {
      const errStatus = (query.state.error as any)?.status;
      if (errStatus === 401 || errStatus === 403) return false;
      return 5000;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return fetchWithAuth(`/api/mobile/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const updateItemStatusMutation = useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: string; isCompleted: boolean }) => {
      return fetchWithAuth(`/api/mobile/v1/orders/items/${itemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isCompleted }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return {
    ...query,
    updateStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
    updateItemStatus: updateItemStatusMutation.mutate,
  };
};
