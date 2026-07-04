import React from 'react';
import { ScrollView, RefreshControl, StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

interface ScrollableScreenProps {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
  style?: ViewStyle;
}

export const ScrollableScreen = ({
  children,
  refreshing = false,
  onRefresh,
  padded = true,
  style,
}: ScrollableScreenProps) => {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  };

  const contentStyle: ViewStyle = {
    paddingHorizontal: padded ? theme.layout.screenHorizontalPadding : 0,
  };

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
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});
