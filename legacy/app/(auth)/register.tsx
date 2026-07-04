import { useRef } from 'react';
import { StyleSheet, TextInput as RNTextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Screen, Text, Button, YStack, TextInput, PasswordInput, Spacer, Card, NavigationHeader } from '@/components/ui';
import { zodResolver, registerSchema, type RegisterInput } from '@/utils/validation';
import { useRegister } from '@/hooks/useAuth';
import { router } from 'expo-router';

/**
 * Register / Sign Up Screen.
 * Renders onboarding details form with keyboard avoiding helpers.
 */
export default function RegisterScreen() {
  const emailRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);

  const { mutate: register, isPending, error } = useRegister();

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: RegisterInput) => {
    register(data, {
      onSuccess: () => {
        router.replace('/(app)');
      },
    });
  };

  const serverError = error?.message;

  return (
    <Screen padded={false}>
      <NavigationHeader title="Register" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <YStack gap={4} style={styles.formContainer}>
            <Text variant="displayM">Create Account</Text>
            <Text variant="bodyM" color="textSecondary">
              Sign up today and get total visibility over your spending.
            </Text>
            <Spacer size={2} />

            <Card>
              <YStack gap={4}>
                {serverError ? (
                  <Text variant="bodyS" color="danger" style={styles.errorBanner}>
                    {serverError}
                  </Text>
                ) : null}

                {/* Name Input */}
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Full Name"
                      placeholder="Enter your name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.name?.message}
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current?.focus()}
                      disabled={isPending}
                      testID="register-name-input"
                      autoFocus
                    />
                  )}
                />

                {/* Email Input */}
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      ref={emailRef}
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
                      testID="register-email-input"
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
                      placeholder="Create security password"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.password?.message}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit(onSubmit)}
                      disabled={isPending}
                      testID="register-password-input"
                    />
                  )}
                />

                <Spacer size={2} />

                <Button
                  variant="primary"
                  label="Sign Up"
                  onPress={handleSubmit(onSubmit)}
                  loading={isPending}
                  disabled={isPending}
                  fullWidth
                  testID="register-submit-btn"
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
  errorBanner: {
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 8,
    marginBottom: 8,
  },
});
