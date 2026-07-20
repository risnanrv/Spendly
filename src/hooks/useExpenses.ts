import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService, expenseRepo } from '@/lib/services';
import { auth } from '@/firebase/config';
import { useToastStore } from '@/stores/toast.store';
import type { ExpenseInsert, ExpenseUpdate } from '@/database/repositories/interfaces';

export interface GetExpensesFilters {
  monthStr?: string; // YYYY-MM
  categoryId?: string;
  search?: string;
}

export function useExpenses(filters: GetExpensesFilters = {}) {
  const userId = auth.currentUser?.uid;

  return useQuery({
    queryKey: ['expenses', userId, filters],
    queryFn: async () => {
      if (!userId) return [];
      
      const filterOption = filters.monthStr
        ? undefined 
        : undefined;

      const results = await expenseRepo.getExpenses(userId, {
        categoryId: filters.categoryId || undefined,
        search: filters.search || undefined,
        filter: undefined, 
      });

      // Filter by Month client-side
      if (filters.monthStr) {
        const [year, month] = filters.monthStr.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        return results.filter((exp) => exp.date >= startDate && exp.date <= endDate);
      }

      return results;
    },
    enabled: !!userId,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (data: {
      title: string | null;
      amount: number;
      categoryId: string;
      dateStr: string;
      note?: string | null;
    }) => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Unauthorized');

      const insertData: ExpenseInsert = {
        title: data.title?.trim() ? data.title.trim() : null,
        amount: data.amount,
        categoryId: data.categoryId,
        date: new Date(data.dateStr),
        note: data.note?.trim() ? data.note.trim() : null,
      };

      return expenseService.createExpense(userId, insertData);
    },
    onSuccess: () => {
      const userId = auth.currentUser?.uid;
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
      queryClient.invalidateQueries({ queryKey: ['reports', userId] });
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
        title?: string | null;
        amount?: number;
        categoryId?: string;
        dateStr?: string;
        note?: string | null;
      };
    }) => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Unauthorized');

      const updateData: ExpenseUpdate = {};
      if (data.title !== undefined) updateData.title = data.title?.trim() ? data.title.trim() : null;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.dateStr !== undefined) updateData.date = new Date(data.dateStr);
      if (data.note !== undefined) updateData.note = data.note?.trim() ? data.note.trim() : null;

      return expenseService.updateExpense(userId, id, updateData);
    },
    onSuccess: () => {
      const userId = auth.currentUser?.uid;
      // Invalidate all expense queries (any filter combination)
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      // Invalidate all dependent views
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
      queryClient.invalidateQueries({ queryKey: ['reports', userId] });
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
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
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Unauthorized');

      return expenseService.deleteExpense(userId, id);
    },
    onMutate: async (id) => {
      const userId = auth.currentUser?.uid;
      // Cancel any in-flight expense queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['expenses', userId] });

      // Snapshot current data for rollback
      const previousData = queryClient.getQueriesData({ queryKey: ['expenses', userId] });

      // Optimistically remove the expense from ALL cached expense query variants
      queryClient.setQueriesData(
        { queryKey: ['expenses', userId], exact: false },
        (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.filter((item: any) => item.id !== id);
        }
      );

      return { previousData };
    },
    onError: (err: any, _id, context) => {
      // Roll back optimistic update on error
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      addToast(err.message || 'Failed to delete expense', 'danger');
    },
    onSuccess: () => {
      const userId = auth.currentUser?.uid;
      // Invalidate all expense queries (any filter combination)
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      // Invalidate all dependent views
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
      queryClient.invalidateQueries({ queryKey: ['reports', userId] });
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
      addToast('Expense deleted successfully.', 'success');
    },
  });
}
