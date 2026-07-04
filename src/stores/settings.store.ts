import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const INR: Currency = {
  code: 'INR',
  symbol: '₹',
  name: 'Indian Rupee',
  locale: 'en-IN',
};

export const USD: Currency = {
  code: 'USD',
  symbol: '$',
  name: 'US Dollar',
  locale: 'en-US',
};

export const EUR: Currency = {
  code: 'EUR',
  symbol: '€',
  name: 'Euro',
  locale: 'de-DE',
};

export const GBP: Currency = {
  code: 'GBP',
  symbol: '£',
  name: 'British Pound',
  locale: 'en-GB',
};

interface SettingsState {
  currency: Currency;
  notificationsEnabled: boolean;
  budgetAlertEnabled: boolean;
  budgetAlertThreshold: number; // percentage 0–100
  setCurrency: (currency: Currency) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setBudgetAlertEnabled: (enabled: boolean) => void;
  setBudgetAlertThreshold: (threshold: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: INR,
      notificationsEnabled: true,
      budgetAlertEnabled: true,
      budgetAlertThreshold: 80,

      setCurrency: (currency) => set({ currency }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setBudgetAlertEnabled: (budgetAlertEnabled) => set({ budgetAlertEnabled }),
      setBudgetAlertThreshold: (budgetAlertThreshold) => set({ budgetAlertThreshold }),
    }),
    {
      name: 'spendly-settings-storage',
    }
  )
);
