import { db } from '../../lib/db';
import { settings } from '../schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/utils/logger';
import type { ISettingsRepository } from './interfaces';

export class SettingsRepository implements ISettingsRepository {
  public async get(userId: string, key: string): Promise<string | null> {
    const results = await db
      .select()
      .from(settings)
      .where(
        and(
          eq(settings.userId, userId),
          eq(settings.key, key)
        )
      )
      .limit(1);
    
    return results.length > 0 ? results[0].value : null;
  }

  public async set(userId: string, key: string, value: string, tx?: any): Promise<void> {
    const runInTx = async (executor: any) => {
      const now = new Date();
      logger.debug(`SettingsRepository: Setting value for key: ${key} for user ${userId}`);

      const existing = await executor
        .select()
        .from(settings)
        .where(
          and(
            eq(settings.userId, userId),
            eq(settings.key, key)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await executor
          .update(settings)
          .set({ value, updatedAt: now })
          .where(
            and(
              eq(settings.userId, userId),
              eq(settings.key, key)
            )
          );
      } else {
        await executor.insert(settings).values({
          userId,
          key,
          value,
          createdAt: now,
          updatedAt: now,
        });
      }
    };

    tx ? await runInTx(tx) : await db.transaction(async (innerTx) => runInTx(innerTx));
  }
}
