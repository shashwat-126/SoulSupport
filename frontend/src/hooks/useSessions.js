import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionService } from '@/services/sessionService';

export function useSessions(params, queryOptions = {}) {
  const list = useQuery({
    queryKey: ['sessions', params],
    queryFn: () => sessionService.getSessions(params),
    ...queryOptions,
  });
  return { list };
}

export function useSessionMutations() {
  const queryClient = useQueryClient();
  const invalidateSessionQueries = () =>
    queryClient.invalidateQueries({ queryKey: ['sessions'] });

  const createSession = useMutation({
    mutationFn: sessionService.createSession,
    onSuccess: invalidateSessionQueries,
  });

  const createSlotHold = useMutation({
    mutationFn: sessionService.createSlotHold,
  });

  const confirmSlotHold = useMutation({
    mutationFn: ({ holdId, data }) => sessionService.confirmSlotHold(holdId, data),
    onSuccess: invalidateSessionQueries,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, data }) => sessionService.updateSessionStatus(id, data),
    onSuccess: invalidateSessionQueries,
  });

  const cancelSession = useMutation({
    mutationFn: ({ id, reason }) => sessionService.cancelSession(id, reason),
    onSuccess: invalidateSessionQueries,
  });

  const cancelSessionAsTherapist = useMutation({
    mutationFn: ({ id, reason }) => sessionService.cancelSessionAsTherapist(id, reason),
    onSuccess: invalidateSessionQueries,
  });

  const updateCompletionStatus = useMutation({
    mutationFn: ({ id, data }) => sessionService.updateCompletionStatus(id, data),
    onSuccess: invalidateSessionQueries,
  });

  return {
    createSession,
    createSlotHold,
    confirmSlotHold,
    updateStatus,
    cancelSession,
    cancelSessionAsTherapist,
    updateCompletionStatus,
  };
}
