import { useState, useMemo, memo } from 'react';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import * as Icons from 'lucide-react-native';
import { Card, Text, SearchInput, XStack, YStack, Spacer } from './ui';
import { COLOR_HEX_MAP } from './ColorPicker';
import { useTheme } from '@/hooks/useTheme';
import { useRecentCategoriesStore } from '@/stores/recentCategories.store';
import type { Category } from '@/models/domain';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

const HelpCircleIcon = Icons.HelpCircle as any;

interface CategoryPickerProps {
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  categories: Category[];
  disabled?: boolean;
}

// Memoized single grid item for speed and performance
const CategoryGridItem = memo(({
  category,
  isSelected,
  onPress,
  disabled,
}: {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
  disabled: boolean;
}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const iconHex = COLOR_HEX_MAP[category.color] || '#6366F1';
  const IconComp = (Icons as any)[category.icon] || HelpCircleIcon;

  const handlePress = () => {
    scale.value = withSequence(withSpring(1.08), withSpring(1.0));
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      disabled={disabled}
      onPress={handlePress}
      style={styles.pressableItem}
      accessibilityLabel={`Category ${category.name}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected, disabled }}
    >
      <Animated.View style={[styles.animItem, animatedStyle]}>
        <Card
          style={[
            styles.card,
            {
              borderColor: isSelected ? theme.colors.brandPrimary : theme.colors.borderSubtle,
              backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.04)' : theme.colors.bgCard,
            },
          ]}
        >
          <YStack align="center" gap={1.5}>
            <View style={[styles.iconCircle, { backgroundColor: iconHex }]}>
              <IconComp size={20} color="#FFFFFF" strokeWidth={1.5} />
            </View>
            <Text
              variant="labelM"
              color={isSelected ? 'textPrimary' : 'textSecondary'}
              numberOfLines={1}
              align="center"
            >
              {category.name}
            </Text>
          </YStack>
        </Card>
      </Animated.View>
    </Pressable>
  );
});

CategoryGridItem.displayName = 'CategoryGridItem';

export const CategoryPicker = ({
  selectedCategoryId,
  onSelectCategory,
  categories,
  disabled = false,
}: CategoryPickerProps) => {
  const [searchVal, setSearchVal] = useState('');
  const { recentCategoryIds, addRecentCategoryId } = useRecentCategoriesStore();

  const handleSelect = (id: string) => {
    addRecentCategoryId(id);
    onSelectCategory(id);
  };

  // Filter based on search input
  const filteredCategories = useMemo(() => {
    if (!searchVal.trim()) return categories;
    const query = searchVal.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(query));
  }, [categories, searchVal]);

  // Extract favorite/recent items matching active categories
  const favoriteCategories = useMemo(() => {
    const matched: Category[] = [];
    recentCategoryIds.forEach((id) => {
      const found = categories.find((c) => c.id === id);
      if (found) matched.push(found);
    });
    return matched;
  }, [categories, recentCategoryIds]);

  return (
    <YStack gap={3} style={styles.container}>
      <Text variant="labelL" color="textSecondary">
        Select Category
      </Text>

      <SearchInput
        placeholder="Search categories..."
        value={searchVal}
        onChangeText={setSearchVal}
      />

      {/* Recents Row (shown only when favorites exist and search query is empty) */}
      {!searchVal.trim() && favoriteCategories.length > 0 ? (
        <YStack gap={1.5}>
          <Text variant="labelS" color="textTertiary">
            Recently Used Favorites
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            <XStack gap={2}>
              {favoriteCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                const iconHex = COLOR_HEX_MAP[cat.color] || '#6366F1';
                const IconComponent = (Icons as any)[cat.icon] || HelpCircleIcon;

                return (
                  <Pressable
                    key={`fav-${cat.id}`}
                    onPress={() => handleSelect(cat.id)}
                    disabled={disabled}
                    style={({ pressed }) => [
                      styles.favChip,
                      {
                        backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.08)' : '#F5F5F5',
                        borderColor: isSelected ? '#4F46E5' : 'transparent',
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <XStack gap={1.5} align="center">
                      <View style={[styles.favIconCircle, { backgroundColor: iconHex }]}>
                        <IconComponent size={10} color="#FFFFFF" />
                      </View>
                      <Text variant="labelM" color={isSelected ? 'brandPrimary' : 'textPrimary'}>
                        {cat.name}
                      </Text>
                    </XStack>
                  </Pressable>
                );
              })}
            </XStack>
          </ScrollView>
          <Spacer size={1} />
        </YStack>
      ) : null}

      {/* Grid container window */}
      <View style={styles.gridContainer}>
        {filteredCategories.length === 0 ? (
          <Text variant="bodyS" color="textSecondary" align="center" style={styles.emptyText}>
            No categories found matching "{searchVal}".
          </Text>
        ) : (
          <ScrollView style={styles.scrollWindow} nestedScrollEnabled={true}>
            <View style={styles.grid}>
              {filteredCategories.map((cat) => (
                <CategoryGridItem
                  key={cat.id}
                  category={cat}
                  isSelected={selectedCategoryId === cat.id}
                  onPress={() => handleSelect(cat.id)}
                  disabled={disabled}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </YStack>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  searchInput: {
    height: 38,
  },
  horizontalScroll: {
    paddingVertical: 2,
  },
  favChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  favIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    padding: 8,
  },
  scrollWindow: {
    maxHeight: 200,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pressableItem: {
    width: '31%',
    marginBottom: 4,
  },
  animItem: {
    width: '100%',
  },
  card: {
    padding: 10,
    width: '100%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    paddingVertical: 20,
  },
});
