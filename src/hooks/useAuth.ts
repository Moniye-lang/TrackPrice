'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';

export function useAuth() {
  const { setUser, logout, user, isLoading: storeLoading } = useAuthStore();

  const { data, isLoading, error, isSuccess } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error('Not authenticated');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  useEffect(() => {
    if (isSuccess && data?.user) {
      setUser(data.user);
    } else if (error) {
      logout();
    }
  }, [data, isSuccess, error, setUser, logout]);

  return {
    user: user || data?.user || null,
    isLoading: isLoading && storeLoading,
    isAuthenticated: !!(user || data?.user),
  };
}
