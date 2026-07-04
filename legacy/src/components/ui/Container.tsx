import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Container applies standard horizontal screen padding.
 * Useful for content that needs padding but is inside a full-width parent.
 */
export const Container = ({ children, style }: ContainerProps) => {
  const theme = useTheme();
  return (
    <View
      style={[
        { paddingHorizontal: theme.layout.screenHorizontalPadding },
        style,
      ]}
    >
      {children}
    </View>
  );
};
