import { useQuery } from '@tanstack/react-query';
import { therapistService } from '@/services/therapistService';

export function useTherapists(params, queryOptions = {}) {
  const list = useQuery({
    queryKey: ['therapists', params],
    queryFn: () => therapistService.getTherapists(params),
    ...queryOptions,
  });
  return { list };
}

export function useTherapist(id) {
  return useQuery({ queryKey: ['therapist', id], queryFn: () => therapistService.getTherapist(id), enabled: !!id });
}

export function useTherapistReviews(id) {
  return useQuery({
    queryKey: ['therapist-reviews', id],
    queryFn: () => therapistService.getReviews(id),
    enabled: !!id,
  });
}

