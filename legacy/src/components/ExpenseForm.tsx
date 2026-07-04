import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Platform, type TextInput as RNTextInput } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCategories } from '@/hooks/useCategory';
import { CategoryPicker } from '@/components/CategoryPicker';
import {
  TextInput,
  TextArea,
  Button,
  Text,
  YStack,
  XStack,
  Spacer,
  Spinner,
} from './ui';

const formSchema = z.object({
  amountString: z
    .string()
    .min(1, 'Expense amount is required.')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Amount must be greater than ₹0.00.'),
  title: z
    .string()
    .min(1, 'Please enter a description title.')
    .max(80, 'Title is too long (maximum 80 characters).'),
  categoryId: z.string().min(1, 'Please select a spending category.'),
  date: z.date(),
  note: z.string().max(500, 'Note description cannot exceed 500 characters.').optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  initialValues?: {
    amount: number; // Integer cents
    title: string;
    categoryId: string;
    date: Date;
    note: string | null;
  };
  onSubmit: (values: {
    amount: number; // Integer cents
    title: string;
    categoryId: string;
    date: Date;
    note?: string;
  }) => void;
  onCancel: () => void;
  loading?: boolean;
  isDirtyCallback?: (dirty: boolean) => void;
}

/**
 * Reusable ExpenseForm Component supporting Create/Edit/Loading.
 */
export const ExpenseForm = ({
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
  isDirtyCallback,
}: ExpenseFormProps) => {
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Keyboard navigation focus refs
  const titleInputRef = useRef<RNTextInput>(null);
  const noteInputRef = useRef<RNTextInput>(null);

  // Map initial values to form string representation
  const defaultValues = {
    amountString: initialValues ? (initialValues.amount / 100).toString() : '',
    title: initialValues?.title || '',
    categoryId: initialValues?.categoryId || '',
    date: initialValues?.date ? new Date(initialValues.date) : new Date(),
    note: initialValues?.note || '',
  };

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const selectedDate = watch('date');

  useEffect(() => {
    isDirtyCallback?.(isDirty);
  }, [isDirty, isDirtyCallback]);

  const handleFormSubmit = (data: FormValues) => {
    // Convert decimal float input to integer cents/paisa
    const amountFloat = parseFloat(data.amountString);
    const amountCents = Math.round(amountFloat * 100);

    const submitValues: {
      amount: number;
      title: string;
      categoryId: string;
      date: Date;
      note?: string;
    } = {
      amount: amountCents,
      title: data.title.trim(),
      categoryId: data.categoryId,
      date: data.date,
    };

    if (data.note) {
      submitValues.note = data.note.trim();
    }

    onSubmit(submitValues);
  };

  if (categoriesLoading) {
    return (
      <YStack align="center" justify="center" style={styles.loadingContainer}>
        <Spinner size="md" />
        <Spacer size={2} />
        <Text variant="bodyM" color="textSecondary">
          Loading category options...
        </Text>
      </YStack>
    );
  }

  return (
    <YStack gap={4} style={styles.form}>
      {/* 1. Amount Fields */}
      <Controller
        name="amountString"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Amount"
            placeholder="0.00"
            keyboardType="decimal-pad"
            returnKeyType="next"
            onSubmitEditing={() => titleInputRef.current?.focus()}
            prefix="₹"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.amountString?.message}
            disabled={loading}
            autoFocus={!initialValues}
            testID="expense-form-amount-input"
          />
        )}
      />

      {/* 2. Title Field */}
      <Controller
        name="title"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            ref={titleInputRef}
            label="Title / Description"
            placeholder="e.g. Weekly Groceries"
            returnKeyType="next"
            onSubmitEditing={() => noteInputRef.current?.focus()}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.title?.message}
            disabled={loading}
            testID="expense-form-title-input"
          />
        )}
      />

      {/* 3. Category Selection Picker Component */}
      <Controller
        name="categoryId"
        control={control}
        render={({ field: { onChange, value } }) => (
          <CategoryPicker
            selectedCategoryId={value}
            onSelectCategory={onChange}
            categories={categoriesData || []}
            disabled={loading}
          />
        )}
      />
      {errors.categoryId?.message ? (
        <Text variant="labelM" color="danger" style={{ marginTop: -4 }}>
          {errors.categoryId.message}
        </Text>
      ) : null}

      {/* 4. Date & Time Choosers */}
      <XStack gap={3}>
        <View style={{ flex: 1 }}>
          <Text variant="labelL" color="textSecondary" style={styles.fieldLabel}>
            Date
          </Text>
          <Button
            variant="outline"
            label={selectedDate.toLocaleDateString()}
            onPress={() => setShowDatePicker(true)}
            disabled={loading}
            fullWidth
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text variant="labelL" color="textSecondary" style={styles.fieldLabel}>
            Time
          </Text>
          <Button
            variant="outline"
            label={selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            onPress={() => setShowTimePicker(true)}
            disabled={loading}
            fullWidth
          />
        </View>
      </XStack>

      {showDatePicker ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_event, date) => {
            setShowDatePicker(false);
            if (date) {
              const current = new Date(selectedDate);
              current.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
              setValue('date', current, { shouldDirty: true });
            }
          }}
        />
      ) : null}

      {showTimePicker ? (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_event, time) => {
            setShowTimePicker(false);
            if (time) {
              const current = new Date(selectedDate);
              current.setHours(time.getHours(), time.getMinutes());
              setValue('date', current, { shouldDirty: true });
            }
          }}
        />
      ) : null}

      {/* 5. Notes Field */}
      <Controller
        name="note"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextArea
            ref={noteInputRef}
            label="Notes (Optional)"
            placeholder="Add transactions metadata..."
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.note?.message}
            disabled={loading}
            maxLength={500}
          />
        )}
      />

      <Spacer size={2} />

      {/* 6. Form Actions */}
      <YStack gap={2}>
        <Button
          variant="primary"
          label={initialValues ? 'Save Changes' : 'Create Expense'}
          onPress={handleSubmit(handleFormSubmit)}
          loading={loading}
          disabled={loading}
          fullWidth
          testID="expense-form-submit-btn"
        />
        <Button
          variant="outline"
          label="Cancel"
          onPress={onCancel}
          disabled={loading}
          fullWidth
          testID="expense-form-cancel-btn"
        />
      </YStack>
    </YStack>
  );
};

const styles = StyleSheet.create({
  form: {
    alignSelf: 'stretch',
  },
  loadingContainer: {
    paddingVertical: 60,
  },
  categoryGrid: {
    flexDirection: 'row',
  },
  categoryCard: {
    width: 80,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    marginBottom: 6,
  },
});
