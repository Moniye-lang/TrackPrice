'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useAdminQueue() {
  return useQuery({
    queryKey: ['admin-queue'],
    queryFn: async () => {
      const res = await fetch('/api/admin/verification');
      const data = await res.json();
      if (!data.pendingUpdates) return [];
      return data.pendingUpdates.map((u: any) => ({
        ...u,
        product: u.productId,
        user: u.userId
      }));
    },
  });
}

export function useAdminAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      const res = await fetch(`/api/admin/verification/${id}/${action}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action} update`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-queue'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useAdminProducts({ page = 1, limit = 50, search = '' }: { page?: number; limit?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: async () => {
      const url = new URL('/api/products', window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', limit.toString());
      if (search) url.searchParams.set('search', search);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch admin products');
      return res.json();
    },
  });
}
