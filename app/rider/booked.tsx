import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatBookingTotal, formatPricePerSeat } from '../../src/constants';
import { PrimaryButton } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';

export default function BookedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    driverName: string;
    driverPhone: string;
    pickup: string;
    time: string;
    date: string;
    carModel: string;
    carNumber: string;
    pricePerSeat?: string;
    seatsRequested?: string;
  }>();

  const seats = parseInt(params.seatsRequested || '1', 10) || 1;
  const price = parseInt(params.pricePerSeat || '1', 10) || 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.check}>✓</Text>
        <Text style={styles.title}>Ride Booked!</Text>
        <Text style={styles.sub}>Call the driver and reach on time.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Driver</Text>
          <Text style={styles.value}>{params.driverName}</Text>
          <Text style={styles.label}>Phone</Text>
          <Text
            style={[styles.value, styles.link]}
            onPress={() =>
              params.driverPhone && Linking.openURL(`tel:${params.driverPhone}`)
            }
          >
            {params.driverPhone || '—'}
          </Text>
          <Text style={styles.label}>Car</Text>
          <Text style={styles.value}>
            {params.carModel}
            {params.carNumber ? ` · ${params.carNumber}` : ''}
          </Text>
          <Text style={styles.label}>Pickup</Text>
          <Text style={styles.value}>{params.pickup}</Text>
          <Text style={styles.label}>When</Text>
          <Text style={styles.value}>
            {params.date} · {params.time}
          </Text>
          <Text style={styles.label}>Fare</Text>
          <Text style={styles.value}>{formatPricePerSeat(price)}</Text>
          <Text style={styles.value}>{formatBookingTotal(seats, price)}</Text>
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
    backgroundColor: colors.success,
    color: colors.white,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 88,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  sub: {
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: spacing.lg,
    fontSize: 16,
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
  link: { color: colors.primary },
  actions: { padding: spacing.lg },
});
