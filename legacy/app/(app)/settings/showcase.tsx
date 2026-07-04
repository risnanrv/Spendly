import { useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  Text,
  Button,
  IconButton,
  SectionCard,
  ScrollableScreen,
  Spacer,
  Divider,
  XStack,
  YStack,
  Grid,
  Center,
  Surface,
  AppLogo,
  Avatar,
  Badge,
  Chip,
  TextInput,
  PasswordInput,
  SearchInput,
  TextArea,
  Spinner,
  Skeleton,
  EmptyState,
  ErrorState,
  NavigationHeader,
  FadeIn,
  SlideIn,
  ScaleIn,
  FloatingActionButton,
} from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/stores/theme.store';
import {
  Info,
  Plus,
} from 'lucide-react-native';

export default function ShowcaseScreen() {
  const theme = useTheme();
  const { preference, setPreference } = useThemeStore();

  // Motion example triggers
  const [motionTrigger, setMotionTrigger] = useState(0);

  const triggerMotion = () => {
    setMotionTrigger((prev) => prev + 1);
  };

  return (
    <ScrollableScreen padded={false}>
      <NavigationHeader title="Design System Showcase" />

      <YStack gap={6} style={styles.content}>
        {/* Theme Settings Selector */}
        <SectionCard title="Theme Preference">
          <XStack gap={2} wrap>
            <Chip
              label="System Default"
              selected={preference === 'system'}
              onPress={() => setPreference('system')}
            />
            <Chip
              label="Light Mode"
              selected={preference === 'light'}
              onPress={() => setPreference('light')}
            />
            <Chip
              label="Dark Mode"
              selected={preference === 'dark'}
              onPress={() => setPreference('dark')}
            />
          </XStack>
        </SectionCard>

        {/* 1. App Logo & Branding */}
        <SectionCard title="Branding">
          <XStack gap={4} align="center">
            <AppLogo size="sm" />
            <AppLogo size="md" />
            <AppLogo size="lg" />
          </XStack>
        </SectionCard>

        {/* 2. Color Palette */}
        <SectionCard title="Color Palette">
          <Text variant="titleS" style={styles.subsectionTitle}>
            Brand Indigo
          </Text>
          <XStack gap={2} wrap style={styles.colorRow}>
            {['brandPrimary', 'brandDark', 'brandLight'].map((c) => (
              <YStack align="center" gap={1} key={c} style={styles.colorBlockWrapper}>
                <Surface
                  bg={c as any}
                  radius="md"
                  style={[styles.colorBlock, { borderColor: theme.colors.borderDefault, borderWidth: 1 }]}
                />
                <Text variant="labelS">{c}</Text>
              </YStack>
            ))}
          </XStack>

          <Text variant="titleS" style={styles.subsectionTitle}>
            Semantic Statuses
          </Text>
          <XStack gap={2} wrap style={styles.colorRow}>
            {['success', 'warning', 'danger', 'info'].map((c) => (
              <YStack align="center" gap={1} key={c} style={styles.colorBlockWrapper}>
                <Surface bg={c as any} radius="md" style={styles.colorBlock} />
                <Text variant="labelS">{c}</Text>
              </YStack>
            ))}
          </XStack>

          <Text variant="titleS" style={styles.subsectionTitle}>
            Chart Palette
          </Text>
          <XStack gap={2} wrap style={styles.colorRow}>
            {['chart1', 'chart2', 'chart3', 'chart4', 'chart5'].map((c) => (
              <YStack align="center" gap={1} key={c} style={styles.colorBlockWrapper}>
                <Surface bg={c as any} radius="md" style={styles.colorBlock} />
                <Text variant="labelS">{c}</Text>
              </YStack>
            ))}
          </XStack>
        </SectionCard>

        {/* 3. Typography */}
        <SectionCard title="Typography System">
          <YStack gap={4}>
            <Text variant="displayXl">Display XL (48px)</Text>
            <Text variant="displayL">Display L (36px)</Text>
            <Text variant="displayM">Display M (28px)</Text>
            <Text variant="titleL">Title L (22px)</Text>
            <Text variant="titleM">Title M (18px)</Text>
            <Text variant="titleS">Title S (16px)</Text>
            <Text variant="bodyL">Body L (16px) — Premium regular body text</Text>
            <Text variant="bodyM">Body M (14px) — Secondary reading copy</Text>
            <Text variant="bodyS">Body S (13px) — Minor descriptive info</Text>
            <Text variant="labelL">Label L (14px) — Input / Button Labels</Text>
            <Text variant="labelM">Label M (12px) — Tag & Chip Labels</Text>
            <Text variant="labelS">Label S (11px) — Meta tags & secondary labels</Text>
          </YStack>
        </SectionCard>

        {/* 4. Layout Primitives */}
        <SectionCard title="Layout Primitives">
          <Text variant="titleS" style={styles.subsectionTitle}>
            Grid & Center Layouts
          </Text>
          <Grid cols={2} gap={3}>
            <Surface bg="bgSecondary" padding radius="md">
              <Center>
                <Text variant="bodyM">Grid Item 1</Text>
              </Center>
            </Surface>
            <Surface bg="bgSecondary" padding radius="md">
              <Center>
                <Text variant="bodyM">Grid Item 2</Text>
              </Center>
            </Surface>
          </Grid>

          <Spacer size={3} />

          <Text variant="titleS" style={styles.subsectionTitle}>
            Flex Stack layouts
          </Text>
          <XStack justify="space-between" align="center" style={styles.layoutDemoRow}>
            <Text variant="bodyS">XStack Align Center</Text>
            <Badge label="Badge" variant="info" />
          </XStack>
        </SectionCard>

        {/* 5. Buttons */}
        <SectionCard title="Buttons">
          <YStack gap={3}>
            <XStack gap={2}>
              <Button label="Primary" variant="primary" onPress={() => {}} />
              <Button label="Secondary" variant="secondary" onPress={() => {}} />
            </XStack>
            <XStack gap={2}>
              <Button label="Outline" variant="outline" onPress={() => {}} />
              <Button label="Ghost" variant="ghost" onPress={() => {}} />
            </XStack>
            <Button label="Destructive" variant="destructive" onPress={() => {}} />
            <Button label="Loading State" variant="primary" loading onPress={() => {}} />
            <Button label="Disabled" variant="primary" disabled onPress={() => {}} />

            <Divider />

            <Text variant="titleS" style={styles.subsectionTitle}>
              Icon Buttons & FAB
            </Text>
            <XStack gap={3}>
              <IconButton icon={Plus} onPress={() => {}} accessibilityLabel="Add" variant="filled" />
              <IconButton icon={Info} onPress={() => {}} accessibilityLabel="Info" variant="ghost" />
            </XStack>
          </YStack>
        </SectionCard>

        {/* 6. Inputs */}
        <SectionCard title="Inputs">
          <YStack gap={4}>
            <TextInput label="Base Text Input" placeholder="Type here..." />
            <TextInput label="Error Text Input" placeholder="Type here..." error="This field is required" />
            <TextInput label="Input with Prefix/Suffix" prefix="₹" suffix="Paisa" placeholder="0.00" />
            <PasswordInput label="Secure Password Input" placeholder="••••••••" />
            <SearchInput label="Search Input" placeholder="Search transactions..." />
            <TextArea label="TextArea (Multiline)" placeholder="Add notes here..." numberOfLines={3} />
          </YStack>
        </SectionCard>

        {/* 7. Avatars & Badges */}
        <SectionCard title="Avatars & Chips">
          <XStack gap={3} align="center">
            <Avatar name="John Doe" size="sm" />
            <Avatar name="Spendly Team" size="md" />
            <Avatar name="Architect Lead" size="lg" />
            <Avatar name="Revolut Inspired" size="xl" />
          </XStack>
          <Spacer size={4} />
          <XStack gap={2} wrap>
            <Badge label="Success Badge" variant="success" />
            <Badge label="Warning Badge" variant="warning" />
            <Badge label="Danger Badge" variant="danger" />
            <Badge label="Neutral Badge" variant="neutral" />
          </XStack>
        </SectionCard>

        {/* 8. Progress & Loading states */}
        <SectionCard title="Loaders & States">
          <XStack gap={4} align="center">
            <Spinner size="md" />
            <Text variant="bodyM">Active spinner</Text>
          </XStack>
          <Spacer size={4} />
          <YStack gap={2}>
            <Text variant="labelM">Skeleton Loader (Pulse animation)</Text>
            <Skeleton height={20} width="70%" />
            <Skeleton height={40} width="100%" radius="md" />
          </YStack>
        </SectionCard>

        {/* 9. Empty & Error States */}
        <SectionCard title="Feedback States">
          <Surface bg="bgSecondary" radius="lg" style={styles.stateWrapper}>
            <EmptyState
              icon={Info}
              title="No transactions yet"
              description="Your transactions will appear here once you make your first expense."
              actionLabel="Add Expense"
              onActionPress={() => {}}
            />
          </Surface>
          <Spacer size={4} />
          <Surface bg="bgSecondary" radius="lg" style={styles.stateWrapper}>
            <ErrorState
              message="Failed to load transaction data. Check your network link."
              onRetry={() => {}}
            />
          </Surface>
        </SectionCard>

        {/* 10. Motion Primitives */}
        <SectionCard title="Motion System Examples">
          <Button label="Animate Components" onPress={triggerMotion} variant="outline" />
          <Spacer size={4} />

          {/* Key triggers animations to remount and replay */}
          <YStack gap={3} key={motionTrigger}>
            <FadeIn>
              <Surface bg="bgSecondary" padding radius="md">
                <Text variant="bodyM">FadeIn entry transition</Text>
              </Surface>
            </FadeIn>

            <SlideIn direction="up">
              <Surface bg="bgSecondary" padding radius="md">
                <Text variant="bodyM">SlideIn (Up) entry transition</Text>
              </Surface>
            </SlideIn>

            <ScaleIn>
              <Surface bg="bgSecondary" padding radius="md">
                <Text variant="bodyM">ScaleIn spring transition</Text>
              </Surface>
            </ScaleIn>
          </YStack>
        </SectionCard>
      </YStack>

      {/* FAB Preview anchor */}
      <FloatingActionButton icon={Plus} onPress={() => {}} accessibilityLabel="Add" />
    </ScrollableScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  subsectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  colorRow: {
    marginVertical: 4,
  },
  colorBlockWrapper: {
    width: 70,
  },
  colorBlock: {
    width: 60,
    height: 60,
    marginBottom: 4,
  },
  layoutDemoRow: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E3F3',
    borderRadius: 8,
  },
  stateWrapper: {
    borderWidth: 1,
    borderColor: '#E5E3F3',
  },
});
