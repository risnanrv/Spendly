'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { settingsService, profileService } from '@/lib/services';
import { db } from '@/lib/db';
import { expenses, categories, monthlyBudgets } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/utils/logger';
import { CategoryRepository } from '@/database/repositories/CategoryRepository';

async function verifySession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function getSettingsAction() {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    const theme = await settingsService.getTheme(userId);
    const currency = await settingsService.getCurrency(userId);
    const name = await settingsService.getSetting(userId, 'preferences_user_name');
    const avatar = await settingsService.getSetting(userId, 'preferences_user_avatar');

    return {
      success: true,
      data: {
        theme,
        currency,
        userName: name || 'Spendly User',
        userAvatar: avatar || null,
        email: session.user.email,
      },
    };
  } catch (error: any) {
    logger.error('getSettingsAction failed:', error);
    return { success: false, error: error.message || 'Failed to fetch settings' };
  }
}

export async function updateProfileAction(name: string) {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    await profileService.updateProfile(userId, name, null);
    return { success: true };
  } catch (error: any) {
    logger.error('updateProfileAction failed:', error);
    return { success: false, error: error.message || 'Failed to update profile' };
  }
}

export async function saveAppearanceAction(data: {
  theme: 'light' | 'dark' | 'system';
  currency: string;
}) {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    await settingsService.setTheme(userId, data.theme);
    await settingsService.setCurrency(userId, data.currency);
    return { success: true };
  } catch (error: any) {
    logger.error('saveAppearanceAction failed:', error);
    return { success: false, error: error.message || 'Failed to update preferences' };
  }
}

export async function truncateExpensesAction() {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    await db.delete(expenses).where(eq(expenses.userId, userId));
    return { success: true };
  } catch (error: any) {
    logger.error('truncateExpensesAction failed:', error);
    return { success: false, error: error.message || 'Failed to truncate expenses' };
  }
}

export async function truncateBudgetsAction() {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    await db.delete(monthlyBudgets).where(eq(monthlyBudgets.userId, userId));
    return { success: true };
  } catch (error: any) {
    logger.error('truncateBudgetsAction failed:', error);
    return { success: false, error: error.message || 'Failed to truncate budgets' };
  }
}

export async function truncateCategoriesAction() {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    await db.transaction(async (tx) => {
      // Must truncate expenses too since foreign keys reference categoryId
      await tx.delete(expenses).where(eq(expenses.userId, userId));
      // Delete custom categories (leave system categories intact)
      await tx.delete(categories).where(
        and(
          eq(categories.userId, userId),
          eq(categories.isSystem, false)
        )
      );
    });
    // Clear in-memory cache so categories reload fresh
    CategoryRepository.clearCache(userId);
    return { success: true };
  } catch (error: any) {
    logger.error('truncateCategoriesAction failed:', error);
    return { success: false, error: error.message || 'Failed to truncate categories' };
  }
}

export async function resetDatabaseAction() {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    await db.transaction(async (tx) => {
      await tx.delete(expenses).where(eq(expenses.userId, userId));
      await tx.delete(monthlyBudgets).where(eq(monthlyBudgets.userId, userId));
      await tx.delete(categories).where(eq(categories.userId, userId));
    });
    // Clear in-memory cache so categories reload fresh
    CategoryRepository.clearCache(userId);
    return { success: true };
  } catch (error: any) {
    logger.error('resetDatabaseAction failed:', error);
    return { success: false, error: error.message || 'Failed to reset database' };
  }
}
