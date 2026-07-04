import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeState {
  preference: ThemePreference;
  theme: 'light' | 'dark';
  setPreference: (preference: ThemePreference) => void;
  resolveTheme: (systemIsDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      preference: 'system',
      theme: 'light',

      setPreference: (preference) => {
        set({ preference });
        // Force immediate resolution based on the new preference
        const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        get().resolveTheme(systemIsDark);
      },

      resolveTheme: (systemIsDark) => {
        const { preference } = get();
        const resolvedTheme = 
          preference === 'dark' 
            ? 'dark' 
            : preference === 'light' 
              ? 'light' 
              : systemIsDark ? 'dark' : 'light';

        set({ theme: resolvedTheme });

        // Update DOM element class
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          if (resolvedTheme === 'dark') {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      },
    }),
    {
      name: 'spendly-theme-storage',
      partialize: (state) => ({ preference: state.preference }),
    }
  )
);
