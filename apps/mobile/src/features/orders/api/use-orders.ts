import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api-client';

export interface OrderItemDto {
  id: string;
  transactionId: string;
  quantity: number;
  productName: string;
  subtotal: string;
  isCompleted: boolean;
}

export interface OrderDto {
  id: string;
  tenantId: string;
  status: string;
  orderNumber: string;
  customerName: string | null;
  tableNumber: string | null;
  grandTotal: string;
  createdAt: string;
  orderType: string;
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
      const response = await fetchWithAuth('/mobile/v1/orders');
      return response as OrdersResponse;
    },
    refetchInterval: 10000, // Fallback polling in case realtime fails
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await fetchWithAuth(`/mobile/v1/orders/${orderId}/status`, {
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
