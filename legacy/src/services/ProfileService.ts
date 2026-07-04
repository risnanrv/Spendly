import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuthStore } from '@/stores/auth.store';
import { SettingsService } from './SettingsService';
import { logger } from '@/utils/logger';

/**
 * ProfileService manages updating the user profile details (name, profile picture) offline,
 * copying image files locally, and syncing modifications with the cloud database.
 */
export class ProfileService {
  constructor(private settingsService: SettingsService) {}

  /**
   * Triggers the native image library picker and copies the selected avatar file locally.
   */
  public async pickAvatar(): Promise<string | null> {
    logger.debug('ProfileService: Launching system image picker...');
    
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Permission to access camera roll library was denied.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      logger.debug('ProfileService: Image selection cancelled by user.');
      return null;
    }

    const sourceUri = result.assets[0].uri;
    const extension = sourceUri.split('.').pop() || 'jpg';
    
    // Save image to document directory to prevent cache deletion cleanups
    const fileName = `avatar_${Date.now()}.${extension}`;
    const destUri = `${FileSystem.documentDirectory}${fileName}`;

    logger.debug(`ProfileService: Copying selected image from ${sourceUri} to local path ${destUri}`);
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destUri,
    });

    return destUri;
  }

  /**
   * Updates user name and profile picture avatar. Saves locally and triggers synchronization outbox.
   */
  public async updateProfile(name: string, avatarUrl: string | null): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('No authenticated user session found.');
    }

    logger.info(`ProfileService: Updating user profile to Name: ${name}, Avatar: ${avatarUrl ? 'set' : 'none'}`);

    // Update settings in database (triggers sync queue)
    await this.settingsService.setSetting('preferences_user_name', name.trim());
    if (avatarUrl) {
      await this.settingsService.setSetting('preferences_user_avatar', avatarUrl);
    }

    // Refresh auth store instantly
    useAuthStore.getState().setUser({
      ...user,
      name: name.trim(),
      avatarUrl,
    });
  }
}
