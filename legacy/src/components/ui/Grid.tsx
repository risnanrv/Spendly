import React from 'react';
import { View, type ViewStyle, type ViewProps, type StyleProp } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { SpacingToken } from '@/theme/spacing';

interface GridProps extends ViewProps {
  children: React.ReactNode;
  cols?: number;
  gap?: SpacingToken;
  style?: StyleProp<ViewStyle>;
}

export const Grid = ({ children, cols = 2, gap = 4, style, ...rest }: GridProps) => {
  const theme = useTheme();
  const spacingVal = theme.spacing[gap];

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacingVal / 2,
  };

  const itemStyle: ViewStyle = {
    width: `${100 / cols}%`,
    paddingHorizontal: spacingVal / 2,
    marginBottom: spacingVal,
  };

  return (
    <View style={[containerStyle, style]} {...rest}>
      {React.Children.map(children, (child) => {
        if (!child) return null;
        return <View style={itemStyle}>{child}</View>;
      })}
    </View>
  );
};
