import * as Crypto from 'expo-crypto';
import { db } from './client';
import { categories, meta } from './schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/utils/logger';

/**
 * SeedService populates default categories inside a database transaction exactly once.
 */
export class SeedService {
  public static async seed(): Promise<void> {
    try {
      // Check if already seeded in meta table
      const seedCheck = await db
        .select()
        .from(meta)
        .where(eq(meta.key, 'has_seeded'))
        .limit(1);

      if (seedCheck.length > 0 && seedCheck[0].value === 'true') {
        logger.debug('Database already seeded. Skipping.');
        return;
      }

      logger.info('Seeding default categories into local SQLite database...');
      
      const now = new Date();

      const defaultCategories = [
        {
          id: Crypto.randomUUID(),
          name: 'Food',
          icon: 'utensils',
          color: 'orange',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: Crypto.randomUUID(),
          name: 'Transport',
          icon: 'car',
          color: 'blue',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: Crypto.randomUUID(),
          name: 'Shopping',
          icon: 'shopping-bag',
          color: 'purple',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: Crypto.randomUUID(),
          name: 'Bills',
          icon: 'receipt',
          color: 'red',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: Crypto.randomUUID(),
          name: 'Entertainment',
          icon: 'film',
          color: 'pink',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: Crypto.randomUUID(),
          name: 'Healthcare',
          icon: 'heart-pulse',
          color: 'emerald',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: Crypto.randomUUID(),
          name: 'Education',
          icon: 'graduation-cap',
          color: 'violet',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: Crypto.randomUUID(),
          name: 'Travel',
          icon: 'plane',
          color: 'cyan',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: Crypto.randomUUID(),
          name: 'Subscriptions',
          icon: 'credit-card',
          color: 'amber',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: Crypto.randomUUID(),
          name: 'Other',
          icon: 'grid',
          color: 'slate',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        /* 
          Salary Category exists as an income type. It is pre-seeded in this phase
          to validate category type models and support future Income features.
        */
        {
          id: Crypto.randomUUID(),
          name: 'Salary',
          icon: 'briefcase',
          color: 'green',
          type: 'income',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
      ];

      // Run seeding in a SQLite Transaction
      await db.transaction(async (tx) => {
        // Bulk insert categories
        await tx.insert(categories).values(defaultCategories);

        // Mark as seeded
        await tx.insert(meta).values({
          key: 'has_seeded',
          value: 'true',
          updatedAt: now.getTime(),
        });
      });

      logger.info('Database seeding completed successfully.');
    } catch (error) {
      logger.error('Database seeding failed:', error);
      throw error;
    }
  }
}
