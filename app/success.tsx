import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../src/components/ui';
import { colors, spacing } from '../src/theme';

export default function SuccessScreen() {
  const router = useRouter();
  const { title, message, routeLine, next } = useLocalSearchParams<{
    title: string;
    message: string;
    routeLine?: string;
    next: string;
  }>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.check}>✓</Text>
        <Text style={styles.title}>{title || 'Done!'}</Text>
        {routeLine ? <Text style={styles.route}>{routeLine}</Text> : null}
        <Text style={styles.sub}>{message || ''}</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          label="Continue / आगे"
          onPress={() => router.replace((next as '/home') || '/home')}
        />
        <View style={{ height: 12 }} />
        <PrimaryButton
          label="Home"
          variant="secondary"
          onPress={() => router.replace('/home')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  check: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: colors.success,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 96,
    fontSize: 52,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  route: {
    marginTop: spacing.sm,
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  sub: {
    marginTop: spacing.sm,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: { padding: spacing.lg },
});
