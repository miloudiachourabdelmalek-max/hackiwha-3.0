import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useCampaigns(filters = {}) {
  return useQuery({
    queryKey: ['campaigns', filters],
    queryFn: async () => (await api.get('/campaigns', { params: filters })).data,
  });
}

export function useCampaign(id) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => (await api.get(`/campaigns/${id}`)).data.data,
    enabled: !!id,
  });
}
