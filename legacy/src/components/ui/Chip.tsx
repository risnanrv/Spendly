import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Surface } from './Surface';
import { Text } from './Text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const Chip = ({ label, selected = false, onPress, style }: ChipProps) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Surface
        bg={selected ? 'brandLight' : 'bgPrimary'}
        radius="full"
        borderWidth="thin"
        borderColor={selected ? 'brandPrimary' : 'borderDefault'}
        style={[
          {
            paddingHorizontal: theme.spacing[3],
            paddingVertical: theme.spacing[1.5],
            alignSelf: 'flex-start',
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
      >
        <Text variant="labelM" color={selected ? 'textBrand' : 'textSecondary'}>
          {label}
        </Text>
      </Surface>
    </Pressable>
  );
};
