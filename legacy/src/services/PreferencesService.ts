import type { IPreferencesRepository } from '@/database/repositories/interfaces';

/**
 * PreferencesService provides key-value user preference configurations.
 */
export class PreferencesService {
  constructor(private preferencesRepo: IPreferencesRepository) {}

  public async getPreference(key: string): Promise<string | null> {
    return this.preferencesRepo.get(key);
  }

  public async setPreference(key: string, value: string): Promise<void> {
    return this.preferencesRepo.set(key, value);
  }
}
