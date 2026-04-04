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

export function useAdminProducts() {
  return useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch admin products');
      return res.json();
    },
  });
}
