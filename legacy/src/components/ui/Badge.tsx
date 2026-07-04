import { type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Surface } from './Surface';
import { Text } from './Text';
import type { ThemeColors } from '@/theme/themes';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

export const Badge = ({ label, variant = 'brand', style }: BadgeProps) => {
  const theme = useTheme();

  const getColors = (): { bg: keyof ThemeColors; text: keyof ThemeColors } => {
    switch (variant) {
      case 'success':
        return { bg: 'successBg', text: 'success' };
      case 'warning':
        return { bg: 'warningBg', text: 'warning' };
      case 'danger':
        return { bg: 'dangerBg', text: 'danger' };
      case 'info':
        return { bg: 'infoBg', text: 'info' };
      case 'neutral':
        return { bg: 'bgSecondary', text: 'textSecondary' };
      case 'brand':
      default:
        return { bg: 'brandLight', text: 'textBrand' };
    }
  };

  const colors = getColors();

  return (
    <Surface
      bg={colors.bg}
      radius="sm"
      style={[
        {
          paddingHorizontal: theme.spacing[2],
          paddingVertical: theme.spacing[0.5],
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text variant="labelS" color={colors.text}>
        {label}
      </Text>
    </Surface>
  );
};
