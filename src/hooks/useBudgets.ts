import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBudgetDetailsAction,
  saveBudgetAction,
  deleteBudgetAction,
  getBudgetHistoryAction,
} from '@/actions/budgets';
import { useToastStore } from '@/stores/toast.store';

export function useBudgetDetails(monthStr: string) {
  return useQuery({
    queryKey: ['budget', monthStr],
    queryFn: async () => {
      const response = await getBudgetDetailsAction(monthStr);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
  });
}

export function useBudgetHistory() {
  return useQuery({
    queryKey: ['budgetHistory'],
    queryFn: async () => {
      const response = await getBudgetHistoryAction();
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
  });
}

export function useSaveBudget() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async ({ monthStr, amount }: { monthStr: string; amount: number }) => {
      const response = await saveBudgetAction(monthStr, amount);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget', variables.monthStr] });
      queryClient.invalidateQueries({ queryKey: ['budgetHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      addToast('Budget limit saved successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to configure budget target', 'danger');
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (monthStr: string) => {
      const response = await deleteBudgetAction(monthStr);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: (_, monthStr) => {
      queryClient.invalidateQueries({ queryKey: ['budget', monthStr] });
      queryClient.invalidateQueries({ queryKey: ['budgetHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      addToast('Budget target removed successfully.', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to remove budget target', 'danger');
    },
  });
}
