import { useState, useEffect } from 'react';
import { Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, router, useLocalSearchParams } from 'expo-router';
import { useExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/useExpenses';
import { Screen, NavigationHeader, ScrollableScreen, GlobalLoadingOverlay, Spinner, Text, YStack, Spacer, Button } from '@/components/ui';
import { ExpenseForm } from '@/components/ExpenseForm';
import { logger } from '@/utils/logger';

/**
 * Edit Expense Screen.
 * Pre-populates fields, handles modifications, and contains deletion triggers with alerts.
 */
export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [isDirty, setIsDirty] = useState(false);

  // Queries & Mutations
  const { data: expense, isLoading, error, refetch } = useExpense(id || '');
  const { mutate: updateExpense, isPending: updatePending } = useUpdateExpense();
  const { mutate: deleteExpense, isPending: deletePending } = useDeleteExpense();

  // Intercept back actions for unsaved changes warning
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty || updatePending || deletePending) {
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
  }, [navigation, isDirty, updatePending, deletePending]);

  const handleSubmit = (values: any) => {
    if (!id) return;

    updateExpense(
      { id, data: values },
      {
        onSuccess: () => {
          logger.info('EditExpenseScreen: Saved updates successfully.');
          setIsDirty(false);
          router.back();
        },
        onError: (err: any) => {
          logger.error('EditExpenseScreen: Failed to save changes:', err);
          Alert.alert('Save Error', err?.message || 'Could not update expense.');
        },
      }
    );
  };

  const handleDelete = () => {
    if (!id) return;

    Alert.alert(
      'Delete Transaction?',
      'Are you sure you want to delete this expense? This action can be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteExpense(id, {
              onSuccess: () => {
                logger.info('EditExpenseScreen: Deleted expense successfully.');
                setIsDirty(false);
                router.back();
              },
              onError: (err: any) => {
                logger.error('EditExpenseScreen: Deletion failed:', err);
                Alert.alert('Error', err?.message || 'Could not delete expense.');
              },
            });
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <Screen padded={false}>
        <NavigationHeader title="Edit Expense" />
        <YStack align="center" justify="center" style={styles.loadingContainer}>
          <Spinner size="md" />
          <Spacer size={2} />
          <Text variant="bodyM" color="textSecondary">
            Retrieving transaction details...
          </Text>
        </YStack>
      </Screen>
    );
  }

  if (error || !expense) {
    return (
      <Screen padded={false}>
        <NavigationHeader title="Error" />
        <YStack align="center" justify="center" style={styles.loadingContainer} gap={3}>
          <Text variant="titleS" color="danger" align="center">
            Could Not Load Expense
          </Text>
          <Text variant="bodyM" color="textSecondary" align="center">
            {error?.message || 'The requested transaction could not be found or has been deleted.'}
          </Text>
          <Spacer size={2} />
          <Button variant="outline" label="Retry" onPress={() => refetch()} />
        </YStack>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <NavigationHeader title="Edit Expense" />
      <GlobalLoadingOverlay visible={updatePending || deletePending} message="Saving changes..." />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollableScreen padded>
          <ExpenseForm
            initialValues={expense}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={updatePending || deletePending}
            isDirtyCallback={setIsDirty}
          />

          <Spacer size={3} />

          <Button
            variant="destructive"
            label="Delete Expense"
            onPress={handleDelete}
            disabled={updatePending || deletePending}
            fullWidth
            testID="expense-edit-delete-btn"
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
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
});
