import { useMutation } from '@tanstack/react-query';
import { container } from '@/di/ServiceContainer';
import type { NotificationService } from '@/services/NotificationService';

const getService = () => container.resolve<NotificationService>('NotificationService');

/**
 * useNotifications custom hook exposes actions to reschedule notifications manually or programmatically.
 */
export const useNotifications = () => {
  const service = getService();

  const syncRemindersMutation = useMutation({
    mutationFn: () => service.syncScheduledReminders(),
  });

  return {
    syncReminders: syncRemindersMutation.mutateAsync,
    isSyncingReminders: syncRemindersMutation.isPending,
  };
};
export const useNotificationsSync = useNotifications;
