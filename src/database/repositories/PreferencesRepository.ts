import { db } from '../../lib/db';
import { userPreferences } from '../schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/utils/logger';
import type { IPreferencesRepository } from './interfaces';

export class PreferencesRepository implements IPreferencesRepository {
  public async get(userId: string, key: string): Promise<string | null> {
    const results = await db
      .select()
      .from(userPreferences)
      .where(
        and(
          eq(userPreferences.userId, userId),
          eq(userPreferences.key, key)
        )
      )
      .limit(1);

    return results.length > 0 ? results[0].value : null;
  }

  public async set(userId: string, key: string, value: string, tx?: any): Promise<void> {
    const executor = tx || db;
    const now = new Date();

    logger.debug(`PreferencesRepository: Setting value for key: ${key} for user ${userId}`);

    const existing = await executor
      .select()
      .from(userPreferences)
      .where(
        and(
          eq(userPreferences.userId, userId),
          eq(userPreferences.key, key)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await executor
        .update(userPreferences)
        .set({ value, updatedAt: now })
        .where(
          and(
            eq(userPreferences.userId, userId),
            eq(userPreferences.key, key)
          )
        );
    } else {
      await executor.insert(userPreferences).values({
        userId,
        key,
        value,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}
