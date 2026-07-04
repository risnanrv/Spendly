import type { IExpenseRepository, ICategoryRepository, IBudgetRepository } from '@/database/repositories/interfaces';
import type { Expense } from '@/models/domain';
import { logger } from '@/utils/logger';

export interface TopCategoryData {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  amount: number; // Integer cents
  percentage: number; // 0-100
  progress: number; // 0-1
}

export interface DashboardData {
  monthStr: string;
  totalSpent: number; // Integer cents
  expenseCount: number;
  averageDailySpend: number; // Integer cents
  remainingDays: number;
  highestExpense: Expense | null;
  largestCategory: {
    name: string;
    amount: number;
  } | null;
  budgetPreview: {
    hasBudget: boolean;
    budgetAmount: number; // Integer cents
    spent: number; // Integer cents
    remaining: number; // Integer cents
    progress: number; // 0-1
    status: 'safe' | 'approaching' | 'exceeded' | 'none';
  };
  recentExpenses: Expense[];
  topCategories: TopCategoryData[];
}

/**
 * DashboardService aggregates data from multiple repositories,
 * performing all mathematical sums, daily averages, and progress calculations.
 */
export class DashboardService {
  constructor(
    private expenseRepo: IExpenseRepository,
    private categoryRepo: ICategoryRepository,
    private budgetRepo: IBudgetRepository
  ) {}

  /**
   * Fetches and compiles all metrics required for the dashboard in a single batch.
   */
  public async getDashboardData(monthStr: string): Promise<DashboardData> {
    const sTime = Date.now();
    logger.debug(`DashboardService: Compiling dashboard for month ${monthStr}`);

    // Resolve ReportService dynamically to avoid circular import dependency
    const { container, DI_TOKENS } = require('@/di/ServiceContainer');
    const reportService = container.resolve(DI_TOKENS.ReportService);
    const cachedReport = reportService.getCachedMonthlyReport(monthStr);

    let totalSpent = 0;
    let expenseCount = 0;
    let averageDailySpend = 0;
    let remainingDays = 0;
    let highestExpense: Expense | null = null;
    let largestCategory: { name: string; amount: number } | null = null;
    let topCategories: TopCategoryData[] = [];
    let budget: any = null;
    let recentExpenses: Expense[] = [];

    // Divisor and days calculations
    const today = new Date();
    const [year, month] = monthStr.split('-').map(Number);
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;

    let divisor = totalDaysInMonth;
    if (isCurrentMonth) {
      divisor = today.getDate();
      remainingDays = Math.max(0, totalDaysInMonth - divisor);
    } else {
      const isPastMonth = new Date(year, month - 1, 1) < new Date(today.getFullYear(), today.getMonth(), 1);
      divisor = totalDaysInMonth;
      remainingDays = isPastMonth ? 0 : totalDaysInMonth;
    }

    if (cachedReport) {
      logger.debug('DashboardService: Reusing cached report calculations.');
      totalSpent = cachedReport.summary.totalExpense;
      expenseCount = cachedReport.summary.transactionCount;
      averageDailySpend = cachedReport.summary.averageDailySpending;

      if (cachedReport.categoryBreakdown.length > 0) {
        largestCategory = {
          name: cachedReport.categoryBreakdown[0].name,
          amount: cachedReport.categoryBreakdown[0].amount,
        };
        topCategories = cachedReport.categoryBreakdown.slice(0, 5).map((item: any) => ({
          categoryId: item.categoryId,
          name: item.name,
          color: item.color,
          icon: item.icon,
          amount: item.amount,
          percentage: item.percentage,
          progress: totalSpent > 0 ? item.amount / totalSpent : 0,
        }));
      }

      const [fetchedBudget, fetchedRecent, monthlyExpenses] = await Promise.all([
        this.budgetRepo.getCurrentBudget(monthStr),
        this.expenseRepo.getExpenses({ limit: 5 }),
        this.expenseRepo.getExpensesByMonth(monthStr),
      ]);
      budget = fetchedBudget;
      recentExpenses = fetchedRecent;

      if (monthlyExpenses.length > 0) {
        highestExpense = monthlyExpenses.reduce((prev, current) => 
          current.amount > prev.amount ? current : prev
        , monthlyExpenses[0]);
      }
    } else {
      // 1. Batch Queries in parallel (avoids serial await waterfalls)
      const [categories, monthlyExpenses, fetchedBudget, fetchedRecent] = await Promise.all([
        this.categoryRepo.getCategories(),
        this.expenseRepo.getExpensesByMonth(monthStr),
        this.budgetRepo.getCurrentBudget(monthStr),
        this.expenseRepo.getExpenses({ limit: 5 }),
      ]);

      budget = fetchedBudget;
      recentExpenses = fetchedRecent;
      totalSpent = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);
      expenseCount = monthlyExpenses.length;
      averageDailySpend = divisor > 0 ? Math.round(totalSpent / divisor) : 0;

      // HIGHEST EXPENSE
      if (monthlyExpenses.length > 0) {
        highestExpense = monthlyExpenses.reduce((prev, current) => 
          current.amount > prev.amount ? current : prev
        , monthlyExpenses[0]);
      }

      // LARGEST CATEGORY & TOP CATEGORIES GROUPINGS
      const categoryTotalsMap = new Map<string, number>();
      monthlyExpenses.forEach((exp) => {
        const current = categoryTotalsMap.get(exp.categoryId) || 0;
        categoryTotalsMap.set(exp.categoryId, current + exp.amount);
      });

      const categoryList: Array<{ id: string; amount: number }> = [];
      categoryTotalsMap.forEach((amount, id) => {
        categoryList.push({ id, amount });
      });

      categoryList.sort((a, b) => b.amount - a.amount);

      if (categoryList.length > 0) {
        const topCatId = categoryList[0].id;
        const catObj = categories.find((c) => c.id === topCatId);
        if (catObj) {
          largestCategory = {
            name: catObj.name,
            amount: categoryList[0].amount,
          };
        }
      }

      topCategories = categoryList.slice(0, 5).map((item) => {
        const catObj = categories.find((c) => c.id === item.id);
        const percentage = totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0;
        const progress = totalSpent > 0 ? item.amount / totalSpent : 0;

        return {
          categoryId: item.id,
          name: catObj?.name || 'Unknown',
          color: catObj?.color || '#818CF8',
          icon: catObj?.icon || 'HelpCircle',
          amount: item.amount,
          percentage,
          progress,
        };
      });
    }

    // BUDGET PREVIEW
    let hasBudget = false;
    let budgetAmount = 0;
    let remaining = 0;
    let progress = 0;
    let status: 'safe' | 'approaching' | 'exceeded' | 'none' = 'none';

    if (budget) {
      hasBudget = true;
      budgetAmount = budget.amount;
      remaining = Math.max(0, budgetAmount - totalSpent);
      progress = budgetAmount > 0 ? Math.min(1, totalSpent / budgetAmount) : 0;

      const spentRatio = budgetAmount > 0 ? totalSpent / budgetAmount : 0;
      if (spentRatio >= 1.0) {
        status = 'exceeded';
      } else if (spentRatio >= 0.8) {
        status = 'approaching';
      } else {
        status = 'safe';
      }
    }

    if (__DEV__) {
      logger.info(`[PERF LOG] Dashboard Service batch loaded in ${Date.now() - sTime}ms.`);
    }

    return {
      monthStr,
      totalSpent,
      expenseCount,
      averageDailySpend,
      remainingDays,
      highestExpense,
      largestCategory,
      budgetPreview: {
        hasBudget,
        budgetAmount,
        spent: totalSpent,
        remaining,
        progress,
        status,
      },
      recentExpenses,
      topCategories,
    };
  }
}
