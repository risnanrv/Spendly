import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// ── 1. _meta Table (App Metadata) ──────────────────────────────────────────
export const meta = sqliteTable('_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
});

// ── 2. Categories Table ────────────────────────────────────────────────────
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(), // UUID generated on client
  name: text('name').notNull(),
  icon: text('icon').notNull(), // Icon name mapping to Lucide
  color: text('color').notNull(), // DSS color token or Hex
  type: text('type').notNull(), // "expense" | "income"
  isSystem: integer('is_system', { mode: 'boolean' }).default(false).notNull(), // System seeded flag
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }), // Nullable soft delete
});

// ── 3. Expenses Table ──────────────────────────────────────────────────────
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(), // UUID generated on client
  amount: integer('amount').notNull(), // Currency stored as INTEGER in cents/paisa
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'restrict' }),
  title: text('title').notNull(),
  note: text('note'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }), // Nullable soft delete
}, (table) => ({
  // Optimization Indexes
  dateIdx: index('expenses_date_idx').on(table.date),
  categoryIdIdx: index('expenses_category_id_idx').on(table.categoryId),
  deletedAtIdx: index('expenses_deleted_at_idx').on(table.deletedAt),
}));

// ── 4. MonthlyBudgets Table (Spendly supports ONE monthly budget) ──────────
export const monthlyBudgets = sqliteTable('monthly_budgets', {
  id: text('id').primaryKey(), // UUID generated on client
  month: text('month').notNull(), // Month string in format "YYYY-MM"
  amount: integer('amount').notNull(), // Currency stored as INTEGER in cents/paisa
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }), // Soft delete
}, (table) => ({
  // Optimization Index
  monthIdx: index('monthly_budgets_month_idx').on(table.month),
}));

// ── 5. Settings Table ──────────────────────────────────────────────────────
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ── 6. SyncQueue Table (Outgoing changes outbox) ───────────────────────────
export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(), // UUID generated on client
  table: text('table').notNull(), // e.g. "expenses", "categories"
  action: text('action').notNull(), // "insert" | "update" | "delete"
  recordId: text('record_id').notNull(),
  payload: text('payload'), // JSON serialized string of columns
  status: text('status').notNull(), // "pending" | "processing" | "synced" | "failed" | "conflict"
  attempts: integer('attempts').default(0).notNull(),
  retryCount: integer('retry_count').default(0).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
  lastAttempt: integer('last_attempt', { mode: 'timestamp' }),
  lastError: text('last_error'),
  priority: text('priority').default('normal').notNull(), // "high" | "normal" | "low"
  operationVersion: integer('operation_version').default(1).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  // Optimization Index
  statusIdx: index('sync_queue_status_idx').on(table.status),
}));

// ── 7. UserPreferences Table ───────────────────────────────────────────────
export const userPreferences = sqliteTable('user_preferences', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
