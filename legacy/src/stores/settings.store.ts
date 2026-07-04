import { create } from 'zustand';

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

export const useSettingsStore = create<SettingsState>((set) => ({
  currency: INR,
  notificationsEnabled: true,
  budgetAlertEnabled: true,
  budgetAlertThreshold: 80,

  setCurrency: (currency) => set({ currency }),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
  setBudgetAlertEnabled: (budgetAlertEnabled) => set({ budgetAlertEnabled }),
  setBudgetAlertThreshold: (budgetAlertThreshold) => set({ budgetAlertThreshold }),
}));
