import { StyleSheet, Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Text } from './ui';
import { useTheme } from '@/hooks/useTheme';
import { CURATED_COLORS } from '@/services/CategoryService';

const CheckIcon = Check as any;

export const COLOR_HEX_MAP: Record<string, string> = {
  indigo: '#6366F1',
  orange: '#F97316',
  blue: '#3B82F6',
  purple: '#A855F7',
  red: '#EF4444',
  pink: '#EC4899',
  emerald: '#10B981',
  violet: '#8B5CF6',
  cyan: '#06B6D4',
  amber: '#F59E0B',
  slate: '#64748B',
  rose: '#F43F5E',
  teal: '#14B8A6',
  yellow: '#EAB308',
  lightBlue: '#0EA5E9',
  gray: '#94A3B8',
};

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
  disabled?: boolean;
}

export const ColorPicker = ({
  selectedColor,
  onSelectColor,
  disabled = false,
}: ColorPickerProps) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text variant="labelM" color="textPrimary" style={styles.label}>
        Select Curated Color Theme
      </Text>
      <View style={styles.grid}>
        {CURATED_COLORS.map((colorName) => {
          const hex = COLOR_HEX_MAP[colorName] || '#64748B';
          const isSelected = selectedColor === colorName;

          return (
            <Pressable
              key={colorName}
              disabled={disabled}
              onPress={() => onSelectColor(colorName)}
              style={({ pressed }) => [
                styles.colorCircle,
                {
                  backgroundColor: hex,
                  opacity: disabled ? 0.4 : pressed ? 0.8 : 1.0,
                  borderColor: isSelected ? theme.colors.textPrimary : 'transparent',
                  borderWidth: isSelected ? 3 : 0,
                },
              ]}
              accessibilityLabel={`Select theme color ${colorName}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected, disabled }}
            >
              {isSelected ? (
                <CheckIcon size={16} color="#FFFFFF" strokeWidth={3} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    alignSelf: 'stretch',
  },
  label: {
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
});
