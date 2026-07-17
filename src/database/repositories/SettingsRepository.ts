import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { logger } from '@/utils/logger';
import type { ISettingsRepository } from './interfaces';

export class SettingsRepository implements ISettingsRepository {
  public async get(userId: string, key: string): Promise<string | null> {
    logger.debug(`SettingsRepository: Reading key "${key}" inside Firestore settings for user ${userId}`);
    const docRef = doc(db, 'settings', userId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) return null;
    const data = snap.data();
    return data[key] !== undefined ? String(data[key]) : null;
  }

  public async set(userId: string, key: string, value: string, tx?: any): Promise<void> {
    logger.debug(`SettingsRepository: Writing key "${key}" to "${value}" inside Firestore settings for user ${userId}`);
    const docRef = doc(db, 'settings', userId);

    await setDoc(
      docRef,
      {
        [key]: value,
        userId,
        updatedAt: Timestamp.fromDate(new Date()),
      },
      { merge: true }
    );
  }
}
