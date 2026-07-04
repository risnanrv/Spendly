import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';

// ── 1. Better Auth Tables ──────────────────────────────────────────────────

export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const sessions = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export const accounts = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const verifications = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// ── 2. Meta Table ──────────────────────────────────────────────────────────
export const meta = sqliteTable('_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
});

// ── 3. Categories Table ────────────────────────────────────────────────────
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').notNull(), // Icon name mapping to Lucide
  color: text('color').notNull(), // Hex or token
  type: text('type').notNull(), // "expense" | "income"
  isSystem: integer('is_system', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, (table) => ({
  userIdIdx: index('categories_user_id_idx').on(table.userId),
}));

// ── 4. Expenses Table ──────────────────────────────────────────────────────
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(), // In cents
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'restrict' }),
  title: text('title').notNull(),
  note: text('note'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, (table) => ({
  dateIdx: index('expenses_date_idx').on(table.date),
  categoryIdIdx: index('expenses_category_id_idx').on(table.categoryId),
  deletedAtIdx: index('expenses_deleted_at_idx').on(table.deletedAt),
  userIdIdx: index('expenses_user_id_idx').on(table.userId),
}));

// ── 5. MonthlyBudgets Table ────────────────────────────────────────────────
export const monthlyBudgets = sqliteTable('monthly_budgets', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  month: text('month').notNull(), // Format: "YYYY-MM"
  amount: integer('amount').notNull(), // In cents
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, (table) => ({
  monthIdx: index('monthly_budgets_month_idx').on(table.month),
  userIdIdx: index('monthly_budgets_user_id_idx').on(table.userId),
}));

// ── 6. Settings Table ──────────────────────────────────────────────────────
export const settings = sqliteTable('settings', {
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.key] }),
}));

// ── 7. SyncQueue Table (Preserved for compatibility/extensions) ───────────
export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(),
  table: text('table').notNull(),
  action: text('action').notNull(),
  recordId: text('record_id').notNull(),
  payload: text('payload'),
  status: text('status').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  retryCount: integer('retry_count').default(0).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
  lastAttempt: integer('last_attempt', { mode: 'timestamp' }),
  lastError: text('last_error'),
  priority: text('priority').default('normal').notNull(),
  operationVersion: integer('operation_version').default(1).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  statusIdx: index('sync_queue_status_idx').on(table.status),
}));

// ── 8. UserPreferences Table ───────────────────────────────────────────────
export const userPreferences = sqliteTable('user_preferences', {
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.key] }),
}));
