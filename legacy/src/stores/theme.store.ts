import { create } from 'zustand';
import { lightTheme, darkTheme } from '@/theme/themes';
import type { Theme } from '@/theme/themes';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeState {
  preference: ThemePreference;
  theme: Theme;
  setPreference: (preference: ThemePreference) => void;
  resolveTheme: (systemIsDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: 'system',
  theme: lightTheme,

  setPreference: (preference) => {
    set({ preference });
  },

  resolveTheme: (systemIsDark) => {
    const { preference } = get();
    let isDark = false;

    if (preference === 'dark') {
      isDark = true;
    } else if (preference === 'light') {
      isDark = false;
    } else {
      isDark = systemIsDark;
    }

    set({ theme: isDark ? darkTheme : lightTheme });
  },
}));
