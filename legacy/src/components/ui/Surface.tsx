import React from 'react';
import { View, type ViewStyle, type ViewProps, type StyleProp } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { RadiusToken } from '@/theme/radius';
import type { ShadowToken } from '@/theme/shadows';
import type { ThemeColors } from '@/theme/themes';
import type { BorderWidthToken, BorderStyleToken } from '@/theme/borders';
import type { SpacingToken } from '@/theme/spacing';

interface SurfaceProps extends ViewProps {
  children?: React.ReactNode;
  bg?: keyof ThemeColors;
  radius?: RadiusToken;
  shadow?: ShadowToken;
  borderWidth?: BorderWidthToken;
  borderColor?: keyof ThemeColors;
  borderStyle?: BorderStyleToken;
  padding?: boolean | SpacingToken;
  style?: StyleProp<ViewStyle>;
}

export const Surface = ({
  children,
  bg = 'bgCard',
  radius: radiusToken = 'md',
  shadow = 'none',
  borderWidth = 'none',
  borderColor = 'borderDefault',
  borderStyle = 'solid',
  padding,
  style,
  ...rest
}: SurfaceProps) => {
  const theme = useTheme();

  // Resolve padding
  let resolvedPadding: number | undefined;
  if (padding === true) {
    resolvedPadding = theme.spacing[5];
  } else if (padding !== undefined && padding !== false) {
    resolvedPadding = theme.spacing[padding as SpacingToken];
  }

  const containerStyle: ViewStyle = {
    backgroundColor: theme.colors[bg],
    borderRadius: theme.radius[radiusToken],
    borderWidth: theme.borders.width[borderWidth],
    borderColor: theme.colors[borderColor],
    borderStyle: theme.borders.style[borderStyle] as ViewStyle['borderStyle'],
    padding: resolvedPadding,
    ...theme.shadows[shadow],
  };

  return (
    <View style={[containerStyle, style]} {...rest}>
      {children}
    </View>
  );
};
