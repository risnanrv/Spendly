import React from 'react';
import { TextInput as RNTextInput } from 'react-native';
import { Search } from 'lucide-react-native';
import { TextInput, type TextInputProps } from './TextInput';
import { Icon } from './Icon';

interface SearchInputProps extends Omit<TextInputProps, 'prefix'> {}

export const SearchInput = React.forwardRef<RNTextInput, SearchInputProps>(
  (props, ref) => {
    return (
      <TextInput
        ref={ref}
        prefix={<Icon name={Search} size="sm" color="textSecondary" />}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        {...props}
      />
    );
  },
);

SearchInput.displayName = 'SearchInput';
