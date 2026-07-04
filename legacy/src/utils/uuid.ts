import * as Crypto from 'expo-crypto';

/**
 * Generate a UUID v4 using the device's cryptographically secure random source.
 * All entity IDs in Spendly are client-generated UUIDs (offline-first pattern).
 */
export const generateUUID = (): string => {
  return Crypto.randomUUID();
};

/**
 * Verify that a string is a valid UUID v4 format.
 */
export const isValidUUID = (value: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};
