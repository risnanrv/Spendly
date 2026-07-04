import { logger } from '@/utils/logger';

/**
 * Placeholder for future NotificationService triggers.
 */
export class NotificationService {
  public async sendLocalNotification(title: string, message: string): Promise<void> {
    logger.debug(`NotificationService: [Placeholder] dispatching "${title}": ${message}`);
  }
}
