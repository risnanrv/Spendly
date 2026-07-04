import React from 'react';
import { View, type ViewStyle, type ViewProps, type StyleProp } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { SpacingToken } from '@/theme/spacing';

export interface YStackProps extends ViewProps {
  children: React.ReactNode;
  gap?: SpacingToken;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  style?: StyleProp<ViewStyle>;
}

export const YStack = ({
  children,
  gap,
  align = 'stretch',
  justify = 'flex-start',
  style,
  ...rest
}: YStackProps) => {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    flexDirection: 'column',
    alignItems: align,
    justifyContent: justify,
    gap: gap ? theme.spacing[gap] : undefined,
  };

  return (
    <View style={[containerStyle, style]} {...rest}>
      {children}
    </View>
  );
};
