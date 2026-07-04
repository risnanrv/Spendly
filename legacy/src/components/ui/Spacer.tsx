import { View } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import type { SpacingToken } from '@/theme/spacing';

interface SpacerProps {
  size: SpacingToken;
  horizontal?: boolean;
}

/**
 * Spacer inserts a blank space of a given design token size.
 * Defaults to vertical spacing. Set horizontal=true for horizontal gaps.
 */
export const Spacer = ({ size, horizontal = false }: SpacerProps) => {
  const theme = useTheme();
  const value = theme.spacing[size];

  return (
    <View
      style={horizontal ? { width: value } : { height: value }}
      accessible={false}
    />
  );
};
