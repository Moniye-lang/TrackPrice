'use client';

import { useQuery } from '@tanstack/react-query';

export interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  storeId?: {
    _id: string;
    name: string;
    area: string;
    city: string;
  };
  storeLocation?: string;
  lastUpdated: string;
  updatedAt: string;
  [key: string]: any;
}

export interface Store {
  _id: string;
  name: string;
  area?: string;
  [key: string]: any;
}

export function useHomeData() {
  return useQuery({
    queryKey: ['home-data'],
    queryFn: async () => {
      const [featRes, staleRes, recentRes, leaderRes, statsRes, storesRes] = await Promise.all([
        fetch('/api/products?featured=true&limit=4'),
        fetch('/api/products?stale=true&limit=5'),
        fetch('/api/products?sort=updated&limit=5'),
        fetch('/api/leaderboard'),
        fetch('/api/stats'),
        fetch('/api/stores')
      ]);

      const [featured, stale, recent, leaderboard, stats, stores] = await Promise.all([
        featRes.json(),
        staleRes.json(),
        recentRes.json(),
        leaderRes.json(),
        statsRes.json(),
        storesRes.json()
      ]);

      return {
        featuredProducts: (Array.isArray(featured) ? featured : featured?.products ?? []).slice(0, 4) as Product[],
        staleProducts: (Array.isArray(stale) ? stale : stale?.products ?? []).slice(0, 5) as Product[],
        recentUpdates: (Array.isArray(recent) ? recent : recent?.products ?? []).slice(0, 5) as Product[],
        leaderboard: (leaderboard.users || []) as any[],
        stats: stats || { updatesToday: 0, marketsTracked: 0, lastUpdateMins: 0 },
        stores: (Array.isArray(stores) ? stores : []) as Store[]
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

interface ProductParams {
  search?: string;
  category?: string;
  marketCategory?: string;
  storeId?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  products: Product[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export function useProducts(params: ProductParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams(params as any);
      const res = await fetch(`/api/products?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      
      const data = await res.json();
      // If the backend returns an array (backward compatibility), wrap it
      if (Array.isArray(data)) {
         return {
            products: data,
            currentPage: 1,
            totalPages: 1,
            totalCount: data.length
         } as PaginatedProducts;
      }
      return data as PaginatedProducts;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const [prodRes, msgRes] = await Promise.all([
        fetch(`/api/products/${id}`),
        fetch(`/api/messages?productId=${id}`)
      ]);

      if (!prodRes.ok) throw new Error('Product not found');
      
      const productData = await prodRes.json();
      const messagesData = await msgRes.json();
      
      return {
        product: productData as Product,
        messages: (messagesData || []) as any[]
      };
    },
    staleTime: 60 * 1000, // 1 minute
    enabled: !!id,
  });
}
