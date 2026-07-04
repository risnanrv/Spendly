import { useState, useMemo } from 'react';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import * as Icons from 'lucide-react-native';
import { Text, SearchInput, YStack } from './ui';
import { useTheme } from '@/hooks/useTheme';

const HelpCircleIcon = Icons.HelpCircle as any;

const ICON_GROUPS = [
  {
    title: 'Daily Essentials',
    icons: ['utensils', 'receipt', 'home', 'wrench', 'heart-pulse', 'briefcase'],
  },
  {
    title: 'Leisure & Style',
    icons: ['shopping-bag', 'film', 'plane', 'coffee', 'sparkles', 'shirt'],
  },
  {
    title: 'Hobbies & Pets',
    icons: ['dumbbell', 'gamepad-2', 'laptop', 'paw-print', 'music', 'tv'],
  },
  {
    title: 'Finances & Studies',
    icons: ['credit-card', 'graduation-cap', 'car', 'gift', 'book', 'grid'],
  },
];

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
  disabled?: boolean;
}

export const IconPicker = ({
  selectedIcon,
  onSelectIcon,
  disabled = false,
}: IconPickerProps) => {
  const theme = useTheme();
  const [searchVal, setSearchVal] = useState('');

  // Filters icons by search query
  const filteredGroups = useMemo(() => {
    if (!searchVal.trim()) return ICON_GROUPS;

    const query = searchVal.toLowerCase();
    return ICON_GROUPS.map((group) => {
      const matched = group.icons.filter((iconName) =>
        iconName.toLowerCase().includes(query)
      );
      return { ...group, icons: matched };
    }).filter((group) => group.icons.length > 0);
  }, [searchVal]);

  return (
    <YStack gap={3} style={styles.container}>
      <Text variant="labelM" color="textPrimary">
        Select Category Icon
      </Text>
      
      <SearchInput
        placeholder="Search icons..."
        value={searchVal}
        onChangeText={setSearchVal}
      />

      <ScrollView style={styles.pickerWindow} nestedScrollEnabled={true}>
        <YStack gap={3}>
          {filteredGroups.length === 0 ? (
            <Text variant="bodyS" color="textSecondary" align="center" style={styles.emptyText}>
              No matching icons found.
            </Text>
          ) : (
            filteredGroups.map((group) => (
              <YStack key={group.title} gap={1.5}>
                <Text variant="labelS" color="textSecondary">
                  {group.title}
                </Text>
                <View style={styles.grid}>
                  {group.icons.map((iconName) => {
                    const IconComponent = (Icons as any)[iconName] || HelpCircleIcon;
                    const isSelected = selectedIcon === iconName;

                    return (
                      <Pressable
                        key={iconName}
                        disabled={disabled}
                        onPress={() => onSelectIcon(iconName)}
                        style={({ pressed }) => [
                          styles.iconBox,
                          {
                            backgroundColor: isSelected
                              ? theme.colors.brandPrimary
                              : theme.colors.bgSecondary,
                            borderColor: isSelected
                              ? theme.colors.brandPrimary
                              : theme.colors.borderSubtle,
                            opacity: disabled ? 0.4 : pressed ? 0.7 : 1.0,
                          },
                        ]}
                        accessibilityLabel={`Select category icon ${iconName}`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected, disabled }}
                      >
                        <IconComponent
                          size={20}
                          color={isSelected ? '#FFFFFF' : theme.colors.textPrimary}
                          strokeWidth={1.5}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </YStack>
            ))
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    alignSelf: 'stretch',
  },
  searchInput: {
    height: 38,
  },
  pickerWindow: {
    maxHeight: 180,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ECECEC',
    padding: 10,
    backgroundColor: '#FAFAFA',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    paddingVertical: 20,
  },
});
