import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useMyIP() {
  return useQuery({
    queryKey: ['my-ip'],
    queryFn: async () => {
      const response = await api.get('/my-ip');
      return response.data;
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });
}
