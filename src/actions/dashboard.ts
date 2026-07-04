'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { dashboardService } from '@/lib/services';
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

export async function getDashboardAction(monthStr: string) {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    const data = await dashboardService.getDashboardData(userId, monthStr);
    
    // Convert Dates inside results to ISO string representations for transfer over Server Action boundaries
    const serializedData = JSON.parse(JSON.stringify(data));
    return { success: true, data: serializedData };
  } catch (error: any) {
    logger.error('getDashboardAction failed:', error);
    return { success: false, error: error.message || 'Failed to fetch dashboard data' };
  }
}
