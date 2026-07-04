import type { IBudgetRepository, IExpenseRepository } from '@/database/repositories/interfaces';
import type { MonthlyBudget } from '@/models/domain';
import { logger } from '@/utils/logger';

export interface BudgetDetails {
  month: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'approaching' | 'exceeded' | 'none';
  isExceeded: boolean;
  isNearLimit: boolean;
}

const validateMonthFormat = (month: string): boolean => {
  const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return monthRegex.test(month);
};

export class BudgetService {
  constructor(
    private budgetRepo: IBudgetRepository,
    private expenseRepo: IExpenseRepository
  ) {}

  public async getBudgetDetails(userId: string, monthStr: string): Promise<BudgetDetails> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    if (!validateMonthFormat(monthStr)) {
      throw new Error('Invalid month format. Expected YYYY-MM.');
    }

    logger.debug(`BudgetService: Compiling budget details for ${monthStr} for user ${userId}`);

    const [budget, expenses] = await Promise.all([
      this.budgetRepo.getCurrentBudget(userId, monthStr),
      this.expenseRepo.getExpensesByMonth(userId, monthStr),
    ]);

    const spent = this.calculateSpent(expenses);

    if (!budget) {
      return {
        month: monthStr,
        budget: 0,
        spent,
        remaining: 0,
        percentage: 0,
        status: 'none',
        isExceeded: false,
        isNearLimit: false,
      };
    }

    const budgetAmount = budget.amount;
    const remaining = this.calculateRemaining(budgetAmount, spent);
    const percentage = this.calculatePercentage(budgetAmount, spent);
    const status = this.calculateBudgetStatus(budgetAmount, spent);

    return {
      month: monthStr,
      budget: budgetAmount,
      spent,
      remaining,
      percentage,
      status,
      isExceeded: status === 'exceeded',
      isNearLimit: status === 'approaching',
    };
  }

  public async saveBudget(userId: string, monthStr: string, amount: number): Promise<MonthlyBudget> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    if (!validateMonthFormat(monthStr)) {
      throw new Error('Invalid month format. Expected YYYY-MM.');
    }
    if (amount <= 0) {
      throw new Error('Budget amount must be greater than zero.');
    }
    if (isNaN(amount) || !Number.isInteger(amount)) {
      throw new Error('Budget amount must be a valid integer representing cents.');
    }

    logger.debug(`BudgetService: Saving budget for ${monthStr} with amount ${amount} for user ${userId}`);
    return this.budgetRepo.setBudget(userId, monthStr, amount);
  }

  public async deleteBudget(userId: string, monthStr: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    if (!validateMonthFormat(monthStr)) {
      throw new Error('Invalid month format. Expected YYYY-MM.');
    }

    logger.debug(`BudgetService: Deleting budget for ${monthStr} for user ${userId}`);
    return this.budgetRepo.deleteBudget(userId, monthStr);
  }

  public calculateSpent(expenses: Array<{ amount: number }>): number {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
  }

  public calculateRemaining(budgetAmount: number, spentAmount: number): number {
    return Math.max(0, budgetAmount - spentAmount);
  }

  public calculatePercentage(budgetAmount: number, spentAmount: number): number {
    if (budgetAmount <= 0) return 0;
    return Math.round((spentAmount / budgetAmount) * 100);
  }

  public calculateBudgetStatus(
    budgetAmount: number,
    spentAmount: number
  ): 'safe' | 'approaching' | 'exceeded' | 'none' {
    if (budgetAmount <= 0) return 'none';
    const ratio = spentAmount / budgetAmount;
    if (ratio >= 1.0) return 'exceeded';
    if (ratio >= 0.8) return 'approaching';
    return 'safe';
  }
}
