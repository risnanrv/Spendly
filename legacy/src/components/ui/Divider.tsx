import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

interface DividerProps {
  horizontal?: boolean;
  style?: ViewStyle;
}

/**
 * Visual separator line using the theme's subtle border color.
 */
export const Divider = ({ horizontal = false, style }: DividerProps) => {
  const theme = useTheme();

  return (
    <View
      accessible={false}
      style={[
        {
          backgroundColor: theme.colors.borderSubtle,
          [horizontal ? 'width' : 'height']: 1,
          [horizontal ? 'height' : 'width']: horizontal ? 1 : '100%',
        },
        style,
      ]}
    />
  );
};
