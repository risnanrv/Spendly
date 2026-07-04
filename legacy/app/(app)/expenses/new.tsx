import { useState, useEffect } from 'react';
import { Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, router } from 'expo-router';
import { useCreateExpense } from '@/hooks/useExpenses';
import { Screen, NavigationHeader, ScrollableScreen, GlobalLoadingOverlay } from '@/components/ui';
import { ExpenseForm } from '@/components/ExpenseForm';
import { logger } from '@/utils/logger';

/**
 * Add Expense Screen.
 * Renders ExpenseForm, manages save states, and intercepts back actions for unsaved edits.
 */
export default function NewExpenseScreen() {
  const navigation = useNavigation();
  const [isDirty, setIsDirty] = useState(false);
  const { mutate: createExpense, isPending } = useCreateExpense();

  // Intercept back actions for unsaved changes warning
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty || isPending) {
        return;
      }

      // Prevent leaving immediately
      e.preventDefault();

      Alert.alert(
        'Discard Changes?',
        'You have unsaved edits. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel', onPress: () => {} },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, isDirty, isPending]);

  const handleSubmit = (values: any) => {
    createExpense(values, {
      onSuccess: () => {
        logger.info('NewExpenseScreen: Created expense successfully.');
        setIsDirty(false); // Reset dirty flag so navigation intercept is skipped
        // Return to history
        router.back();
      },
      onError: (error: any) => {
        logger.error('NewExpenseScreen: Failed to save:', error);
        Alert.alert('Save Error', error?.message || 'Could not record expense.');
      },
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Screen padded={false}>
      <NavigationHeader title="Add Expense" />
      <GlobalLoadingOverlay visible={isPending} message="Recording transaction..." />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollableScreen padded>
          <ExpenseForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={isPending}
            isDirtyCallback={setIsDirty}
          />
        </ScrollableScreen>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
});
