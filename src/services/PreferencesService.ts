import type { IPreferencesRepository } from '@/database/repositories/interfaces';

export class PreferencesService {
  constructor(private preferencesRepo: IPreferencesRepository) {}

  public async getPreference(userId: string, key: string): Promise<string | null> {
    return this.preferencesRepo.get(userId, key);
  }

  public async setPreference(userId: string, key: string, value: string): Promise<void> {
    return this.preferencesRepo.set(userId, key, value);
  }
}
