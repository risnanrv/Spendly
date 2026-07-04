import { useRef } from 'react';
import { StyleSheet, TextInput as RNTextInput } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Screen, Text, Button, YStack, PasswordInput, Spacer, Card, NavigationHeader, Icon } from '@/components/ui';
import { zodResolver, resetPasswordSchema, type ResetPasswordInput } from '@/utils/validation';
import { useResetPassword } from '@/hooks/useAuth';
import { useLocalSearchParams, router } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';

/**
 * ResetPassword Screen.
 * Handled via deep-linking containing a token query parameter.
 */
export default function ResetPasswordScreen() {
  const confirmPasswordRef = useRef<RNTextInput>(null);
  
  // Extract token from query params
  const { token } = useLocalSearchParams<{ token?: string }>();

  const { mutate: resetPassword, isPending, isSuccess, error } = useResetPassword();

  const { control, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: ResetPasswordInput) => {
    if (!token) return;
    resetPassword({ password: data.password, token });
  };

  const handleReturnToLogin = () => {
    router.replace('/(auth)/login');
  };

  const serverError = error?.message;

  if (!token) {
    return (
      <Screen padded={false}>
        <NavigationHeader title="Invalid Request" />
        <YStack gap={4} align="center" justify="center" style={styles.successContainer}>
          <Text variant="titleL" align="center" color="danger">Invalid or Missing Token</Text>
          <Text variant="bodyM" color="textSecondary" align="center">
            This password reset link is invalid, expired, or corrupted. Please request a new link.
          </Text>
          <Spacer size={2} />
          <Button variant="outline" label="Go to Login" onPress={handleReturnToLogin} />
        </YStack>
      </Screen>
    );
  }

  if (isSuccess) {
    return (
      <Screen padded={false}>
        <NavigationHeader title="Reset Successful" />
        <YStack gap={4} align="center" justify="center" style={styles.successContainer}>
          <Icon name={CheckCircle2} size={64} color="success" />
          <Spacer size={2} />
          <Text variant="titleL" align="center">Password Reset Complete</Text>
          <Text variant="bodyM" color="textSecondary" align="center">
            Your password has been successfully updated. You can now log in using your new credentials.
          </Text>
          <Spacer size={4} />
          <Button variant="primary" label="Return to Log In" onPress={handleReturnToLogin} fullWidth />
        </YStack>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <NavigationHeader title="New Password" />

      <YStack gap={4} style={styles.formContainer}>
        <Text variant="displayM">Set New Password</Text>
        <Text variant="bodyM" color="textSecondary">
          Specify a secure security password for your account below.
        </Text>
        <Spacer size={2} />

        <Card>
          <YStack gap={4}>
            {serverError ? (
              <Text variant="bodyS" color="danger" style={styles.errorBanner}>
                {serverError}
              </Text>
            ) : null}

          {/* Password Input */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordInput
                label="New Password"
                placeholder="Minimum 8 characters"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                disabled={isPending}
                testID="reset-password-input"
                autoFocus
              />
            )}
          />

          {/* Confirm Password Input */}
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordInput
                ref={confirmPasswordRef}
                label="Confirm Password"
                placeholder="Confirm password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
                disabled={isPending}
                testID="reset-confirm-input"
              />
            )}
          />

          <Spacer size={2} />

          <Button
            variant="primary"
            label="Save New Password"
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
            disabled={isPending}
            fullWidth
            testID="reset-submit-btn"
          />
          </YStack>
        </Card>
      </YStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  successContainer: {
    flex: 1,
    paddingHorizontal: 32,
  },
  errorBanner: {
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 8,
    marginBottom: 8,
  },
});
