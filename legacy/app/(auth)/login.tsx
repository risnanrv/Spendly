import { useRef } from 'react';
import { StyleSheet, TextInput as RNTextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Screen, Text, Button, YStack, TextInput, PasswordInput, Spacer, Card, NavigationHeader } from '@/components/ui';
import { zodResolver, loginSchema, type LoginInput } from '@/utils/validation';
import { useLogin } from '@/hooks/useAuth';
import { router } from 'expo-router';

/**
 * Login Screen.
 * Renders credential form with keyboard avoidance and next-field focus traversal.
 */
export default function LoginScreen() {
  const passwordRef = useRef<RNTextInput>(null);
  
  const { mutate: login, isPending, error } = useLogin();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginInput) => {
    login(data, {
      onSuccess: () => {
        router.replace('/(app)');
      },
    });
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const serverError = error?.message;

  return (
    <Screen padded={false}>
      <NavigationHeader title="Log In" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <YStack gap={4} style={styles.formContainer}>
            <Text variant="displayM">Welcome Back</Text>
            <Text variant="bodyM" color="textSecondary">
              Sign in with your email and password to access your expenses.
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
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      disabled={isPending}
                      testID="login-email-input"
                      autoFocus
                    />
                  )}
                />

                {/* Password Input */}
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PasswordInput
                      ref={passwordRef}
                      label="Password"
                      placeholder="Enter password"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.password?.message}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit(onSubmit)}
                      disabled={isPending}
                      testID="login-password-input"
                    />
                  )}
                />

                <Button
                  variant="ghost"
                  label="Forgot Password?"
                  onPress={handleForgotPassword}
                  style={styles.forgotBtn}
                />

                <Spacer size={2} />

                <Button
                  variant="primary"
                  label="Log In"
                  onPress={handleSubmit(onSubmit)}
                  loading={isPending}
                  disabled={isPending}
                  fullWidth
                  testID="login-submit-btn"
                />
              </YStack>
            </Card>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  errorBanner: {
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 8,
    marginBottom: 8,
  },
});
