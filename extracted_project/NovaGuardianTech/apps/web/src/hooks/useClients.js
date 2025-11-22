import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.get('/admin/clients');
      return response.data;
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (clientData) => {
      const response = await api.post('/admin/clients', clientData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/admin/clients/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (clientId) => {
      await api.delete(`/admin/clients/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
    },
  });
}
