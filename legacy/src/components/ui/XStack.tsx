import React from 'react';
import { View, type ViewStyle, type ViewProps, type StyleProp } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { SpacingToken } from '@/theme/spacing';

export interface StackProps extends ViewProps {
  children: React.ReactNode;
  gap?: SpacingToken;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const XStack = ({
  children,
  gap,
  align = 'center',
  justify = 'flex-start',
  wrap = false,
  style,
  ...rest
}: StackProps) => {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap ? 'wrap' : 'nowrap',
    gap: gap ? theme.spacing[gap] : undefined,
  };

  return (
    <View style={[containerStyle, style]} {...rest}>
      {children}
    </View>
  );
};
