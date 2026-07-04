/* eslint-disable no-console */
import crypto from 'crypto';
import { db } from '../lib/db';
import { categories, meta } from './schema';
import { eq } from 'drizzle-orm';

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
        console.log('Database already seeded. Skipping.');
        return;
      }

      console.log('Seeding default categories into local SQLite database...');
      const now = new Date();

      const defaultCategories = [
        {
          id: crypto.randomUUID(),
          name: 'Food',
          icon: 'utensils',
          color: 'orange',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          name: 'Transport',
          icon: 'car',
          color: 'blue',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          name: 'Shopping',
          icon: 'shopping-bag',
          color: 'purple',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          name: 'Bills',
          icon: 'receipt',
          color: 'red',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          name: 'Entertainment',
          icon: 'film',
          color: 'pink',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          name: 'Healthcare',
          icon: 'heart-pulse',
          color: 'emerald',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          name: 'Education',
          icon: 'graduation-cap',
          color: 'violet',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          name: 'Travel',
          icon: 'plane',
          color: 'cyan',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          name: 'Subscriptions',
          icon: 'credit-card',
          color: 'amber',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          name: 'Other',
          icon: 'grid',
          color: 'slate',
          type: 'expense',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          name: 'Salary',
          icon: 'briefcase',
          color: 'green',
          type: 'income',
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        },
      ];

      // Run seeding in a transaction
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

      console.log('Database seeding completed successfully.');
    } catch (error) {
      console.error('Database seeding failed:', error);
      throw error;
    }
  }
}
