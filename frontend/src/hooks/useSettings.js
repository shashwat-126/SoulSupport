import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settingsService';

export function useSettings() {
  const queryClient = useQueryClient();

  const settings = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getMySettings,
    staleTime: 5 * 60 * 1000,
  });

  const updateSettings = useMutation({
    mutationFn: settingsService.updateMySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const deleteAccount = useMutation({
    mutationFn: settingsService.deleteMyAccount,
  });

  return {
    settings,
    updateSettings,
    deleteAccount,
  };
}