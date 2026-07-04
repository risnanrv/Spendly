import { db } from '../client';
import { userPreferences } from '../schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/utils/logger';
import type { IPreferencesRepository } from './interfaces';

/**
 * PreferencesRepository handles key-value pairs for local user preferences.
 */
export class PreferencesRepository implements IPreferencesRepository {
  public async get(key: string): Promise<string | null> {
    const results = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.key, key))
      .limit(1);

    return results.length > 0 ? results[0].value : null;
  }

  public async set(key: string, value: string, tx?: any): Promise<void> {
    const executor = tx || db;
    const now = new Date();

    logger.debug(`PreferencesRepository: Setting value for key: ${key}`);

    const existing = await executor
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.key, key))
      .limit(1);

    if (existing.length > 0) {
      await executor
        .update(userPreferences)
        .set({ value, updatedAt: now })
        .where(eq(userPreferences.key, key));
    } else {
      await executor.insert(userPreferences).values({
        key,
        value,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}
