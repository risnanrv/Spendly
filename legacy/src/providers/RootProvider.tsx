import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './ThemeProvider';
import { QueryProvider } from './QueryProvider';
import { DatabaseProvider } from './DatabaseProvider';

interface RootProviderProps {
  children: React.ReactNode;
}

/**
 * RootProvider composes all app-wide providers in the correct dependency order:
 * GestureHandler → Theme → Query → Database
 *
 * Add new providers here as phases progress.
 */
export const RootProvider = ({ children }: RootProviderProps) => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <QueryProvider>
          <DatabaseProvider>{children}</DatabaseProvider>
        </QueryProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
};
