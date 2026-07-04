import '@/styles/global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { RootProvider } from '@/providers/RootProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { AppErrorBoundary } from '@/components/ui/AppErrorBoundary';
import { sessionManager } from '@/utils/session';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

// Inner layout that consumes the theme — must be inside ThemeProvider
const RootNavigator = () => {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    sessionManager.start();
    return () => {
      sessionManager.stop();
      try {
        const { container } = require('@/di/ServiceContainer');
        const syncService = container.resolve('SyncService');
        syncService.stop();
      } catch {}
    };
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppErrorBoundary>
      <RootProvider>
        <RootNavigator />
      </RootProvider>
    </AppErrorBoundary>
  );
}
