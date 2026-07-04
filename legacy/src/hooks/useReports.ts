import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { container, DI_TOKENS } from '@/di/ServiceContainer';
import type { ReportService } from '@/services/ReportService';
import type { ReportData, MonthlyReport, YearlyReport, DateRangePreset } from '@/models/report';
import { getMonthStr } from '@/utils/date';

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const reportKeys = {
  all: ['reports'] as const,
  monthly: (monthStr: string) => ['reports', 'monthly', monthStr] as const,
  yearly: (year: number) => ['reports', 'yearly', year] as const,
  preset: (preset: DateRangePreset) => ['reports', 'preset', preset] as const,
  custom: (start: string, end: string) => ['reports', 'custom', start, end] as const,
};

// ─── Hook implementations ─────────────────────────────────────────────────────

/**
 * Fetches a full monthly report with category, trend, and summary data.
 * Prefetches adjacent months for instant navigation.
 */
export const useMonthlyReport = (monthStr: string) => {
  const queryClient = useQueryClient();

  const query = useQuery<MonthlyReport, Error>({
    queryKey: reportKeys.monthly(monthStr),
    queryFn: async () => {
      const service = container.resolve<ReportService>(DI_TOKENS.ReportService);
      return service.getMonthlyReport(monthStr);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Prefetch adjacent months whenever the selected month changes
  useEffect(() => {
    const [year, month] = monthStr.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const nextDate = new Date(year, month, 1);
    const prevMonth = getMonthStr(prevDate);
    const nextMonth = getMonthStr(nextDate);

    queryClient.prefetchQuery({
      queryKey: reportKeys.monthly(prevMonth),
      queryFn: () => {
        const service = container.resolve<ReportService>(DI_TOKENS.ReportService);
        return service.getMonthlyReport(prevMonth);
      },
      staleTime: 1000 * 60 * 5,
    });

    queryClient.prefetchQuery({
      queryKey: reportKeys.monthly(nextMonth),
      queryFn: () => {
        const service = container.resolve<ReportService>(DI_TOKENS.ReportService);
        return service.getMonthlyReport(nextMonth);
      },
      staleTime: 1000 * 60 * 5,
    });
  }, [monthStr, queryClient]);

  return query;
};

/**
 * Fetches a full yearly report including month-by-month breakdown.
 */
export const useYearlyReport = (year: number) =>
  useQuery<YearlyReport, Error>({
    queryKey: reportKeys.yearly(year),
    queryFn: () => {
      const service = container.resolve<ReportService>(DI_TOKENS.ReportService);
      return service.getYearlyReport(year);
    },
    staleTime: 1000 * 60 * 10,
  });

/**
 * Fetches a report for a named date range preset.
 */
export const usePresetReport = (preset: DateRangePreset) =>
  useQuery<ReportData, Error>({
    queryKey: reportKeys.preset(preset),
    queryFn: () => {
      const service = container.resolve<ReportService>(DI_TOKENS.ReportService);
      return service.getPresetReport(preset);
    },
    staleTime: 1000 * 60 * 2,
  });

/**
 * Fetches a report for an explicit custom date range.
 */
export const useCustomReport = (startDate: Date | null, endDate: Date | null) =>
  useQuery<ReportData, Error>({
    queryKey: reportKeys.custom(
      startDate?.toISOString() ?? '',
      endDate?.toISOString() ?? ''
    ),
    queryFn: () => {
      const service = container.resolve<ReportService>(DI_TOKENS.ReportService);
      return service.getCustomReport(startDate!, endDate!);
    },
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 2,
  });

/**
 * Fetches top categories breakdown for a given month.
 */
export const useCategoryBreakdown = (monthStr: string) =>
  useQuery({
    queryKey: [...reportKeys.monthly(monthStr), 'categories'],
    queryFn: async () => {
      const service = container.resolve<ReportService>(DI_TOKENS.ReportService);
      const report = await service.getMonthlyReport(monthStr);
      return report.categoryBreakdown;
    },
    staleTime: 1000 * 60 * 5,
  });

/**
 * Fetches monthly spending trend for a year (12 monthly data points).
 */
export const useMonthlyTrend = (year: number) =>
  useQuery({
    queryKey: [...reportKeys.yearly(year), 'trend'],
    queryFn: async () => {
      const service = container.resolve<ReportService>(DI_TOKENS.ReportService);
      const report = await service.getYearlyReport(year);
      return report.monthlyTrend;
    },
    staleTime: 1000 * 60 * 10,
  });

/**
 * Compares current month to previous month.
 */
export const useMonthComparison = (currentMonthStr: string) => {
  const [year, month] = currentMonthStr.split('-').map(Number);
  const prevDate = new Date(year, month - 2, 1);
  const previousMonthStr = getMonthStr(prevDate);

  return useQuery<{ current: MonthlyReport; previous: MonthlyReport; difference: number; percentageChange: number; isIncrease: boolean }, Error>({
    queryKey: ['reports', 'compare', currentMonthStr, previousMonthStr],
    queryFn: () => {
      const service = container.resolve<ReportService>(DI_TOKENS.ReportService);
      return service.compareMonths(currentMonthStr, previousMonthStr);
    },
    staleTime: 1000 * 60 * 5,
  });
};
