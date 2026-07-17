import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService, expenseRepo } from '@/lib/services';
import { auth, db } from '@/firebase/config';
import { collection, getDocs, query, where, orderBy, limit as limitFn } from 'firebase/firestore';
import { useToastStore } from '@/stores/toast.store';

export function useBudgetDetails(monthStr: string) {
  const userId = auth.currentUser?.uid;

  return useQuery({
    queryKey: ['budget', userId, monthStr],
    queryFn: async () => {
      if (!userId) return null;
      return budgetService.getBudgetDetails(userId, monthStr);
    },
    enabled: !!userId,
  });
}

export function useBudgetHistory() {
  const userId = auth.currentUser?.uid;

  return useQuery({
    queryKey: ['budgetHistory', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Query top 6 budgets ordered by month
      const budgetsQuery = query(
        collection(db, 'budgets'),
        where('userId', '==', userId),
        orderBy('month', 'desc'),
        limitFn(6)
      );
      const snap = await getDocs(budgetsQuery);
      
      const history = [];
      const budgetsList: any[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.deletedAt) {
          budgetsList.push(data);
        }
      });

      for (const b of budgetsList) {
        const expenses = await expenseRepo.getExpensesByMonth(userId, b.month);
        const spent = expenses.reduce((sum: number, item: any) => sum + item.amount, 0);
        history.push({
          month: b.month,
          budget: b.amount,
          spent,
        });
      }

      return history;
    },
    enabled: !!userId,
  });
}

export function useSaveBudget() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async ({ monthStr, amount }: { monthStr: string; amount: number }) => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Unauthorized');

      // convert to cents
      const amountCents = Math.round(amount * 100);
      return budgetService.saveBudget(userId, monthStr, amountCents);
    },
    onSuccess: (_, variables) => {
      const userId = auth.currentUser?.uid;
      queryClient.invalidateQueries({ queryKey: ['budget', userId, variables.monthStr] });
      queryClient.invalidateQueries({ queryKey: ['budgetHistory', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
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
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Unauthorized');

      return budgetService.deleteBudget(userId, monthStr);
    },
    onSuccess: (_, monthStr) => {
      const userId = auth.currentUser?.uid;
      queryClient.invalidateQueries({ queryKey: ['budget', userId, monthStr] });
      queryClient.invalidateQueries({ queryKey: ['budgetHistory', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
      addToast('Budget target removed successfully.', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to remove budget target', 'danger');
    },
  });
}
