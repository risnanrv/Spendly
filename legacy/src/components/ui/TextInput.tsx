import React from 'react';
import {
  TextInput as RNTextInput,
  View,
  StyleSheet,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Text } from './Text';

/**
 * Props for the TextInput component.
 */
export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  /** Optional top header label text */
  label?: string | undefined;
  /** Error message to display under the input */
  error?: string | undefined;
  /** Element prefix (e.g. ₹ symbol or custom leading icon) */
  prefix?: React.ReactNode | undefined;
  /** Element suffix (e.g. password visibility toggler or trailing tag) */
  suffix?: React.ReactNode | undefined;
  /** Container custom style */
  containerStyle?: StyleProp<ViewStyle> | undefined;
  /** Inner TextInput node custom style */
  inputStyle?: StyleProp<TextStyle> | undefined;
  /** Automation testing identifier */
  testID?: string | undefined;
  /** Disable the text input */
  disabled?: boolean | undefined;
}

/**
 * TextInput component standardizing layout, labels, prefixes, suffixes, error states, and strict design tokens.
 */
export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  ({ label, error, prefix, suffix, containerStyle, inputStyle, testID, disabled, ...rest }, ref) => {
    const theme = useTheme();
    const hasError = Boolean(error);

    return (
      <View style={[styles.wrapper, containerStyle]}>
        {label ? (
          <Text variant="labelL" color="textSecondary" style={styles.label}>
            {label}
          </Text>
        ) : null}

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.colors.bgSecondary,
              borderColor: hasError
                ? theme.colors.danger
                : theme.colors.borderDefault,
              borderRadius: theme.radius.sm,
              height: theme.sizes.input.height,
              opacity: disabled ? theme.motion.stateOpacity.disabled : 1,
            },
          ]}
        >
          {prefix ? (
            typeof prefix === 'string' ? (
              <Text variant="bodyM" color="textSecondary" style={styles.affix}>
                {prefix}
              </Text>
            ) : (
              prefix
            )
          ) : null}

          <RNTextInput
            ref={ref}
            testID={testID}
            style={[
              styles.input,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.regular,
                fontSize: theme.typography.fontSize['body-l'],
                flex: 1,
              },
              inputStyle,
            ]}
            placeholderTextColor={theme.colors.textTertiary}
            accessibilityLabel={label}
            editable={!disabled}
            {...rest}
          />

          {suffix ? (
            typeof suffix === 'string' ? (
              <Text variant="bodyM" color="textSecondary" style={styles.affix}>
                {suffix}
              </Text>
            ) : (
              suffix
            )
          ) : null}
        </View>

        {hasError ? (
          <Text variant="labelM" color="danger" style={styles.errorText}>
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

TextInput.displayName = 'TextInput';

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
  },
  label: {
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 8,
  },
  input: {
    includeFontPadding: false,
  },
  affix: {
    flexShrink: 0,
  },
  errorText: {
    marginTop: 4,
  },
});
