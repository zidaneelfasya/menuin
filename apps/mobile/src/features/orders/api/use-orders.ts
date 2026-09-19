import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api-client';

export interface OrderItemDto {
  id: string;
  transactionId: string;
  productId?: string;
  quantity: number;
  price?: string;
  productName: string;
  subtotal: string;
  modifiers?: any;
  notes?: string | null;
  isCompleted: boolean;
}

export interface OrderDto {
  id: string;
  tenantId: string;
  status: string;
  orderNumber: string;
  customerName: string | null;
  tableNumber: string | null;
  totalAmount?: string;
  grandTotal: string;
  createdAt: string;
  orderType: string;
  paymentMethod?: string;
  paymentStatus?: string;
  items: OrderItemDto[];
}

interface OrdersResponse {
  success: boolean;
  data: OrderDto[];
}

export function useOrdersData() {
  return useQuery({
    queryKey: ['active-orders'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/mobile/v1/orders');
      return response as OrdersResponse;
    },
    refetchInterval: 10000, // Fallback polling in case realtime fails
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await fetchWithAuth(`/api/mobile/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-orders'] });
    },
  });
}

export function useBulkUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderIds, status }: { orderIds: string[]; status: string }) => {
      const response = await fetchWithAuth('/api/mobile/v1/orders/bulk-status', {
        method: 'POST',
        body: JSON.stringify({ orderIds, status }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-orders'] });
    },
  });
}

export function useToggleOrderItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: string; isCompleted: boolean }) => {
      const response = await fetchWithAuth(`/api/mobile/v1/orders/items/${itemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isCompleted }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-orders'] });
    },
  });
}
