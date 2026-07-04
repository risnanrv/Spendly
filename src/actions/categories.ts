'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { categoryService } from '@/lib/services';
import { logger } from '@/utils/logger';

async function verifySession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function getCategoriesAction() {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    const categories = await categoryService.getCategoriesWithStats(userId);
    return { success: true, data: JSON.parse(JSON.stringify(categories)) };
  } catch (error: any) {
    logger.error('getCategoriesAction failed:', error);
    return { success: false, error: error.message || 'Failed to fetch categories' };
  }
}

export async function createCategoryAction(data: {
  name: string;
  icon: string;
  color: string;
}) {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    const res = await categoryService.createCategory(userId, data.name, data.icon, data.color);
    return { success: true, data: JSON.parse(JSON.stringify(res)) };
  } catch (error: any) {
    logger.error('createCategoryAction failed:', error);
    return { success: false, error: error.message || 'Failed to create category' };
  }
}

export async function updateCategoryAction(
  id: string,
  data: {
    name?: string;
    icon?: string;
    color?: string;
  }
) {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    await categoryService.updateCategory(userId, id, data.name, data.icon, data.color);
    return { success: true };
  } catch (error: any) {
    logger.error('updateCategoryAction failed:', error);
    return { success: false, error: error.message || 'Failed to update category' };
  }
}

export async function deleteCategoryAction(id: string, reassignToId?: string) {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    await categoryService.deleteCategory(userId, id, reassignToId);
    return { success: true };
  } catch (error: any) {
    logger.error('deleteCategoryAction failed:', error);
    return { success: false, error: error.message || 'Failed to delete category' };
  }
}
