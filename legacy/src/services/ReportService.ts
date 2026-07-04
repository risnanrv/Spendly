import { fetchExpensesWithCategories, type RawExpenseRow } from '@/database/queries/reportQueries';
import { logger } from '@/utils/logger';
import { eventEmitter, RepoEvents } from '@/utils/event-emitter';
import type {
  ReportData,
  MonthlyReport,
  YearlyReport,
  MonthlyBreakdownItem,
  ReportSummary,
  CategoryBreakdown,
  TrendPoint,
  RecentTransaction,
  ReportPeriod,
  DateRangePreset,
} from '@/models/report';

// ─── Date helpers ─────────────────────────────────────────────────────────────

const startOfDay = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const endOfDay = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const toISODate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ─── Aggregation helpers ──────────────────────────────────────────────────────

const buildSummary = (rows: RawExpenseRow[]): ReportSummary => {
  if (rows.length === 0) {
    return {
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0,
      transactionCount: 0,
      averageTransaction: 0,
      averageDailySpending: 0,
      largestExpense: 0,
      smallestExpense: 0,
      highestSpendingDay: null,
      lowestSpendingDay: null,
    };
  }

  const totalExpense = rows.reduce((s, r) => s + r.amount, 0);
  const totalIncome = 0; // Phase 10 scope: expenses only
  const netBalance = totalIncome - totalExpense;
  const transactionCount = rows.length;
  const averageTransaction = Math.round(totalExpense / transactionCount);

  const sorted = [...rows].sort((a, b) => a.amount - b.amount);
  const smallestExpense = sorted[0].amount;
  const largestExpense = sorted[sorted.length - 1].amount;

  // Group by day
  const dayMap = new Map<string, number>();
  for (const r of rows) {
    const key = toISODate(r.date);
    dayMap.set(key, (dayMap.get(key) ?? 0) + r.amount);
  }
  const days = [...dayMap.entries()];
  const daysSorted = days.sort((a, b) => b[1] - a[1]);
  const uniqueDays = dayMap.size;

  const averageDailySpending = uniqueDays > 0 ? Math.round(totalExpense / uniqueDays) : 0;

  const highestSpendingDay: TrendPoint = {
    label: daysSorted[0][0],
    amount: daysSorted[0][1],
    date: daysSorted[0][0],
  };
  const lowestSpendingDay: TrendPoint = {
    label: daysSorted[daysSorted.length - 1][0],
    amount: daysSorted[daysSorted.length - 1][1],
    date: daysSorted[daysSorted.length - 1][0],
  };

  return {
    totalIncome,
    totalExpense,
    netBalance,
    transactionCount,
    averageTransaction,
    averageDailySpending,
    largestExpense,
    smallestExpense,
    highestSpendingDay,
    lowestSpendingDay,
  };
};

const buildCategoryBreakdown = (rows: RawExpenseRow[]): CategoryBreakdown[] => {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const catMap = new Map<string, { name: string; icon: string; color: string; amount: number; count: number }>();

  for (const r of rows) {
    const existing = catMap.get(r.categoryId);
    if (existing) {
      existing.amount += r.amount;
      existing.count += 1;
    } else {
      catMap.set(r.categoryId, {
        name: r.categoryName,
        icon: r.categoryIcon,
        color: r.categoryColor,
        amount: r.amount,
        count: 1,
      });
    }
  }

  const breakdown: CategoryBreakdown[] = [...catMap.entries()]
    .map(([id, cat]) => ({
      categoryId: id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      amount: cat.amount,
      count: cat.count,
      percentage: total > 0 ? Math.round((cat.amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return breakdown;
};

const buildDailyTrend = (rows: RawExpenseRow[], startDate: Date, endDate: Date): TrendPoint[] => {
  const dayMap = new Map<string, number>();

  // Pre-fill every day in range with 0
  const current = new Date(startDate);
  while (current <= endDate) {
    dayMap.set(toISODate(current), 0);
    current.setDate(current.getDate() + 1);
  }

  for (const r of rows) {
    const key = toISODate(r.date);
    dayMap.set(key, (dayMap.get(key) ?? 0) + r.amount);
  }

  return [...dayMap.entries()].map(([date, amount]) => ({
    label: new Date(date).getDate().toString(),
    amount,
    date,
  }));
};

const buildWeeklyTrend = (rows: RawExpenseRow[]): TrendPoint[] => {
  const weekMap = new Map<number, number>();
  for (const r of rows) {
    const week = Math.ceil(r.date.getDate() / 7);
    weekMap.set(week, (weekMap.get(week) ?? 0) + r.amount);
  }

  return [...weekMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([week, amount]) => ({ label: `Wk ${week}`, amount }));
};

const buildMonthlyTrend = (rows: RawExpenseRow[]): TrendPoint[] => {
  const monthMap = new Map<string, number>();
  for (const r of rows) {
    const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + r.amount);
  }

  return [...monthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthStr, amount]) => ({
      label: new Date(monthStr + '-01').toLocaleDateString('en-IN', { month: 'short' }),
      amount,
      date: monthStr,
    }));
};

const buildRecentTransactions = (rows: RawExpenseRow[], limit = 5): RecentTransaction[] =>
  [...rows]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      title: r.title,
      amount: r.amount,
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon,
      categoryColor: r.categoryColor,
      date: r.date.toISOString(),
    }));

const buildReportData = (
  rows: RawExpenseRow[],
  period: ReportPeriod,
  startDate: Date,
  endDate: Date
): ReportData => {
  const summary = buildSummary(rows);
  const categoryBreakdown = buildCategoryBreakdown(rows);
  const dailyTrend = buildDailyTrend(rows, startDate, endDate);
  const weeklyTrend = buildWeeklyTrend(rows);
  const monthlyTrend = buildMonthlyTrend(rows);
  const recentTransactions = buildRecentTransactions(rows);
  const topCategories = categoryBreakdown.slice(0, 5);

  return {
    summary,
    categoryBreakdown,
    topCategories,
    dailyTrend,
    weeklyTrend,
    monthlyTrend,
    recentTransactions,
    period,
  };
};

// ─── Period builders ──────────────────────────────────────────────────────────

const getPresetPeriod = (preset: DateRangePreset): { startDate: Date; endDate: Date; label: string } => {
  const now = new Date();

  switch (preset) {
    case 'today':
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
        label: 'Today',
      };
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { startDate: startOfDay(y), endDate: endOfDay(y), label: 'Yesterday' };
    }
    case 'last7days': {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { startDate: startOfDay(d), endDate: endOfDay(now), label: 'Last 7 Days' };
    }
    case 'last30days': {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { startDate: startOfDay(d), endDate: endOfDay(now), label: 'Last 30 Days' };
    }
    case 'thisMonth':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
        label: now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      };
    case 'lastMonth': {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        startDate: new Date(lm.getFullYear(), lm.getMonth(), 1, 0, 0, 0, 0),
        endDate: new Date(lm.getFullYear(), lm.getMonth() + 1, 0, 23, 59, 59, 999),
        label: lm.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      };
    }
    case 'thisYear':
      return {
        startDate: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
        endDate: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
        label: String(now.getFullYear()),
      };
    default:
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
        label: 'Custom',
      };
  }
};

// ─── ReportService ─────────────────────────────────────────────────────────────

/**
 * ReportService is the single source of truth for all analytics calculations.
 * It executes repository-level queries in parallel and returns strongly typed ReportData.
 * Contains no UI logic.
 */
export class ReportService {
  private cache = new Map<string, any>();

  constructor() {
    eventEmitter.on(RepoEvents.ExpenseCreated, () => this.clearCache());
    eventEmitter.on(RepoEvents.ExpenseUpdated, () => this.clearCache());
    eventEmitter.on(RepoEvents.ExpenseDeleted, () => this.clearCache());
    eventEmitter.on(RepoEvents.ExpenseRestored, () => this.clearCache());
    eventEmitter.on(RepoEvents.CategoryCreated, () => this.clearCache());
    eventEmitter.on(RepoEvents.CategoryDeleted, () => this.clearCache());
    eventEmitter.on(RepoEvents.CategoryRestored, () => this.clearCache());
    eventEmitter.on(RepoEvents.BudgetSet, () => this.clearCache());
    eventEmitter.on(RepoEvents.BudgetDeleted, () => this.clearCache());
  }

  public clearCache(): void {
    logger.debug('ReportService: Clearing cached aggregates.');
    this.cache.clear();
  }

  public getCachedMonthlyReport(monthStr: string): MonthlyReport | null {
    const cacheKey = `monthly-${monthStr}`;
    return this.cache.get(cacheKey) || null;
  }

  /**
   * Generate a full monthly report for the given monthStr ("YYYY-MM").
   */
  async getMonthlyReport(monthStr: string): Promise<MonthlyReport> {
    const cacheKey = `monthly-${monthStr}`;
    if (this.cache.has(cacheKey)) {
      logger.debug(`ReportService: Resolving monthly report for ${monthStr} from cache.`);
      return this.cache.get(cacheKey);
    }

    const [year, month] = monthStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const label = startDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const period: ReportPeriod = {
      preset: 'thisMonth',
      startDate: toISODate(startDate),
      endDate: toISODate(endDate),
      label,
    };

    const rows = await fetchExpensesWithCategories(startDate, endDate);
    const result = { ...buildReportData(rows, period, startDate, endDate), monthStr };
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Generate a yearly report with month-by-month breakdown.
   */
  async getYearlyReport(year: number): Promise<YearlyReport> {
    const cacheKey = `yearly-${year}`;
    if (this.cache.has(cacheKey)) {
      logger.debug(`ReportService: Resolving yearly report for ${year} from cache.`);
      return this.cache.get(cacheKey);
    }

    const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const period: ReportPeriod = {
      preset: 'thisYear',
      startDate: toISODate(startDate),
      endDate: toISODate(endDate),
      label: String(year),
    };

    const rows = await fetchExpensesWithCategories(startDate, endDate);
    const baseData = buildReportData(rows, period, startDate, endDate);

    // Build monthly breakdown in O(N)
    const monthMap = new Map<string, { totalExpense: number; count: number }>();
    for (const r of rows) {
      const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthMap.get(key);
      if (existing) {
        existing.totalExpense += r.amount;
        existing.count += 1;
      } else {
        monthMap.set(key, { totalExpense: r.amount, count: 1 });
      }
    }

    const monthlyBreakdown: MonthlyBreakdownItem[] = [...monthMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([ms, m]) => ({
        monthStr: ms,
        totalExpense: m.totalExpense,
        totalIncome: 0,
        count: m.count,
      }));

    const result = { ...baseData, year, monthlyBreakdown };
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Generate a custom date range report.
   */
  async getCustomReport(
    startDate: Date,
    endDate: Date
  ): Promise<ReportData> {
    const cacheKey = `custom-${startDate.getTime()}-${endDate.getTime()}`;
    if (this.cache.has(cacheKey)) {
      logger.debug('ReportService: Resolving custom report from cache.');
      return this.cache.get(cacheKey);
    }

    const period: ReportPeriod = {
      preset: 'custom',
      startDate: toISODate(startDate),
      endDate: toISODate(endDate),
      label: `${toISODate(startDate)} – ${toISODate(endDate)}`,
    };

    const rows = await fetchExpensesWithCategories(startDate, endDate);
    const result = buildReportData(rows, period, startDate, endDate);
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Generate a report for a named date range preset.
   */
  async getPresetReport(preset: DateRangePreset): Promise<ReportData> {
    const cacheKey = `preset-${preset}`;
    if (this.cache.has(cacheKey)) {
      logger.debug(`ReportService: Resolving preset report for ${preset} from cache.`);
      return this.cache.get(cacheKey);
    }

    const { startDate, endDate, label } = getPresetPeriod(preset);
    const period: ReportPeriod = {
      preset,
      startDate: toISODate(startDate),
      endDate: toISODate(endDate),
      label,
    };

    const rows = await fetchExpensesWithCategories(startDate, endDate);
    const result = buildReportData(rows, period, startDate, endDate);
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Compare two months side-by-side.
   */
  async compareMonths(
    currentMonthStr: string,
    previousMonthStr: string
  ): Promise<{ current: MonthlyReport; previous: MonthlyReport; difference: number; percentageChange: number; isIncrease: boolean }> {
    const [current, previous] = await Promise.all([
      this.getMonthlyReport(currentMonthStr),
      this.getMonthlyReport(previousMonthStr),
    ]);

    const difference = current.summary.totalExpense - previous.summary.totalExpense;
    const isIncrease = difference > 0;
    const percentageChange =
      previous.summary.totalExpense > 0
        ? Math.round(Math.abs((difference / previous.summary.totalExpense) * 100))
        : 0;

    return { current, previous, difference, percentageChange, isIncrease };
  }
}
