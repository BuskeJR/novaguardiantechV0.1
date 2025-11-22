import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useDomains(clientId) {
  return useQuery({
    queryKey: ['domains', clientId],
    queryFn: async () => {
      const url = clientId ? `/domains?client_id=${clientId}` : '/domains';
      const response = await api.get(url);
      return response.data;
    },
    enabled: !!clientId,
  });
}

export function useAddDomain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (domainData) => {
      const response = await api.post('/domains', domainData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['domains', variables.client_id]);
      queryClient.invalidateQueries(['domains']);
    },
  });
}

export function useDeleteDomain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (domainId) => {
      await api.delete(`/domains/${domainId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['domains']);
    },
  });
}

export function useSyncDomains() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (clientId) => {
      const response = await api.post(`/dns/sync/${clientId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['domains']);
    },
  });
}
