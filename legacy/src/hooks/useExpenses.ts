import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { container, DI_TOKENS } from '@/di/ServiceContainer';
import type { IExpenseRepository } from '@/database/repositories/interfaces';
import type { ExpenseService } from '@/services/ExpenseService';
import type { Expense } from '@/models/domain';
import { logger } from '@/utils/logger';
import { useCallback } from 'react';

/**
 * Hook to retrieve all categories for form selection.
 */
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const categoryRepo = container.resolve<any>(DI_TOKENS.CategoryRepository);
      return categoryRepo.getCategories();
    },
  });
};

/**
 * Hook to retrieve expenses list.
 */
export const useExpenses = (options: {
  filter?: 'today' | 'week' | 'month' | 'all';
  search?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
} = {}) => {
  return useQuery({
    queryKey: ['expenses', 'list', options],
    queryFn: async () => {
      const expenseRepo = container.resolve<IExpenseRepository>(DI_TOKENS.ExpenseRepository);
      return expenseRepo.getExpenses(options);
    },
  });
};

/**
 * Hook to retrieve expenses via Infinite Loading (offset pagination).
 * Perfect for FlashList infinite scroll views.
 */
export const useExpensesInfinite = (options: {
  filter?: 'today' | 'week' | 'month' | 'all';
  search?: string;
  categoryId?: string;
  limit?: number;
} = {}) => {
  const limit = options.limit ?? 20;

  return useInfiniteQuery({
    queryKey: ['expenses', 'infinite', { ...options, limit }],
    queryFn: async ({ pageParam = 0 }) => {
      const expenseRepo = container.resolve<IExpenseRepository>(DI_TOKENS.ExpenseRepository);
      const params: any = { limit, offset: pageParam };
      if (options.filter && options.filter !== 'all') params.filter = options.filter;
      if (options.search) params.search = options.search;
      if (options.categoryId) params.categoryId = options.categoryId;
      return expenseRepo.getExpenses(params);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < limit) return undefined;
      return allPages.length * limit;
    },
  });
};

/**
 * Hook to fetch single expense detail state.
 */
export const useExpense = (id: string) => {
  return useQuery({
    queryKey: ['expense', id],
    queryFn: async () => {
      const expenseRepo = container.resolve<IExpenseRepository>(DI_TOKENS.ExpenseRepository);
      const expense = await expenseRepo.getExpenseById(id);
      if (!expense) throw new Error('Expense not found.');
      return expense;
    },
    enabled: !!id,
  });
};

/**
 * Prefetch handler for preloading expense details before editing.
 */
export const usePrefetchExpense = () => {
  const queryClient = useQueryClient();

  return useCallback((id: string) => {
    if (!id) return;
    const expenseRepo = container.resolve<IExpenseRepository>(DI_TOKENS.ExpenseRepository);
    queryClient.prefetchQuery({
      queryKey: ['expense', id],
      queryFn: () => expenseRepo.getExpenseById(id),
    });
  }, [queryClient]);
};

/**
 * Mutation hook to create expense with optimistic list update.
 */
export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const expenseService = container.resolve<ExpenseService>(DI_TOKENS.ExpenseService);
      return expenseService.createExpense(data);
    },
    onMutate: async (newExpenseData) => {
      // Cancel outgoing refetches so they don't overwrite optimistic states
      await queryClient.cancelQueries({ queryKey: ['expenses'] });

      // Snapshot previous lists
      const previousExpenses = queryClient.getQueryData(['expenses']);

      // Optimistically insert item
      const optimisticExpense: Expense = {
        id: 'optimistic-id-' + Math.random().toString(),
        amount: newExpenseData.amount,
        categoryId: newExpenseData.categoryId,
        title: newExpenseData.title,
        note: newExpenseData.note || null,
        date: newExpenseData.date,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueriesData({ queryKey: ['expenses'] }, (old: any) => {
        if (!old) return old;
        // Handle both simple lists and infinite page lists
        if (old.pages) {
          return {
            ...old,
            pages: [
              [optimisticExpense, ...old.pages[0]],
              ...old.pages.slice(1),
            ],
          };
        }
        return [optimisticExpense, ...old];
      });

      return { previousExpenses };
    },
    onError: (err, _newExpense, context) => {
      logger.error('Optimistic create mutation failed, rolling back:', err);
      if (context?.previousExpenses) {
        queryClient.setQueryData(['expenses'], context.previousExpenses);
      }
    },
    onSettled: () => {
      // Refetch and sync
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

/**
 * Mutation hook to edit expense with optimistic list and detail cache updates.
 */
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const expenseService = container.resolve<ExpenseService>(DI_TOKENS.ExpenseService);
      await expenseService.updateExpense(id, data);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['expenses'] });
      await queryClient.cancelQueries({ queryKey: ['expense', id] });

      const previousExpenses = queryClient.getQueryData(['expenses']);
      const previousExpense = queryClient.getQueryData(['expense', id]);

      // 1. Optimistic update single detail
      if (previousExpense) {
        queryClient.setQueryData(['expense', id], (old: any) => ({ ...old, ...data }));
      }

      // 2. Optimistic update item inside list cache
      queryClient.setQueriesData({ queryKey: ['expenses'] }, (old: any) => {
        if (!old) return old;
        
        const mapList = (list: Expense[]) =>
          list.map((item) => (item.id === id ? { ...item, ...data } : item));

        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map(mapList),
          };
        }
        return mapList(old);
      });

      return { previousExpenses, previousExpense, id };
    },
    onError: (err, _variables, context) => {
      logger.error('Optimistic update mutation failed, rolling back:', err);
      if (context?.previousExpenses) {
        queryClient.setQueryData(['expenses'], context.previousExpenses);
      }
      if (context?.previousExpense && context.id) {
        queryClient.setQueryData(['expense', context.id], context.previousExpense);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

/**
 * Mutation hook to delete expense with optimistic list updates.
 */
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const expenseService = container.resolve<ExpenseService>(DI_TOKENS.ExpenseService);
      await expenseService.deleteExpense(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['expenses'] });
      await queryClient.cancelQueries({ queryKey: ['expense', id] });

      const previousExpenses = queryClient.getQueryData(['expenses']);

      // Optimistically remove from cache lists
      queryClient.setQueriesData({ queryKey: ['expenses'] }, (old: any) => {
        if (!old) return old;

        const filterList = (list: Expense[]) => list.filter((item) => item.id !== id);

        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map(filterList),
          };
        }
        return filterList(old);
      });

      return { previousExpenses };
    },
    onError: (err, _id, context) => {
      logger.error('Optimistic delete mutation failed, rolling back:', err);
      if (context?.previousExpenses) {
        queryClient.setQueryData(['expenses'], context.previousExpenses);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
