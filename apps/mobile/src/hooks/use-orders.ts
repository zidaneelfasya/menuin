import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/api-client';
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
}

export interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  status: 'PENDING' | 'NEW' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
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
      const response = await fetch(getApiUrl('/api/mobile/v1/orders'), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders data');
      }

      return response.json();
    },
    enabled: !!sessionToken,
    refetchInterval: 5000, 
  });



  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: string }) => {
      const response = await fetch(getApiUrl(`/api/mobile/v1/orders/${orderId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const updateItemStatusMutation = useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: string, isCompleted: boolean }) => {
      const response = await fetch(getApiUrl(`/api/mobile/v1/orders/items/${itemId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ isCompleted })
      });
      if (!response.ok) throw new Error('Failed to update item status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  return {
    ...query,
    updateStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
    updateItemStatus: updateItemStatusMutation.mutate,
  };
};
