import { Image, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Surface } from './Surface';
import { Text } from './Text';
import type { AvatarSizeToken } from '@/theme/sizes';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSizeToken;
}

export const Avatar = ({ source, name = 'User', size = 'md' }: AvatarProps) => {
  const theme = useTheme();
  const dimension = theme.sizes.avatar[size];

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || '?';
    const first = parts[0]?.charAt(0) || '';
    const last = parts[parts.length - 1]?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  const initials = getInitials(name);

  // Define typography mapping based on avatar size
  const getFontVariant = () => {
    switch (size) {
      case 'sm': return 'labelS';
      case 'lg': return 'titleM';
      case 'xl': return 'displayM';
      case 'md':
      default: return 'labelL';
    }
  };

  return (
    <Surface
      bg="bgSecondary"
      radius="full"
      borderWidth="thin"
      borderColor="borderSubtle"
      style={{
        width: dimension,
        height: dimension,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={[styles.image, { width: dimension, height: dimension }]}
        />
      ) : (
        <Text variant={getFontVariant()} color="textBrand">
          {initials}
        </Text>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
});
