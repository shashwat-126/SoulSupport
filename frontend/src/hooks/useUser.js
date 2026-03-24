import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';

export function useUser() {
  const queryClient = useQueryClient();

  const me = useQuery({ queryKey: ['me'], queryFn: userService.getMe, staleTime: 5 * 60 * 1000 });

  const updateProfile = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  const updateAvatar = useMutation({
    mutationFn: ({ id, file }) => userService.updateAvatar(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  return { me, updateProfile, updateAvatar };
}
