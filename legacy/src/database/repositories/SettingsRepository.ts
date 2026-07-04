import { db } from '../client';
import { settings } from '../schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/utils/logger';
import type { ISettingsRepository } from './interfaces';

/**
 * SettingsRepository handles persistent key-value configuration values.
 */
export class SettingsRepository implements ISettingsRepository {
  public async get(key: string): Promise<string | null> {
    const results = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);
    
    return results.length > 0 ? results[0].value : null;
  }

  public async set(key: string, value: string, tx?: any): Promise<void> {
    const runInTx = async (executor: any) => {
      const now = new Date();
      logger.debug(`SettingsRepository: Setting value for key: ${key}`);

      const existing = await executor
        .select()
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);

      if (existing.length > 0) {
        await executor
          .update(settings)
          .set({ value, updatedAt: now })
          .where(eq(settings.key, key));

        // Enqueue sync change
        try {
          const syncRepo = require('@/di/ServiceContainer').container.resolve('ISyncRepository');
          await syncRepo.enqueueChange({
            table: 'settings',
            action: 'update',
            recordId: key,
            payload: {
              key,
              value,
              createdAt: existing[0].createdAt.toISOString(),
              updatedAt: now.toISOString(),
            },
            priority: 'normal',
          }, executor);
        } catch (err) {
          logger.error('Failed to enqueue sync change for update setting:', err);
        }
      } else {
        await executor.insert(settings).values({
          key,
          value,
          createdAt: now,
          updatedAt: now,
        });

        // Enqueue sync change
        try {
          const syncRepo = require('@/di/ServiceContainer').container.resolve('ISyncRepository');
          await syncRepo.enqueueChange({
            table: 'settings',
            action: 'insert',
            recordId: key,
            payload: {
              key,
              value,
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
            },
            priority: 'normal',
          }, executor);
        } catch (err) {
          logger.error('Failed to enqueue sync change for create setting:', err);
        }
      }
    };

    tx ? await runInTx(tx) : await db.transaction(async (innerTx) => runInTx(innerTx));

    // Notify sync service asynchronously
    try {
      const syncService = require('@/di/ServiceContainer').container.resolve('SyncService');
      syncService.notify();
    } catch {}
  }
}
