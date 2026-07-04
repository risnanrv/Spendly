import { forwardRef } from 'react';
import { TextInput as RNTextInput, StyleSheet } from 'react-native';
import { TextInput, type TextInputProps } from './TextInput';

interface TextAreaProps extends Omit<TextInputProps, 'multiline' | 'numberOfLines'> {
  numberOfLines?: number;
}

export const TextArea = forwardRef<RNTextInput, TextAreaProps>(
  ({ numberOfLines = 4, containerStyle, inputStyle, ...rest }, ref) => {
    return (
      <TextInput
        ref={ref}
        multiline
        numberOfLines={numberOfLines}
        containerStyle={containerStyle}
        inputStyle={[
          styles.textArea,
          {
            height: undefined, // override the fixed TextInput height
            minHeight: numberOfLines * 20 + 20,
          },
          inputStyle,
        ]}
        {...rest}
      />
    );
  },
);

TextArea.displayName = 'TextArea';

const styles = StyleSheet.create({
  textArea: {
    textAlignVertical: 'top',
    paddingVertical: 12,
  },
});
