import React from 'react';
import type { LucideProps } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import type { IconSizeToken } from '@/theme/sizes';
import type { ThemeColors } from '@/theme/themes';

interface IconProps {
  name: React.ComponentType<LucideProps>;
  size?: IconSizeToken | number;
  color?: keyof ThemeColors;
  strokeWidth?: number;
}

export const Icon = ({
  name: IconComponent,
  size = 'md',
  color = 'textPrimary',
  strokeWidth = 1.5,
}: IconProps) => {
  const theme = useTheme();

  // Resolve size from tokens if it is a token string, else use raw number
  const resolvedSize = typeof size === 'string' ? theme.sizes.icon[size] : size;

  // Resolve color from theme colors
  const resolvedColor = theme.colors[color] as string;

  const IconComponentCast = IconComponent as any;

  return (
    <IconComponentCast
      size={resolvedSize}
      color={resolvedColor}
      strokeWidth={strokeWidth}
    />
  );
};
