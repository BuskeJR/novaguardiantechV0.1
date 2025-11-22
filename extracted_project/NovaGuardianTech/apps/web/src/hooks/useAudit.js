import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useAuditLogs(params = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.user_id) queryParams.append('user_id', params.user_id);
  if (params.action) queryParams.append('action', params.action);
  if (params.client_id) queryParams.append('client_id', params.client_id);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.offset) queryParams.append('offset', params.offset);
  
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const response = await api.get(`/admin/audit?${queryParams.toString()}`);
      return response.data;
    },
  });
}
