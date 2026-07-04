import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getExpensesAction,
  createExpenseAction,
  updateExpenseAction,
  deleteExpenseAction,
  type GetExpensesFilters,
} from '@/actions/expenses';
import { useToastStore } from '@/stores/toast.store';

export function useExpenses(filters: GetExpensesFilters = {}) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      const response = await getExpensesAction(filters);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      amount: number;
      categoryId: string;
      dateStr: string;
      note?: string;
    }) => {
      const response = await createExpenseAction(data);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      addToast('Expense logged successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to log expense', 'danger');
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        title?: string;
        amount?: number;
        categoryId?: string;
        dateStr?: string;
        note?: string;
      };
    }) => {
      const response = await updateExpenseAction(id, data);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      addToast('Expense updated successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to update expense', 'danger');
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteExpenseAction(id);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onMutate: async (id) => {
      // Optimistic update for immediate visual response
      await queryClient.cancelQueries({ queryKey: ['expenses'] });
      const previousExpenses = queryClient.getQueryData(['expenses']);
      
      // Update any matching list queries optimistically
      queryClient.setQueriesData({ queryKey: ['expenses'] }, (old: any) => {
        if (!old) return old;
        return old.filter((item: any) => item.id !== id);
      });

      return { previousExpenses };
    },
    onError: (err: any, id, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueriesData({ queryKey: ['expenses'] }, context.previousExpenses);
      }
      addToast(err.message || 'Failed to delete expense', 'danger');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      addToast('Expense deleted successfully.', 'success');
    },
  });
}
