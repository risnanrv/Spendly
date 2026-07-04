import { Tabs } from 'expo-router';
import { Home, ReceiptText, BarChart2, Settings } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { OfflineBanner } from '@/components/ui';

/**
 * Tab Navigation Shell for authenticated layout.
 * Maps to Home, History, Reports, and Settings screens.
 */
export default function AppLayout() {
  const theme = useTheme();
  const { colors } = theme;

  const HomeIcon = Home as any;
  const HistoryIcon = ReceiptText as any;
  const ReportsIcon = BarChart2 as any;
  const SettingsIcon = Settings as any;

  return (
    <>
      {/* Network Alert Banner */}
      <OfflineBanner />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.brandPrimary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.bgCard,
            borderTopColor: colors.borderSubtle,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: 11,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <HomeIcon size={size} color={color} strokeWidth={1.5} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, size }) => (
              <HistoryIcon size={size} color={color} strokeWidth={1.5} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color, size }) => (
              <ReportsIcon size={size} color={color} strokeWidth={1.5} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <SettingsIcon size={size} color={color} strokeWidth={1.5} />
            ),
          }}
        />
        <Tabs.Screen
          name="budget"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}
