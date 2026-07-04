import { View, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import type { ShadowToken } from '@/theme/shadows';
import type { RadiusToken } from '@/theme/radius';

/**
 * Props for the Card component.
 */
interface CardProps {
  /** Component content */
  children: React.ReactNode;
  /** Shadow token from the theme */
  shadow?: ShadowToken;
  /** Radius token from the theme */
  radius?: RadiusToken;
  /** Apply padding spacing token when true */
  padding?: boolean;
  /** Optional container custom styling */
  style?: StyleProp<ViewStyle>;
  /** Optional automation testing identifier */
  testID?: string;
  /** Optional accessibility label */
  accessibilityLabel?: string;
  /** Click action handler */
  onPress?: () => void;
}

/**
 * Card primitive. Themed background, configurable shadow and radius.
 * Use as the base container for all card-style UI.
 */
export const Card = ({
  children,
  shadow = 'sm',
  radius = 'lg',
  padding = true,
  style,
  testID,
  accessibilityLabel,
}: CardProps) => {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radius[radius],
          padding: padding ? theme.spacing[5] : 0,
          ...theme.shadows[shadow],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
