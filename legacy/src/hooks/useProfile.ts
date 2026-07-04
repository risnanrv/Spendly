import { useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '@/di/ServiceContainer';
import type { ProfileService } from '@/services/ProfileService';

const getService = () => container.resolve<ProfileService>('ProfileService');

/**
 * useProfile custom hook exposes avatar pickers and profile update mutations.
 */
export const useProfile = () => {
  const queryClient = useQueryClient();
  const service = getService();

  const pickAvatarMutation = useMutation({
    mutationFn: () => service.pickAvatar(),
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ name, avatarUrl }: { name: string; avatarUrl: string | null }) =>
      service.updateProfile(name, avatarUrl),
    onSuccess: () => {
      // Invalidate queries that consume user profiles
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  return {
    pickAvatar: pickAvatarMutation.mutateAsync,
    isPickingAvatar: pickAvatarMutation.isPending,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
  };
};
