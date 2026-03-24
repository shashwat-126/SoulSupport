import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@/services/reviewService';

export function useSessionReview(sessionId) {
  return useQuery({
    queryKey: ['session-review', sessionId],
    queryFn: () => reviewService.getSessionReview(sessionId),
    enabled: !!sessionId,
    retry: false,
  });
}

export function useReviewMutations() {
  const queryClient = useQueryClient();

  const createReview = useMutation({
    mutationFn: reviewService.createReview,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['therapist-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['session-review', variables?.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  return { createReview };
}
