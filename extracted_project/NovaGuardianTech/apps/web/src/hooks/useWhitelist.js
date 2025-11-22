import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useWhitelist(clientId) {
  return useQuery({
    queryKey: ['whitelist', clientId],
    queryFn: async () => {
      const url = clientId ? `/whitelist?client_id=${clientId}` : '/whitelist';
      const response = await api.get(url);
      return response.data;
    },
    enabled: !!clientId,
  });
}

export function useAddWhitelist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/whitelist', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['whitelist', variables.client_id]);
      queryClient.invalidateQueries(['whitelist']);
    },
  });
}

export function useDeleteWhitelist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (whitelistId) => {
      await api.delete(`/whitelist/${whitelistId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['whitelist']);
    },
  });
}
