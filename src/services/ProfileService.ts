import { SettingsService } from './SettingsService';
import { logger } from '@/utils/logger';

export class ProfileService {
  constructor(private settingsService: SettingsService) {}

  /**
   * Updates user name and profile picture avatar. Saves in settings.
   */
  public async updateProfile(userId: string, name: string, avatarUrl: string | null): Promise<void> {
    logger.info(`ProfileService: Updating user profile for user ${userId} to Name: ${name}`);

    // Update settings in database
    await this.settingsService.setSetting(userId, 'preferences_user_name', name.trim());
    if (avatarUrl !== null) {
      await this.settingsService.setSetting(userId, 'preferences_user_avatar', avatarUrl);
    }
  }
}
