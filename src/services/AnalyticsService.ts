import { formatAmount } from '@/utils/currency';
import type { ReportData, AnalyticsInsight, CategoryBreakdown } from '@/models/report';

export interface BudgetContext {
  hasBudget: boolean;
  budgetAmount: number;     // cents
  spent: number;            // cents
  remaining: number;        // cents
  remainingDays: number;
  status: 'safe' | 'approaching' | 'exceeded';
}

export interface AnalyticsResult {
  insights: AnalyticsInsight[];
  topCategory: CategoryBreakdown | null;
  fastestGrowingCategory: CategoryBreakdown | null;
  weekendSpending: number;
  weekendPercentage: number;
}

const generateBudgetInsights = (
  budget: BudgetContext,
  insights: AnalyticsInsight[]
) => {
  if (!budget.hasBudget) return;

  const dailyAllowance = budget.remainingDays > 0
    ? Math.round(budget.remaining / budget.remainingDays)
    : 0;

  const utilizationPct = budget.budgetAmount > 0
    ? Math.round((budget.spent / budget.budgetAmount) * 100)
    : 0;

  if (budget.status === 'exceeded') {
    insights.push({
      id: 'budget-exceeded',
      type: 'warning',
      title: 'Budget Exceeded',
      message: `You've exceeded your monthly budget by ${formatAmount(Math.abs(budget.remaining))}.`,
      icon: 'AlertTriangle',
      value: formatAmount(Math.abs(budget.remaining)),
    });
  } else if (budget.status === 'approaching') {
    insights.push({
      id: 'budget-approaching',
      type: 'warning',
      title: 'Approaching Budget Limit',
      message: `You've used ${utilizationPct}% of your monthly budget. ${formatAmount(budget.remaining)} remaining.`,
      icon: 'TrendingUp',
      value: `${utilizationPct}%`,
    });
  } else {
    insights.push({
      id: 'budget-safe',
      type: 'success',
      title: 'Within Budget',
      message: `You're well within budget with ${formatAmount(budget.remaining)} remaining.`,
      icon: 'CheckCircle',
      value: formatAmount(budget.remaining),
    });
  }

  if (dailyAllowance > 0 && budget.remainingDays > 0) {
    insights.push({
      id: 'daily-allowance',
      type: 'info',
      title: 'Daily Allowance',
      message: `You can spend up to ${formatAmount(dailyAllowance)} per day for the remaining ${budget.remainingDays} days.`,
      icon: 'Calendar',
      value: formatAmount(dailyAllowance),
    });
  }
};

const generateSpendingInsights = (
  report: ReportData,
  prevReport: ReportData | null,
  insights: AnalyticsInsight[]
) => {
  const { summary, categoryBreakdown } = report;

  if (categoryBreakdown.length === 0) return;

  const top = categoryBreakdown[0];
  if (top && top.percentage > 0) {
    insights.push({
      id: 'top-category',
      type: 'info',
      title: 'Largest Spending Category',
      message: `${top.name} accounts for ${top.percentage}% of your spending this period.`,
      icon: top.icon,
      value: `${top.percentage}%`,
    });
  }

  if (summary.averageTransaction > 0) {
    insights.push({
      id: 'avg-transaction',
      type: 'neutral',
      title: 'Average Transaction',
      message: `Your average expense this period is ${formatAmount(summary.averageTransaction)}.`,
      icon: 'BarChart2',
      value: formatAmount(summary.averageTransaction),
    });
  }

  if (prevReport && prevReport.summary.totalExpense > 0) {
    const diff = summary.totalExpense - prevReport.summary.totalExpense;
    const pct = Math.round(Math.abs((diff / prevReport.summary.totalExpense) * 100));
    const isMore = diff > 0;

    insights.push({
      id: 'mom-comparison',
      type: isMore ? 'warning' : 'success',
      title: isMore ? 'Spending Increased' : 'Spending Decreased',
      message: isMore
        ? `You spent ${pct}% more than last month.`
        : `You spent ${pct}% less than last month. Great job!`,
      icon: isMore ? 'TrendingUp' : 'TrendingDown',
      value: `${pct}%`,
    });
  }
};

const generateWeekdayWeekendInsights = (
  weekendSpending: number,
  totalSpending: number,
  insights: AnalyticsInsight[]
) => {
  if (totalSpending === 0) return;

  const weekendPct = Math.round((weekendSpending / totalSpending) * 100);
  const weekdayPct = 100 - weekendPct;

  if (weekendPct >= 50) {
    insights.push({
      id: 'weekend-spending',
      type: 'info',
      title: 'Weekend Spender',
      message: `You tend to spend more on weekends — ${weekendPct}% of this period's spending happened on weekends.`,
      icon: 'Sun',
      value: `${weekendPct}% weekends`,
    });
  } else {
    insights.push({
      id: 'weekday-spending',
      type: 'neutral',
      title: 'Weekday Spender',
      message: `${weekdayPct}% of your spending happens on weekdays.`,
      icon: 'Briefcase',
      value: `${weekdayPct}% weekdays`,
    });
  }
};

export class AnalyticsService {
  generateInsights(
    report: ReportData,
    budget: BudgetContext,
    prevReport?: ReportData | null
  ): AnalyticsResult {
    const insights: AnalyticsInsight[] = [];

    generateBudgetInsights(budget, insights);
    generateSpendingInsights(report, prevReport ?? null, insights);

    let weekendSpending = 0;

    for (const point of report.dailyTrend) {
      if (point.date) {
        const date = new Date(point.date);
        const day = date.getDay(); // 0 = Sun, 6 = Sat
        if (day === 0 || day === 6) {
          weekendSpending += point.amount;
        }
      }
    }

    const totalSpending = report.summary.totalExpense;
    const weekendPercentage = totalSpending > 0
      ? Math.round((weekendSpending / totalSpending) * 100)
      : 0;

    generateWeekdayWeekendInsights(weekendSpending, totalSpending, insights);

    const topCategory = report.categoryBreakdown[0] ?? null;

    let fastestGrowingCategory: CategoryBreakdown | null = null;
    if (prevReport && prevReport.categoryBreakdown.length > 0) {
      const prevMap = new Map(prevReport.categoryBreakdown.map(c => [c.categoryId, c.amount]));
      let maxGrowth = 0;
      for (const cat of report.categoryBreakdown) {
        const prev = prevMap.get(cat.categoryId) ?? 0;
        if (prev > 0) {
          const growth = ((cat.amount - prev) / prev) * 100;
          if (growth > maxGrowth) {
            maxGrowth = growth;
            fastestGrowingCategory = cat;
          }
        }
      }

      if (fastestGrowingCategory) {
        insights.push({
          id: 'fastest-growing',
          type: 'warning',
          title: 'Fastest Growing Category',
          message: `Spending on ${fastestGrowingCategory.name} grew ${Math.round(maxGrowth)}% compared to last month.`,
          icon: fastestGrowingCategory.icon,
          value: `+${Math.round(maxGrowth)}%`,
        });
      }
    }

    return {
      insights: insights.slice(0, 6),
      topCategory,
      fastestGrowingCategory,
      weekendSpending,
      weekendPercentage,
    };
  }
}
