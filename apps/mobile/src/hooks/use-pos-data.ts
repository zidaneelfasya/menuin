import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModifierGroup {
  id: string;
  tenantId: string;
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  options: { id: string; name: string; price: number; isAvailable?: boolean }[]; // Adjusted for API response
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string | null;
  name: string;
  price: string;
  stock: number | null;
  categoryId: string;
  imageUrl: string | null;
  barcode: string | null;
  isAvailableOnline: boolean;
  isFeatured: boolean;
  isActive?: boolean;
  modifierGroupIds: string[];
}

export interface PosDataResponse {
  success: boolean;
  data: {
    categories: Category[];
    products: Product[];
    modifierGroups: ModifierGroup[];
    settings: any;
  };
}

export const usePosData = () => {
  const sessionToken = useAuthStore((state) => state.sessionToken);

  return useQuery({
    queryKey: ['posData'],
    queryFn: async (): Promise<PosDataResponse> => {
      const data = await fetchWithAuth('/api/mobile/v1/pos');
      return data as PosDataResponse;
    },
    enabled: !!sessionToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUpdateProductActiveStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      const res = await fetchWithAuth('/api/mobile/v1/pos', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, isActive }),
      });
      return res;
    },
    onMutate: async ({ productId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['posData'] });
      const previousPosData = queryClient.getQueryData<PosDataResponse>(['posData']);

      if (previousPosData?.data?.products) {
        queryClient.setQueryData<PosDataResponse>(['posData'], {
          ...previousPosData,
          data: {
            ...previousPosData.data,
            products: previousPosData.data.products.map((p) =>
              p.id === productId ? { ...p, isActive } : p
            ),
          },
        });
      }

      return { previousPosData };
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<PosDataResponse>(['posData'], (old) => {
        if (!old?.data?.products) return old;
        return {
          ...old,
          data: {
            ...old.data,
            products: old.data.products.map((p) =>
              p.id === variables.productId ? { ...p, isActive: variables.isActive } : p
            ),
          },
        };
      });
    },
    onError: (err, variables, context) => {
      console.error('[useUpdateProductActiveStatus] Error updating product:', err);
      if (context?.previousPosData) {
        queryClient.setQueryData(['posData'], context.previousPosData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posData'] });
    },
  });
};

export const useUpdateModifierAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modifierId, isAvailable }: { modifierId: string; isAvailable: boolean }) => {
      const res = await fetchWithAuth('/api/mobile/v1/pos', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modifierId, isAvailable }),
      });
      return res;
    },
    onMutate: async ({ modifierId, isAvailable }) => {
      await queryClient.cancelQueries({ queryKey: ['posData'] });
      const previousPosData = queryClient.getQueryData<PosDataResponse>(['posData']);

      if (previousPosData?.data?.modifierGroups) {
        queryClient.setQueryData<PosDataResponse>(['posData'], {
          ...previousPosData,
          data: {
            ...previousPosData.data,
            modifierGroups: previousPosData.data.modifierGroups.map((group) => ({
              ...group,
              options: group.options.map((opt) =>
                opt.id === modifierId ? { ...opt, isAvailable } : opt
              ),
            })),
          },
        });
      }

      return { previousPosData };
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<PosDataResponse>(['posData'], (old) => {
        if (!old?.data?.modifierGroups) return old;
        return {
          ...old,
          data: {
            ...old.data,
            modifierGroups: old.data.modifierGroups.map((group) => ({
              ...group,
              options: group.options.map((opt) =>
                opt.id === variables.modifierId
                  ? { ...opt, isAvailable: variables.isAvailable }
                  : opt
              ),
            })),
          },
        };
      });
    },
    onError: (err, variables, context) => {
      console.error('[useUpdateModifierAvailability] Error updating modifier:', err);
      if (context?.previousPosData) {
        queryClient.setQueryData(['posData'], context.previousPosData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posData'] });
      queryClient.invalidateQueries({ queryKey: ['pos-data'] });
    },
  });
};

