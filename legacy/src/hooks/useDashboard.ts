import { useQuery } from '@tanstack/react-query';
import { container, DI_TOKENS } from '@/di/ServiceContainer';
import type { DashboardService, DashboardData } from '@/services/DashboardService';

/**
 * Custom React Query hook fetching compiled dashboard metrics.
 * Uses a 10s stale time to prevent unnecessary DB reads.
 */
export const useDashboard = (monthStr: string) => {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', monthStr],
    queryFn: async () => {
      const dashboardService = container.resolve<DashboardService>(DI_TOKENS.DashboardService);
      return dashboardService.getDashboardData(monthStr);
    },
    staleTime: 1000 * 10,
  });
};

/**
 * Custom hook returning only the monthly summaries.
 * Uses the cached query to prevent duplicate SQLite loads.
 */
export const useMonthlySummary = (monthStr: string) => {
  const query = useDashboard(monthStr);
  return {
    ...query,
    data: query.data
      ? {
          totalSpent: query.data.totalSpent,
          expenseCount: query.data.expenseCount,
          averageDailySpend: query.data.averageDailySpend,
          remainingDays: query.data.remainingDays,
          highestExpense: query.data.highestExpense,
          largestCategory: query.data.largestCategory,
        }
      : undefined,
  };
};

/**
 * Custom hook returning cached recent 5 transactions list.
 */
export const useRecentExpenses = (monthStr: string) => {
  const query = useDashboard(monthStr);
  return {
    ...query,
    data: query.data?.recentExpenses,
  };
};

/**
 * Custom hook returning cached top categories list.
 */
export const useTopCategories = (monthStr: string) => {
  const query = useDashboard(monthStr);
  return {
    ...query,
    data: query.data?.topCategories,
  };
};
export type { DashboardData };
