import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSettingsAction,
  updateProfileAction,
  saveAppearanceAction,
  truncateExpensesAction,
  truncateBudgetsAction,
  truncateCategoriesAction,
  resetDatabaseAction,
} from '@/actions/settings';
import { useToastStore } from '@/stores/toast.store';
import { useThemeStore } from '@/stores/theme.store';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await getSettingsAction();
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (name: string) => {
      const response = await updateProfileAction(name);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      addToast('Profile updated successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to update profile info', 'danger');
    },
  });
}

export function useSaveAppearance() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (data: { theme: 'light' | 'dark' | 'system'; currency: string }) => {
      const response = await saveAppearanceAction(data);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      
      // Update global theme styling preference in window
      if (typeof window !== 'undefined') {
        useThemeStore.getState().setPreference(variables.theme);
      }

      addToast('Preferences saved successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to update preferences', 'danger');
    },
  });
}

export function useTruncateExpenses() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async () => {
      const response = await truncateExpensesAction();
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      addToast('All expenses deleted successfully.', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to delete expenses', 'danger');
    },
  });
}

export function useTruncateBudgets() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async () => {
      const response = await truncateBudgetsAction();
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      addToast('All budgets deleted successfully.', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to delete budgets', 'danger');
    },
  });
}

export function useTruncateCategories() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async () => {
      const response = await truncateCategoriesAction();
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      addToast('Custom categories deleted successfully.', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to delete custom categories', 'danger');
    },
  });
}

export function useResetDatabase() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async () => {
      const response = await resetDatabaseAction();
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      addToast('Database reset successfully. System defaults restored.', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to reset database', 'danger');
    },
  });
}
