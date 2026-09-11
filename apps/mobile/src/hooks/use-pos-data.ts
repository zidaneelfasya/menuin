import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/api-client';
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
  options: { id: string; name: string; price: number }[]; // Adjusted for API response
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
      const response = await fetch(getApiUrl('/api/mobile/v1/pos'), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch POS data');
      }

      return response.json();
    },
    enabled: !!sessionToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
