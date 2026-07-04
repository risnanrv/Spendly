import { StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Screen, Text, Button, YStack, TextInput, Spacer, Card, NavigationHeader, Icon } from '@/components/ui';
import { zodResolver, forgotPasswordSchema, type ForgotPasswordInput } from '@/utils/validation';
import { useForgotPassword } from '@/hooks/useAuth';
import { CheckCircle2 } from 'lucide-react-native';

/**
 * ForgotPassword Screen.
 * Allows user to request password reset triggers.
 */
export default function ForgotPasswordScreen() {
  const { mutate: forgotPassword, isPending, isSuccess, error } = useForgotPassword();

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotPassword(data);
  };

  const serverError = error?.message;

  if (isSuccess) {
    return (
      <Screen padded={false}>
        <NavigationHeader title="Reset Request Sent" />
        <YStack gap={4} align="center" justify="center" style={styles.successContainer}>
          <Icon name={CheckCircle2} size={64} color="success" />
          <Spacer size={2} />
          <Text variant="titleL" align="center">Check your inbox</Text>
          <Text variant="bodyM" color="textSecondary" align="center">
            We have sent password reset instructions to your email address if it is registered in our system.
          </Text>
        </YStack>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <NavigationHeader title="Forgot Password" />
      
      <YStack gap={4} style={styles.formContainer}>
        <Text variant="displayM">Reset Password</Text>
        <Text variant="bodyM" color="textSecondary">
          Enter your registered email address below, and we'll send you a link to reset your password.
        </Text>
        <Spacer size={2} />

        <Card>
          <YStack gap={4}>
            {serverError ? (
              <Text variant="bodyS" color="danger" style={styles.errorBanner}>
                {serverError}
              </Text>
            ) : null}

            {/* Email Input */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Email Address"
                  placeholder="name@domain.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  disabled={isPending}
                  testID="forgot-email-input"
                  autoFocus
                />
              )}
            />

            <Spacer size={2} />

            <Button
              variant="primary"
              label="Send Reset Link"
              onPress={handleSubmit(onSubmit)}
              loading={isPending}
              disabled={isPending}
              fullWidth
              testID="forgot-submit-btn"
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
