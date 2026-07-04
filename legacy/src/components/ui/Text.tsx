import {
  Text as RNText,
  StyleSheet,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import type { TypeScaleKey } from '@/theme/typography';
import type { ThemeColors } from '@/theme/themes';

/**
 * Props for the Text component.
 */
interface TextProps extends Omit<RNTextProps, 'style'> {
  /** The typography variant mapping to the DSS scales */
  variant?: TypeScaleKey;
  /** Color token mapping to active theme colors */
  color?: keyof ThemeColors;
  /** Alignment of text */
  align?: TextStyle['textAlign'];
  /** Content children nodes */
  children: React.ReactNode;
  /** Optional custom styles */
  style?: TextStyle;
  /** Identifier for automation testing */
  testID?: string;
}

/**
 * Text component enforcing DSS typography token definitions.
 * All textual content across the application should utilize this wrapper.
 */
export const Text = ({
  variant = 'bodyM',
  color = 'textPrimary',
  align,
  children,
  style,
  testID,
  ...rest
}: TextProps) => {
  const theme = useTheme();
  const scale = theme.typography.scale[variant];

  return (
    <RNText
      testID={testID}
      style={[
        styles.base,
        {
          fontFamily: scale.fontFamily,
          fontSize: scale.fontSize,
          lineHeight: scale.lineHeight,
          color: theme.colors[color],
          textAlign: align,
        },
        style,
      ]}
      maxFontSizeMultiplier={1.5} // Accessibility: dynamic font scaling cap
      {...rest}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
