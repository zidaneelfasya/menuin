import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api-client';
import { ProductDto, CategoryDto } from '@menuin/types';

interface PosDataResponse {
  success: boolean;
  data: {
    categories: CategoryDto[];
    products: ProductDto[];
    modifierGroups: any[];
    settings: any;
  };
}

export function usePosData() {
  return useQuery({
    queryKey: ['pos-data'],
    queryFn: async () => {
      const response = await fetchWithAuth('/mobile/v1/pos');
      return response as PosDataResponse;
    },
  });
}

export function useSubmitOrder() {
  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetchWithAuth('/mobile/v1/pos', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return response;
    },
  });
}

