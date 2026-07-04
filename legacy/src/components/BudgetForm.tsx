import { StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TextInput, Button, YStack, Spacer } from './ui';

const budgetFormSchema = z.object({
  amountString: z
    .string()
    .min(1, 'Monthly budget amount is required.')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Target limit must be greater than ₹0.00.'),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

interface BudgetFormProps {
  initialAmount?: number | undefined; // Integer cents
  onSubmit: (amountCents: number) => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Reusable Zod-validated BudgetForm component.
 * Converts input decimal strings into integer cents prior to persistence.
 */
export const BudgetForm = ({
  initialAmount,
  onSubmit,
  onCancel,
  loading = false,
}: BudgetFormProps) => {
  const defaultValues = {
    amountString: initialAmount ? (initialAmount / 100).toFixed(2) : '',
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues,
  });

  const handleFormSubmit = (data: BudgetFormValues) => {
    const floatVal = parseFloat(data.amountString);
    const centsVal = Math.round(floatVal * 100);
    onSubmit(centsVal);
  };

  return (
    <YStack gap={4} style={styles.form}>
      <Controller
        name="amountString"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Monthly Limit Target"
            placeholder="0.00"
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={handleSubmit(handleFormSubmit)}
            prefix="₹"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.amountString?.message}
            disabled={loading}
            autoFocus
          />
        )}
      />

      <Spacer size={2} />

      <YStack gap={2}>
        <Button
          variant="primary"
          label="Save Budget Target"
          onPress={handleSubmit(handleFormSubmit)}
          loading={loading}
          disabled={loading}
          fullWidth
          testID="budget-form-submit-btn"
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
});
