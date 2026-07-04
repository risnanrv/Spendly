import React, { useState } from 'react';
import { TextInput as RNTextInput } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { TextInput, type TextInputProps } from './TextInput';
import { IconButton } from './IconButton';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {}

/**
 * PasswordInput component featuring an integrated eye toggler for password obscuring.
 */
export const PasswordInput = React.forwardRef<RNTextInput, PasswordInputProps>(
  ({ testID, ...props }, ref) => {
    const [isSecure, setIsSecure] = useState(true);

    const toggleSecure = () => {
      setIsSecure((prev) => !prev);
    };

    return (
      <TextInput
        ref={ref}
        testID={testID}
        secureTextEntry={isSecure}
        autoCapitalize="none"
        autoCorrect={false}
        suffix={
          <IconButton
            icon={isSecure ? Eye : EyeOff}
            onPress={toggleSecure}
            size={20}
            color="textSecondary"
            accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
          />
        }
        {...props}
      />
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
