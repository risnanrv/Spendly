import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { container, DI_TOKENS } from '@/di/ServiceContainer';
import type { BudgetService, BudgetDetails } from '@/services/BudgetService';
import { logger } from '@/utils/logger';

/**
 * Custom React Query hook fetching details for the monthly budget.
 */
export const useCurrentBudget = (monthStr: string) => {
  return useQuery<BudgetDetails>({
    queryKey: ['budget', monthStr],
    queryFn: async () => {
      const budgetService = container.resolve<BudgetService>(DI_TOKENS.BudgetService);
      return budgetService.getBudgetDetails(monthStr);
    },
    staleTime: 1000 * 10, // 10 seconds
  });
};

/**
 * Custom React Query hook saving/updating budget with optimistic UI updates.
 */
export const useSaveBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ monthStr, amount }: { monthStr: string; amount: number }) => {
      const budgetService = container.resolve<BudgetService>(DI_TOKENS.BudgetService);
      return budgetService.saveBudget(monthStr, amount);
    },
    onMutate: async ({ monthStr, amount }) => {
      await queryClient.cancelQueries({ queryKey: ['budget', monthStr] });
      await queryClient.cancelQueries({ queryKey: ['dashboard', monthStr] });

      const previousBudget = queryClient.getQueryData(['budget', monthStr]);

      queryClient.setQueryData(['budget', monthStr], (old: any) => {
        if (!old) return old;
        const ratio = amount > 0 ? old.spent / amount : 0;
        const status = amount > 0 ? (ratio >= 1.0 ? 'exceeded' : ratio >= 0.8 ? 'approaching' : 'safe') : 'none';

        return {
          ...old,
          budget: amount,
          remaining: Math.max(0, amount - old.spent),
          percentage: amount > 0 ? Math.round((old.spent / amount) * 100) : 0,
          status,
          isExceeded: status === 'exceeded',
          isNearLimit: status === 'approaching',
        };
      });

      return { previousBudget, monthStr };
    },
    onError: (err, _variables, context) => {
      logger.error('Optimistic save budget mutation failed, rolling back:', err);
      if (context?.previousBudget && context.monthStr) {
        queryClient.setQueryData(['budget', context.monthStr], context.previousBudget);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget', variables.monthStr] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', variables.monthStr] });
    },
  });
};

/**
 * Custom React Query hook deleting budget with optimistic UI updates.
 */
export const useDeleteBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (monthStr: string) => {
      const budgetService = container.resolve<BudgetService>(DI_TOKENS.BudgetService);
      return budgetService.deleteBudget(monthStr);
    },
    onMutate: async (monthStr) => {
      await queryClient.cancelQueries({ queryKey: ['budget', monthStr] });
      await queryClient.cancelQueries({ queryKey: ['dashboard', monthStr] });

      const previousBudget = queryClient.getQueryData(['budget', monthStr]);

      queryClient.setQueryData(['budget', monthStr], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          budget: 0,
          remaining: 0,
          percentage: 0,
          status: 'none',
          isExceeded: false,
          isNearLimit: false,
        };
      });

      return { previousBudget, monthStr };
    },
    onError: (err, _monthStr, context) => {
      logger.error('Optimistic delete budget mutation failed, rolling back:', err);
      if (context?.previousBudget && context.monthStr) {
        queryClient.setQueryData(['budget', context.monthStr], context.previousBudget);
      }
    },
    onSettled: (_data, _err, _monthStr) => {
      queryClient.invalidateQueries({ queryKey: ['budget', _monthStr] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', _monthStr] });
    },
  });
};
