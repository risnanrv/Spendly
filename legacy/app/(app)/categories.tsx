import { useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Alert, Pressable, Modal } from 'react-native';
import {
  Screen,
  Text,
  Button,
  YStack,
  XStack,
  Card,
  Spacer,
  Spinner,
  NavigationHeader,
  SearchInput,
} from '@/components/ui';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/useCategory';
import { CategoryForm } from '@/components/CategoryForm';
import { COLOR_HEX_MAP } from '@/components/ColorPicker';
import { useTheme } from '@/hooks/useTheme';
import { formatAmount } from '@/utils/currency';
import * as Icons from 'lucide-react-native';

const HelpCircleIcon = Icons.HelpCircle as any;
const Trash2Icon = Icons.Trash2 as any;
const Edit3Icon = Icons.Edit3 as any;
const InfoIcon = Icons.Info as any;

/**
 * Category Management Screen.
 * Manage custom categories, updates default styles, and executes transactional reassignment migrations.
 */
export default function CategoriesScreen() {
  const theme = useTheme();

  // Queries & Mutations
  const { data: categoriesData, isLoading, isError, error, refetch } = useCategories({ includeStats: true });
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // UI state overlays
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [reassignCategory, setReassignCategory] = useState<any | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');

  // Filters categories based on search input
  const filteredCategories = useMemo(() => {
    if (!categoriesData) return [];
    if (!searchQuery.trim()) return categoriesData;
    const query = searchQuery.toLowerCase();
    return categoriesData.filter((c) => c.name.toLowerCase().includes(query));
  }, [categoriesData, searchQuery]);

  // Splits filtered categories into system and custom groups
  const systemCategories = useMemo(() => filteredCategories.filter((c) => c.isSystem), [filteredCategories]);
  const customCategories = useMemo(() => filteredCategories.filter((c) => !c.isSystem), [filteredCategories]);

  // Target options for reassignment lists (excludes source category)
  const reassignmentTargets = useMemo(() => {
    if (!categoriesData || !reassignCategory) return [];
    return categoriesData.filter((c) => c.id !== reassignCategory.id);
  }, [categoriesData, reassignCategory]);

  const handleCreate = async (values: { name: string; icon: string; color: string }) => {
    try {
      await createMutation.mutateAsync({ ...values, type: 'expense' });
      setAddingCategory(false);
    } catch (err: any) {
      Alert.alert('Create Category Failed', err?.message || 'Unable to register new category.');
    }
  };

  const handleUpdate = async (values: { name: string; icon: string; color: string }) => {
    try {
      const updatePayload: { id: string; name?: string; icon: string; color: string } = {
        id: editingCategory.id,
        icon: values.icon,
        color: values.color,
      };
      if (!editingCategory.isSystem) {
        updatePayload.name = values.name;
      }
      await updateMutation.mutateAsync(updatePayload);
      setEditingCategory(null);
    } catch (err: any) {
      Alert.alert('Update Category Failed', err?.message || 'Unable to modify category.');
    }
  };

  const handleDeletePress = (category: any) => {
    if (category.isSystem) {
      Alert.alert('System Category Protected', 'System categories cannot be deleted.');
      return;
    }

    if (category.expenseCount > 0) {
      // Reassignment is required
      setTargetCategoryId('');
      setReassignCategory(category);
    } else {
      Alert.alert(
        'Delete Category',
        `Are you sure you want to delete the category "${category.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteMutation.mutateAsync({ id: category.id });
              } catch (err: any) {
                Alert.alert('Deletion Failed', err?.message || 'Unable to remove category.');
              }
            },
          },
        ]
      );
    }
  };

  const handleReassignmentSubmit = async () => {
    if (!targetCategoryId) {
      Alert.alert('Target Required', 'Please select a replacement category.');
      return;
    }

    try {
      await deleteMutation.mutateAsync({
        id: reassignCategory.id,
        reassignToId: targetCategoryId,
      });
      setReassignCategory(null);
    } catch (err: any) {
      Alert.alert('Migration Failed', err?.message || 'Unable to reassign and delete category.');
    }
  };

  if (isLoading) {
    return (
      <Screen padded={false}>
        <NavigationHeader title="Manage Categories" />
        <YStack align="center" justify="center" style={styles.loadingWrapper}>
          <Spinner size="md" />
          <Spacer size={2} />
          <Text variant="bodyM" color="textSecondary">
            Loading categories and stats...
          </Text>
        </YStack>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen padded={false}>
        <NavigationHeader title="Manage Categories" />
        <YStack align="center" justify="center" style={styles.errorWrapper} gap={3}>
          <Text variant="titleM" color="textPrimary">
            Fetch Failed
          </Text>
          <Text variant="bodyM" color="textSecondary" align="center">
            {error?.message || 'Unable to retrieve category data.'}
          </Text>
          <Button variant="primary" label="Retry" onPress={() => refetch()} />
        </YStack>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <NavigationHeader title="Manage Categories" />

      {/* Floating Add Category CTA Button */}
      <View style={styles.fabContainer}>
        <Button
          variant="primary"
          label="+ New Category"
          onPress={() => setAddingCategory(true)}
          style={styles.fab}
          testID="new-category-fab"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <YStack gap={4}>
          <SearchInput
            placeholder="Search categories..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {addingCategory ? (
            <Card style={styles.formCard}>
              <Text variant="titleM" color="textPrimary">
                Create Category
              </Text>
              <Spacer size={2} />
              <CategoryForm
                onSubmit={handleCreate}
                onCancel={() => setAddingCategory(false)}
                loading={createMutation.isPending}
              />
            </Card>
          ) : editingCategory ? (
            <Card style={styles.formCard}>
              <Text variant="titleM" color="textPrimary">
                Edit {editingCategory.name}
              </Text>
              <Spacer size={2} />
              <CategoryForm
                initialValues={{
                  name: editingCategory.name,
                  icon: editingCategory.icon,
                  color: editingCategory.color,
                  isSystem: editingCategory.isSystem,
                }}
                onSubmit={handleUpdate}
                onCancel={() => setEditingCategory(null)}
                loading={updateMutation.isPending}
              />
            </Card>
          ) : null}

          {/* 1. Custom Categories section */}
          {!addingCategory && !editingCategory && (
            <YStack gap={2}>
              <Text variant="labelL" color="textPrimary">
                Custom Categories
              </Text>
              {customCategories.length === 0 ? (
                <Card style={styles.emptyCustomCard}>
                  <Text variant="bodyS" color="textSecondary" align="center">
                    No custom categories created yet. Tap "New Category" to add one.
                  </Text>
                </Card>
              ) : (
                <YStack gap={2}>
                  {customCategories.map((cat) => {
                    const IconComp = (Icons as any)[cat.icon] || HelpCircleIcon;
                    const colorHex = COLOR_HEX_MAP[cat.color] || '#6366F1';

                    return (
                      <Card key={cat.id} style={styles.categoryRowCard}>
                        <XStack justify="space-between" align="center">
                          <XStack align="center" gap={3} style={{ flex: 1 }}>
                            <View style={[styles.iconCircle, { backgroundColor: colorHex }]}>
                              <IconComp size={18} color="#FFFFFF" strokeWidth={1.5} />
                            </View>
                            <YStack gap={0.5} style={{ flex: 1 }}>
                              <Text variant="labelM" color="textPrimary" numberOfLines={1}>
                                {cat.name}
                              </Text>
                              <Text variant="bodyS" color="textSecondary">
                                {cat.expenseCount} items • {formatAmount(cat.totalSpent || 0)} spent
                              </Text>
                            </YStack>
                          </XStack>
                          <XStack gap={2}>
                            <Pressable
                              onPress={() => setEditingCategory(cat)}
                              style={styles.actionBtn}
                              accessibilityLabel={`Edit category ${cat.name}`}
                              accessibilityRole="button"
                            >
                              <Edit3Icon size={16} color={theme.colors.textPrimary} />
                            </Pressable>
                            <Pressable
                              onPress={() => handleDeletePress(cat)}
                              style={styles.actionBtn}
                              accessibilityLabel={`Delete category ${cat.name}`}
                              accessibilityRole="button"
                            >
                              <Trash2Icon size={16} color={theme.colors.danger} />
                            </Pressable>
                          </XStack>
                        </XStack>
                      </Card>
                    );
                  })}
                </YStack>
              )}
            </YStack>
          )}

          {/* 2. System Categories section */}
          {!addingCategory && !editingCategory && (
            <YStack gap={2}>
              <Text variant="labelL" color="textPrimary">
                Default Categories
              </Text>
              <YStack gap={2}>
                {systemCategories.map((cat) => {
                  const IconComp = (Icons as any)[cat.icon] || HelpCircleIcon;
                  const colorHex = COLOR_HEX_MAP[cat.color] || '#6366F1';

                  return (
                    <Card key={cat.id} style={styles.categoryRowCard}>
                      <XStack justify="space-between" align="center">
                        <XStack align="center" gap={3} style={{ flex: 1 }}>
                          <View style={[styles.iconCircle, { backgroundColor: colorHex }]}>
                            <IconComp size={18} color="#FFFFFF" strokeWidth={1.5} />
                          </View>
                          <YStack gap={0.5} style={{ flex: 1 }}>
                            <Text variant="labelM" color="textPrimary" numberOfLines={1}>
                              {cat.name}
                            </Text>
                            <Text variant="bodyS" color="textSecondary">
                              {cat.expenseCount} items • {formatAmount(cat.totalSpent || 0)} spent
                            </Text>
                          </YStack>
                        </XStack>
                        <XStack gap={2}>
                          <Pressable
                            onPress={() => setEditingCategory(cat)}
                            style={styles.actionBtn}
                            accessibilityLabel={`Edit default category settings for ${cat.name}`}
                            accessibilityRole="button"
                          >
                            <Edit3Icon size={16} color={theme.colors.textPrimary} />
                          </Pressable>
                        </XStack>
                      </XStack>
                    </Card>
                  );
                })}
              </YStack>
            </YStack>
          )}
        </YStack>
      </ScrollView>

      {/* Reassignment Modal Overlay */}
      {reassignCategory && (
        <Modal transparent={true} visible={true} animationType="slide">
          <View style={styles.modalBackdrop}>
            <Card style={styles.modalContent}>
              <YStack gap={3}>
                <XStack gap={2} align="center">
                  <InfoIcon size={24} color={theme.colors.warning} />
                  <Text variant="titleM" color="textPrimary">
                    Reassign Category Transactions
                  </Text>
                </XStack>
                
                <Text variant="bodyM" color="textSecondary">
                  The category "{reassignCategory.name}" is associated with {reassignCategory.expenseCount} transactions. Select a replacement category to migrate these transactions.
                </Text>

                <YStack gap={2}>
                  <Text variant="labelS" color="textPrimary">
                    Choose Replacement Category:
                  </Text>
                  
                  <ScrollView style={styles.targetsList}>
                    <YStack gap={1.5}>
                      {reassignmentTargets.map((target) => {
                        const isSelected = targetCategoryId === target.id;
                        const targetHex = COLOR_HEX_MAP[target.color] || '#6366F1';
                        const TargetIcon = (Icons as any)[target.icon] || HelpCircleIcon;

                        return (
                          <Pressable
                            key={target.id}
                            onPress={() => setTargetCategoryId(target.id)}
                            style={[
                              styles.targetRow,
                              {
                                backgroundColor: isSelected
                                  ? theme.colors.bgSecondary
                                  : 'transparent',
                                borderColor: isSelected
                                  ? theme.colors.brandPrimary
                                  : theme.colors.borderSubtle,
                              },
                            ]}
                          >
                            <XStack gap={2} align="center">
                              <View style={[styles.targetMiniIcon, { backgroundColor: targetHex }]}>
                                <TargetIcon size={12} color="#FFFFFF" />
                              </View>
                              <Text variant="bodyM" color="textPrimary">
                                {target.name}
                              </Text>
                            </XStack>
                          </Pressable>
                        );
                      })}
                    </YStack>
                  </ScrollView>
                </YStack>

                <Spacer size={1} />

                <XStack gap={2}>
                  <Button
                    variant="outline"
                    label="Cancel"
                    onPress={() => setReassignCategory(null)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    variant="primary"
                    label="Reassign & Delete"
                    onPress={handleReassignmentSubmit}
                    disabled={!targetCategoryId || deleteMutation.isPending}
                    loading={deleteMutation.isPending}
                    style={{ flex: 1 }}
                  />
                </XStack>
              </YStack>
            </Card>
          </View>
        </Modal>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingWrapper: {
    flex: 1,
  },
  errorWrapper: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  fab: {
    height: 48,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  formCard: {
    padding: 16,
    marginBottom: 8,
  },
  emptyCustomCard: {
    padding: 20,
    alignItems: 'center',
  },
  categoryRowCard: {
    padding: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    padding: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 20,
    maxHeight: '80%',
  },
  targetsList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 8,
    padding: 8,
  },
  targetRow: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
  },
  targetMiniIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
