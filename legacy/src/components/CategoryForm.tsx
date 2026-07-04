import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TextInput, Button, YStack, XStack, Text, Card, Spacer } from './ui';
import { ColorPicker, COLOR_HEX_MAP } from './ColorPicker';
import { IconPicker } from './IconPicker';
import * as Icons from 'lucide-react-native';

const HelpCircleIcon = Icons.HelpCircle as any;

const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required.')
    .max(30, 'Category name must be under 30 characters.'),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  initialValues?: {
    name: string;
    icon: string;
    color: string;
    isSystem: boolean;
  };
  onSubmit: (values: { name: string; icon: string; color: string }) => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Reusable CategoryForm component with live design previews.
 * Features Zod field validation alongside color and icon picker grids.
 */
export const CategoryForm = ({
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
}: CategoryFormProps) => {
  const [selectedColor, setSelectedColor] = useState(initialValues?.color || 'indigo');
  const [selectedIcon, setSelectedIcon] = useState(initialValues?.icon || 'utensils');

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialValues?.name || '',
    },
  });

  const categoryNameInput = watch('name');

  const handleFormSubmit = (data: CategoryFormValues) => {
    onSubmit({
      name: data.name,
      icon: selectedIcon,
      color: selectedColor,
    });
  };

  // Preview elements variables
  const previewHex = COLOR_HEX_MAP[selectedColor] || '#6366F1';
  const PreviewIconComponent = (Icons as any)[selectedIcon] || HelpCircleIcon;

  return (
    <YStack gap={3} style={styles.form}>
      {/* Live Preview Card */}
      <Text variant="labelS" color="textSecondary">
        Live Category Preview
      </Text>
      <Card style={styles.previewCard}>
        <XStack align="center" gap={3}>
          <View style={[styles.previewIconCircle, { backgroundColor: previewHex }]}>
            <PreviewIconComponent size={20} color="#FFFFFF" strokeWidth={1.5} />
          </View>
          <YStack gap={0.5} style={{ flex: 1 }}>
            <Text variant="titleS" color="textPrimary" numberOfLines={1}>
              {categoryNameInput.trim() || 'Category Name'}
            </Text>
            <Text variant="bodyS" color="textSecondary">
              {initialValues?.isSystem ? 'Protected Default' : 'Custom Category'}
            </Text>
          </YStack>
        </XStack>
      </Card>

      <Spacer size={1} />

      <Controller
        name="name"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Category Name"
            placeholder="e.g. Groceries"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.name?.message}
            disabled={loading || initialValues?.isSystem}
            autoFocus={!initialValues?.isSystem}
            maxLength={30}
          />
        )}
      />

      <ColorPicker
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
        disabled={loading}
      />

      <IconPicker
        selectedIcon={selectedIcon}
        onSelectIcon={setSelectedIcon}
        disabled={loading}
      />

      <Spacer size={2} />

      <YStack gap={2}>
        <Button
          variant="primary"
          label="Save Category"
          onPress={handleSubmit(handleFormSubmit)}
          loading={loading}
          disabled={loading}
          fullWidth
          testID="category-form-submit-btn"
        />
        <Button
          variant="outline"
          label="Cancel"
          onPress={onCancel}
          disabled={loading}
          fullWidth
        />
      </YStack>
    </YStack>
  );
};

const styles = StyleSheet.create({
  form: {
    alignSelf: 'stretch',
  },
  previewCard: {
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignSelf: 'stretch',
  },
  previewIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
