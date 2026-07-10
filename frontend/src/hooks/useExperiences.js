import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useExperiences(filters = {}) {
  return useQuery({
    queryKey: ['experiences', filters],
    queryFn: async () => (await api.get('/experiences', { params: filters })).data,
  });
}

export function useExperience(id) {
  return useQuery({
    queryKey: ['experience', id],
    queryFn: async () => (await api.get(`/experiences/${id}`)).data.data,
    enabled: !!id,
  });
}

// Live "have we tried this before" lookup — fires as the new-experience form is filled in.
export function useSimilarExperiences({ country, category, platform, budgetMicros }) {
  return useQuery({
    queryKey: ['similar-experiences', country, category, platform, budgetMicros],
    queryFn: async () =>
      (await api.get('/experiences/similar', { params: { country, category, platform, budgetMicros } })).data.data,
    enabled: !!(country || category),
  });
}

export function useCreateExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/experiences', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['experiences'] }),
  });
}
