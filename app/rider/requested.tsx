import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';

export default function RequestedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    pickup: string;
    time: string;
    date: string;
    driverName: string;
  }>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.check}>✓</Text>
        <Text style={styles.title}>Request Sent!</Text>
        <Text style={styles.sub}>
          Waiting for the driver to Allow your seat. You will see their phone
          only after they confirm.
        </Text>
        <View style={styles.card}>
          <Text style={styles.label}>Driver</Text>
          <Text style={styles.value}>{params.driverName || 'Driver'}</Text>
          <Text style={styles.label}>Pickup</Text>
          <Text style={styles.value}>{params.pickup}</Text>
          <Text style={styles.label}>When</Text>
          <Text style={styles.value}>
            {params.date} · {params.time}
          </Text>
          <Text style={styles.waiting}>Status: Waiting for driver</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          label="My Bookings / मेरी बुकिंग"
          onPress={() => router.replace('/rider/my-bookings')}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  check: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 88,
    fontSize: 48,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  sub: {
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: spacing.lg,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 12,
    fontWeight: '600',
  },
  value: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 2 },
  waiting: {
    marginTop: 16,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  actions: { padding: spacing.lg },
});
