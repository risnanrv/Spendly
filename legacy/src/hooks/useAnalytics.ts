import { useQuery } from '@tanstack/react-query';
import { container, DI_TOKENS } from '@/di/ServiceContainer';
import type { AnalyticsService, BudgetContext, AnalyticsResult } from '@/services/AnalyticsService';
import type { ReportService } from '@/services/ReportService';
import { getMonthStr } from '@/utils/date';

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const analyticsKeys = {
  all: ['analytics'] as const,
  monthly: (monthStr: string) => ['analytics', 'monthly', monthStr] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Generates insight cards and analytics statistics for a given reporting period.
 * Computes insights by combining the current month's report with the previous month's
 * report and the current budget state.
 */
export const useAnalytics = (
  monthStr: string,
  budget: BudgetContext
) => {
  const [year, month] = monthStr.split('-').map(Number);
  const prevDate = new Date(year, month - 2, 1);
  const prevMonthStr = getMonthStr(prevDate);

  return useQuery<AnalyticsResult, Error>({
    queryKey: analyticsKeys.monthly(monthStr),
    queryFn: async () => {
      const reportService = container.resolve<ReportService>(DI_TOKENS.ReportService);
      const analyticsService = container.resolve<AnalyticsService>(DI_TOKENS.AnalyticsService);

      // Fetch current and previous month reports in parallel
      const [currentReport, prevReport] = await Promise.all([
        reportService.getMonthlyReport(monthStr),
        reportService.getMonthlyReport(prevMonthStr),
      ]);

      return analyticsService.generateInsights(currentReport, budget, prevReport);
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!monthStr,
  });
};
