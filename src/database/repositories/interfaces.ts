import type { Expense, Category, MonthlyBudget } from '@/models/domain';

export interface ExpenseInsert {
  amount: number; // Stored as integer cents inside database
  categoryId: string;
  title: string;
  note?: string | undefined;
  date: Date;
}

export interface ExpenseUpdate {
  amount?: number | undefined;
  categoryId?: string | undefined;
  title?: string | undefined;
  note?: string | undefined;
  date?: Date | undefined;
}

export interface CategoryInsert {
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
}

export interface CategoryUpdate {
  name?: string;
  icon?: string;
  color?: string;
}

export interface QueueEntryInsert {
  table: string;
  action: 'insert' | 'update' | 'delete';
  recordId: string;
  payload: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  operationVersion?: number;
}

export interface IExpenseRepository {
  createExpense(userId: string, data: ExpenseInsert, tx?: any): Promise<Expense>;
  updateExpense(userId: string, id: string, data: ExpenseUpdate, tx?: any): Promise<void>;
  deleteExpense(userId: string, id: string, tx?: any): Promise<void>;
  restoreExpense(userId: string, id: string, tx?: any): Promise<void>;
  getExpenseById(userId: string, id: string): Promise<Expense | null>;
  getExpensesByMonth(userId: string, monthStr: string): Promise<Expense[]>;
  searchExpenses(userId: string, query: string, options?: { limit?: number; offset?: number }): Promise<Expense[]>;
  getExpenses(userId: string, options?: {
    filter?: 'today' | 'week' | 'month' | 'all';
    search?: string;
    limit?: number;
    offset?: number;
    categoryId?: string;
  }): Promise<Expense[]>;
  getCategoryTotals(userId: string, monthStr: string): Promise<Array<{
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    categoryIcon: string;
    totalAmount: number;
  }>>;
}

export interface ICategoryRepository {
  getCategories(userId: string): Promise<Category[]>;
  getCategoryById(userId: string, id: string): Promise<Category | null>;
  createCategory(userId: string, data: CategoryInsert, tx?: any): Promise<Category>;
  updateCategory(userId: string, id: string, data: CategoryUpdate, tx?: any): Promise<void>;
  deleteCategory(userId: string, id: string, tx?: any): Promise<void>;
  restoreCategory(userId: string, id: string, tx?: any): Promise<void>;
  reassignExpenses(userId: string, sourceCategoryId: string, targetCategoryId: string, tx?: any): Promise<void>;
}

export interface IBudgetRepository {
  getCurrentBudget(userId: string, monthStr: string): Promise<MonthlyBudget | null>;
  setBudget(userId: string, monthStr: string, amount: number, tx?: any): Promise<MonthlyBudget>;
  deleteBudget(userId: string, monthStr: string, tx?: any): Promise<void>;
}

export interface ISettingsRepository {
  get(userId: string, key: string): Promise<string | null>;
  set(userId: string, key: string, value: string, tx?: any): Promise<void>;
}

export interface IPreferencesRepository {
  get(userId: string, key: string): Promise<string | null>;
  set(userId: string, key: string, value: string, tx?: any): Promise<void>;
}

export interface ISyncRepository {
  enqueueChange(data: QueueEntryInsert, tx?: any): Promise<any>;
  getPendingChanges(): Promise<any[]>;
  markAsProcessing(id: string, tx?: any): Promise<void>;
  markAsSynced(id: string, tx?: any): Promise<void>;
  markAsFailed(id: string, errorMsg: string, tx?: any): Promise<void>;
  markAsConflict(id: string, tx?: any): Promise<void>;
  cancel(id: string, tx?: any): Promise<void>;
  cleanup(tx?: any): Promise<void>;
  getPendingCount(): Promise<number>;
}
