import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await api.get('/stats');
      return response.data;
    },
    refetchInterval: 30000,
  });
}
