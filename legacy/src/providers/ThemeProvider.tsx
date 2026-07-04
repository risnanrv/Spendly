import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/stores/theme.store';
import type { Theme } from '@/theme/themes';

const ThemeContext = createContext<Theme | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const colorScheme = useColorScheme();
  const theme = useThemeStore((state) => state.theme);
  const resolveTheme = useThemeStore((state) => state.resolveTheme);

  useEffect(() => {
    resolveTheme(colorScheme === 'dark');
  }, [colorScheme, resolveTheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): Theme => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
};
