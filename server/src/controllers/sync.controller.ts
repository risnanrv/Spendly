import type { Context } from 'hono';
import { prisma } from '../config/database.js';
import { auth } from '../config/auth.js';
import { logger } from '../utils/logger.js';

/**
 * handlePush receives outbox items, resolves version/LWW updates, and inserts/updates records.
 */
export const handlePush = async (c: Context) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session || !session.user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const userId = session.user.id;

  try {
    const { items } = await c.req.json();
    logger.info(`Sync: Processing push request for user ${userId} containing ${items?.length || 0} items.`);

    if (!items || !Array.isArray(items)) {
      return c.json({ error: 'Invalid payload structure' }, 400);
    }

    const results = [];

    for (const item of items) {
      const table = item.table;
      const payload = item.payload;
      const recordId = item.recordId;

      try {
        if (table === 'expenses') {
          const existing = await prisma.expense.findFirst({
            where: { id: recordId, userId },
          });

          const data = {
            amount: Math.round(Number(payload.amount)),
            categoryId: payload.categoryId,
            title: payload.title,
            note: payload.note || null,
            date: new Date(payload.date),
            createdAt: new Date(payload.createdAt),
            updatedAt: new Date(payload.updatedAt),
            deletedAt: payload.deletedAt ? new Date(payload.deletedAt) : null,
          };

          if (existing) {
            // Last-Write-Wins comparison using timestamp
            if (new Date(item.updatedAt).getTime() >= existing.updatedAt.getTime()) {
              await prisma.expense.update({
                where: { id: existing.id },
                data,
              });
              results.push({ id: item.id, status: 'synced' });
            } else {
              results.push({ id: item.id, status: 'conflict' });
            }
          } else {
            await prisma.expense.create({
              data: {
                id: recordId,
                userId,
                ...data,
              },
            });
            results.push({ id: item.id, status: 'synced' });
          }
        } else if (table === 'categories') {
          const existing = await prisma.category.findFirst({
            where: { id: recordId, OR: [{ userId }, { userId: null }] },
          });

          const data = {
            name: payload.name,
            icon: payload.icon,
            color: payload.color,
            type: payload.type,
            isSystem: Boolean(payload.isSystem),
            createdAt: new Date(payload.createdAt),
            updatedAt: new Date(payload.updatedAt),
            deletedAt: payload.deletedAt ? new Date(payload.deletedAt) : null,
          };

          if (existing) {
            if (existing.isSystem) {
              results.push({ id: item.id, status: 'failed', error: 'System categories are read-only' });
              continue;
            }

            if (new Date(item.updatedAt).getTime() >= existing.updatedAt.getTime()) {
              await prisma.category.update({
                where: { id: existing.id },
                data,
              });
              results.push({ id: item.id, status: 'synced' });
            } else {
              results.push({ id: item.id, status: 'conflict' });
            }
          } else {
            await prisma.category.create({
              data: {
                id: recordId,
                userId,
                ...data,
              },
            });
            results.push({ id: item.id, status: 'synced' });
          }
        } else if (table === 'budgets') {
          const existing = await prisma.budget.findFirst({
            where: { id: recordId, userId },
          });

          const data = {
            month: payload.month,
            amount: Math.round(Number(payload.amount)),
            createdAt: new Date(payload.createdAt),
            updatedAt: new Date(payload.updatedAt),
            deletedAt: payload.deletedAt ? new Date(payload.deletedAt) : null,
          };

          if (existing) {
            if (new Date(item.updatedAt).getTime() >= existing.updatedAt.getTime()) {
              await prisma.budget.update({
                where: { id: existing.id },
                data,
              });
              results.push({ id: item.id, status: 'synced' });
            } else {
              results.push({ id: item.id, status: 'conflict' });
            }
          } else {
            // Keep unique index safe: check if budget for user month already exists
            const dup = await prisma.budget.findUnique({
              where: { userId_month: { userId, month: payload.month } },
            });
            if (dup) {
              if (new Date(item.updatedAt).getTime() >= dup.updatedAt.getTime()) {
                await prisma.budget.update({
                  where: { id: dup.id },
                  data,
                });
                results.push({ id: item.id, status: 'synced' });
              } else {
                results.push({ id: item.id, status: 'conflict' });
              }
            } else {
              await prisma.budget.create({
                data: {
                  id: recordId,
                  userId,
                  ...data,
                },
              });
              results.push({ id: item.id, status: 'synced' });
            }
          }
        } else if (table === 'settings') {
          const existing = await prisma.setting.findUnique({
            where: { userId_key: { userId, key: recordId } },
          });

          const data = {
            value: payload.value,
            createdAt: new Date(payload.createdAt),
            updatedAt: new Date(payload.updatedAt),
          };

          if (existing) {
            if (new Date(item.updatedAt).getTime() >= existing.updatedAt.getTime()) {
              await prisma.setting.update({
                where: { userId_key: { userId, key: recordId } },
                data,
              });
              results.push({ id: item.id, status: 'synced' });
            } else {
              results.push({ id: item.id, status: 'conflict' });
            }
          } else {
            await prisma.setting.create({
              data: {
                key: recordId,
                userId,
                ...data,
              },
            });
            results.push({ id: item.id, status: 'synced' });
          }
        } else {
          results.push({ id: item.id, status: 'failed', error: `Unsupported table: ${table}` });
        }
      } catch (err: any) {
        logger.error(`Error processing push item ${item.id}:`, err);
        results.push({ id: item.id, status: 'failed', error: err.message || 'Database write error' });
      }
    }

    return c.json({ results });
  } catch (error: any) {
    logger.error('Critical push failure:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
};

/**
 * handlePull queries server updates modified after lastSyncAt timestamp.
 */
export const handlePull = async (c: Context) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session || !session.user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const userId = session.user.id;

  try {
    const { lastSyncAt } = await c.req.json();
    logger.info(`Sync: Processing pull request for user ${userId} since ${lastSyncAt || 'Initial Sync'}.`);

    const syncDate = lastSyncAt ? new Date(lastSyncAt) : null;
    const syncTimestamp = new Date().toISOString();

    const whereClause = syncDate ? { updatedAt: { gt: syncDate } } : {};

    // 1. Fetch Expenses
    const serverExpenses = await prisma.expense.findMany({
      where: {
        userId,
        ...whereClause,
      },
    });

    // 2. Fetch Categories (both user-owned and default system categories)
    const serverCategories = await prisma.category.findMany({
      where: {
        OR: [
          { userId, ...whereClause },
          { userId: null, ...whereClause },
        ],
      },
    });

    // 3. Fetch Budgets
    const serverBudgets = await prisma.budget.findMany({
      where: {
        userId,
        ...whereClause,
      },
    });

    // 4. Fetch Settings
    const serverSettings = await prisma.setting.findMany({
      where: {
        userId,
        ...whereClause,
      },
    });

    const changes: any[] = [];

    // Compile into standard pull change payload entries
    serverExpenses.forEach((exp) => {
      changes.push({
        id: exp.id,
        table: 'expenses',
        action: exp.deletedAt ? 'delete' : 'update',
        recordId: exp.id,
        payload: {
          id: exp.id,
          amount: exp.amount,
          categoryId: exp.categoryId,
          title: exp.title,
          note: exp.note,
          date: exp.date.toISOString(),
          createdAt: exp.createdAt.toISOString(),
          updatedAt: exp.updatedAt.toISOString(),
          deletedAt: exp.deletedAt ? exp.deletedAt.toISOString() : null,
        },
        operationVersion: 1,
        createdAt: exp.createdAt.toISOString(),
        updatedAt: exp.updatedAt.toISOString(),
      });
    });

    serverCategories.forEach((cat) => {
      changes.push({
        id: cat.id,
        table: 'categories',
        action: cat.deletedAt ? 'delete' : 'update',
        recordId: cat.id,
        payload: {
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: cat.type,
          isSystem: cat.isSystem,
          createdAt: cat.createdAt.toISOString(),
          updatedAt: cat.updatedAt.toISOString(),
          deletedAt: cat.deletedAt ? cat.deletedAt.toISOString() : null,
        },
        operationVersion: 1,
        createdAt: cat.createdAt.toISOString(),
        updatedAt: cat.updatedAt.toISOString(),
      });
    });

    serverBudgets.forEach((b) => {
      changes.push({
        id: b.id,
        table: 'budgets',
        action: b.deletedAt ? 'delete' : 'update',
        recordId: b.id,
        payload: {
          id: b.id,
          month: b.month,
          amount: b.amount,
          createdAt: b.createdAt.toISOString(),
          updatedAt: b.updatedAt.toISOString(),
          deletedAt: b.deletedAt ? b.deletedAt.toISOString() : null,
        },
        operationVersion: 1,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      });
    });

    serverSettings.forEach((s) => {
      changes.push({
        id: s.key,
        table: 'settings',
        action: 'update',
        recordId: s.key,
        payload: {
          key: s.key,
          value: s.value,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        },
        operationVersion: 1,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      });
    });

    return c.json({
      changes,
      syncTimestamp,
    });
  } catch (error: any) {
    logger.error('Critical pull failure:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
};
