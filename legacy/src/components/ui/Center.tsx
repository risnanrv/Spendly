import React from 'react';
import { View, type ViewStyle, type ViewProps, type StyleProp } from 'react-native';

interface CenterProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Center = ({ children, style, ...rest }: CenterProps) => {
  const containerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <View style={[containerStyle, style]} {...rest}>
      {children}
    </View>
  );
};
