import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function usePiholeInstances() {
  return useQuery({
    queryKey: ['pihole-instances'],
    queryFn: async () => {
      const response = await api.get('/admin/pihole/list');
      return response.data.instances || [];
    },
  });
}

export function useProvisionPihole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/admin/pihole/provision', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pihole-instances']);
    },
  });
}

export function useDeprovisionPihole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (clientId) => {
      await api.delete(`/admin/pihole/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pihole-instances']);
    },
  });
}

export function useRestartPihole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (containerName) => {
      const response = await api.post(`/admin/pihole/${containerName}/restart`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pihole-instances']);
    },
  });
}

export function useUpdateDnsdist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/pihole/dnsdist/update-config');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pihole-instances']);
    },
  });
}
