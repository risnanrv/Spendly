import { useTheme } from '@/hooks/useTheme';
import { XStack } from './XStack';
import { Text } from './Text';
import { Surface } from './Surface';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export const AppLogo = ({ size = 'md' }: AppLogoProps) => {
  const theme = useTheme();

  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { emblem: 20, font: 'titleS' as const };
      case 'lg':
        return { emblem: 36, font: 'displayL' as const };
      case 'md':
      default:
        return { emblem: 28, font: 'titleL' as const };
    }
  };

  const dims = getDimensions();

  return (
    <XStack gap={2}>
      <Surface
        bg="brandPrimary"
        radius="sm"
        style={{
          width: dims.emblem,
          height: dims.emblem,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          variant="labelM"
          color="textInverse"
          style={{
            fontFamily: theme.typography.fontFamily.extraBold,
            fontSize: dims.emblem * 0.55,
            lineHeight: dims.emblem * 0.55,
          }}
        >
          S
        </Text>
      </Surface>
      <Text variant={dims.font} color="textPrimary" style={{ letterSpacing: -0.5 }}>
        Spendly
      </Text>
    </XStack>
  );
};
