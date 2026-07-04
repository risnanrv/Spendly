import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '@/di/ServiceContainer';
import type { SettingsService, NotificationPreferences } from '@/services/SettingsService';
import type { ThemePreference } from '@/stores/theme.store';

const getService = () => container.resolve<SettingsService>('SettingsService');

/**
 * useTheme hook exposes theme preference values and mutation triggers.
 */
export const useTheme = () => {
  const queryClient = useQueryClient();
  const service = getService();

  const { data: themePreference = 'system', isLoading } = useQuery<ThemePreference>({
    queryKey: ['settings', 'theme'],
    queryFn: () => service.getTheme(),
  });

  const { mutate: setTheme } = useMutation({
    mutationFn: (pref: ThemePreference) => service.setTheme(pref),
    onMutate: async (newPref) => {
      await queryClient.cancelQueries({ queryKey: ['settings', 'theme'] });
      const previous = queryClient.getQueryData<ThemePreference>(['settings', 'theme']);
      queryClient.setQueryData(['settings', 'theme'], newPref);
      return { previous };
    },
    onError: (_err, _newPref, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['settings', 'theme'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'theme'] });
    },
  });

  return { themePreference, setTheme, isLoading };
};

/**
 * useCurrency hook exposes active currency choices and selection updates.
 */
export const useCurrency = () => {
  const queryClient = useQueryClient();
  const service = getService();

  const { data: currency = 'INR', isLoading } = useQuery<string>({
    queryKey: ['settings', 'currency'],
    queryFn: () => service.getCurrency(),
  });

  const { mutate: setCurrency } = useMutation({
    mutationFn: (curr: string) => service.setCurrency(curr),
    onMutate: async (newCurr) => {
      await queryClient.cancelQueries({ queryKey: ['settings', 'currency'] });
      const previous = queryClient.getQueryData<string>(['settings', 'currency']);
      queryClient.setQueryData(['settings', 'currency'], newCurr);
      return { previous };
    },
    onError: (_err, _newCurr, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['settings', 'currency'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'currency'] });
    },
  });

  return { currency, setCurrency, isLoading };
};

/**
 * useNotifications hook manages Budget, Daily, Weekly, and Monthly notification switches.
 */
export const useNotifications = () => {
  const queryClient = useQueryClient();
  const service = getService();

  const { data: preferences, isLoading } = useQuery<NotificationPreferences>({
    queryKey: ['settings', 'notifications'],
    queryFn: () => service.getNotificationPreferences(),
  });

  const { mutate: setPreference } = useMutation({
    mutationFn: ({ key, enabled }: { key: keyof NotificationPreferences; enabled: boolean }) =>
      service.setNotificationPreference(key, enabled),
    onMutate: async ({ key, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ['settings', 'notifications'] });
      const previous = queryClient.getQueryData<NotificationPreferences>(['settings', 'notifications']);
      if (previous) {
        queryClient.setQueryData(['settings', 'notifications'], {
          ...previous,
          [key]: enabled,
        });
      }
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['settings', 'notifications'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] });
    },
  });

  return { preferences, setPreference, isLoading };
};
