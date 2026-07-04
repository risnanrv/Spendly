import React from 'react';
import {
  ScrollView,
  View,
  RefreshControl,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
  style?: ViewStyle;
}

/**
 * Screen wrapper. Handles safe area, background color, optional scrolling
 * and pull-to-refresh. All screens should use this as the root container.
 */
export const Screen = ({
  children,
  scroll = false,
  refreshing = false,
  onRefresh,
  padded = true,
  style,
}: ScreenProps) => {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  };

  const contentStyle: ViewStyle = {
    flex: scroll ? undefined : 1,
    paddingHorizontal: padded ? theme.layout.screenHorizontalPadding : 0,
  };

  if (scroll) {
    return (
      <SafeAreaView style={containerStyle} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[contentStyle, styles.scrollContent, style]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.brandPrimary}
                colors={[theme.colors.brandPrimary]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={containerStyle} edges={['top', 'left', 'right']}>
      <View style={[contentStyle, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});
