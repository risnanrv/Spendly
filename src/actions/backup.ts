'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { backupService, exportService } from '@/lib/services';
import type { BackupPayload } from '@/services/BackupService';
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

export async function getBackupAction() {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    const backup = await backupService.getBackupData(userId);
    return { success: true, data: backup };
  } catch (error: any) {
    logger.error('getBackupAction failed:', error);
    return { success: false, error: error.message || 'Failed to generate database backup' };
  }
}

export async function restoreBackupAction(payload: any) {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    const success = await backupService.restoreBackup(userId, payload as BackupPayload);
    return { success, data: null };
  } catch (error: any) {
    logger.error('restoreBackupAction failed:', error);
    return { success: false, error: error.message || 'Data restoration failed' };
  }
}

export async function exportCSVAction(monthStr: string) {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    const csvContent = await exportService.exportCSV(userId, monthStr);
    return { success: true, data: csvContent };
  } catch (error: any) {
    logger.error('exportCSVAction failed:', error);
    return { success: false, error: error.message || 'Failed to export CSV report' };
  }
}

export async function exportHTMLAction(monthStr: string) {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    const htmlContent = await exportService.exportHTML(userId, monthStr);
    return { success: true, data: htmlContent };
  } catch (error: any) {
    logger.error('exportHTMLAction failed:', error);
    return { success: false, error: error.message || 'Failed to generate HTML report' };
  }
}
