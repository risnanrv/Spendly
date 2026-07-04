/**
 * Domain Category model representing classifications.
 */
export interface Category {
  id: string; // UUID
  name: string;
  icon: string; // Lucide icon identifier
  color: string; // Color identifier
  type: 'expense' | 'income';
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  expenseCount?: number;
  totalSpent?: number;
}

/**
 * Domain Expense model representing financial transactions.
 * All monetary amounts are stored as integers (cents/paisa).
 */
export interface Expense {
  id: string; // UUID
  amount: number; // Stored as integer (cents/paisa)
  categoryId: string;
  title: string;
  note: string | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Domain MonthlyBudget model representing monthly spending limits.
 * Budget amounts are stored as integers (cents/paisa).
 */
export interface MonthlyBudget {
  id: string; // UUID
  month: string; // "YYYY-MM"
  amount: number; // Stored as integer (cents/paisa)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Domain Settings model representing global configurations.
 */
export interface Settings {
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Domain UserPreference model representing user-specific selections.
 */
export interface UserPreference {
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}
