import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError, Ride, RidesApi } from '../../src/api';
import { routeLabel, formatPricePerSeat, formatSeatsLabel } from '../../src/constants';
import { ErrorText, PrimaryButton, Screen, Title } from '../../src/components/ui';
import { RequireAuth } from '../../src/RequireAuth';
import { colors, fonts, spacing } from '../../src/theme';

function rideListCutoffISO(daysBack = 2): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysBack);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MyRidesScreen() {
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [includePast, setIncludePast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const cutoff = useMemo(() => rideListCutoffISO(2), []);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { rides: data } = await RidesApi.mine(includePast);
      setRides(data);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Couldn't load your rides. Check your internet and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [includePast]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const setStatus = async (id: string, status: string) => {
    setBusyId(id);
    setError(null);
    try {
      await RidesApi.updateStatus(id, status);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not update ride.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <RequireAuth>
      <Screen style={{ paddingHorizontal: 0 }}>
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Title>My rides</Title>
          <ErrorText>{error}</ErrorText>
        </View>
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {includePast
                ? 'No rides found.'
                : 'No recent rides. Post a ride or show past rides.'}
            </Text>
          }
          renderItem={({ item }) => {
            const isPast = item.date < cutoff;
            const pendingCount = item.pendingCount ?? 0;
            const bookedCount = item.bookingsCount ?? 0;
            return (
              <View style={[styles.card, isPast && includePast && styles.cardPast]}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/driver/ride-details',
                      params: { rideId: item.id },
                    })
                  }
                >
                  <Text style={styles.dir}>{routeLabel(item.fromCity, item.toCity)}</Text>
                  <Text style={[styles.meta, isPast && includePast && styles.metaPast]}>
                    {item.date} · {item.time}
                    {isPast && includePast ? ' · Past' : ''}
                  </Text>
                  {item.pickupPoint ? (
                    <Text style={styles.meta}>Meeting: {item.pickupPoint}</Text>
                  ) : null}
                  <Text style={styles.meta}>
                    {formatSeatsLabel(item.totalSeats - item.seatsAvailable)} booked ·{' '}
                    {formatSeatsLabel(item.seatsAvailable)} left
                  </Text>
                  <Text style={styles.price}>
                    {formatPricePerSeat(item.pricePerSeat ?? 1)}
                  </Text>
                  <Text style={styles.status}>Status: {item.status}</Text>
                  {pendingCount > 0 ? (
                    <Text style={styles.pendingBadge}>
                      {pendingCount} pending request{pendingCount === 1 ? '' : 's'}
                    </Text>
                  ) : null}
                  {bookedCount > 0 ? (
                    <Text style={styles.meta}>
                      {bookedCount} confirmed rider{bookedCount === 1 ? '' : 's'}
                    </Text>
                  ) : null}
                  <Text style={styles.detailsLink}>View details / विवरण देखें →</Text>
                </Pressable>

                {item.status === 'ACTIVE' || item.status === 'FULL' ? (
                  <View style={styles.row}>
                    <Pressable
                      style={styles.smallBtn}
                      disabled={busyId === item.id}
                      onPress={() => setStatus(item.id, 'FULL')}
                    >
                      <Text style={styles.smallBtnText}>Full</Text>
                    </Pressable>
                    <Pressable
                      style={styles.smallBtn}
                      disabled={busyId === item.id}
                      onPress={() => setStatus(item.id, 'COMPLETED')}
                    >
                      <Text style={styles.smallBtnText}>Completed</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.smallBtn, styles.dangerBtn]}
                      disabled={busyId === item.id}
                      onPress={() => setStatus(item.id, 'CANCELLED')}
                    >
                      <Text style={[styles.smallBtnText, { color: colors.white }]}>
                        Cancelled
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          }}
          ListFooterComponent={
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              <PrimaryButton
                label={
                  includePast
                    ? 'Hide past rides / पिछली राइड छिपाएँ'
                    : 'Show past rides / पिछली राइड देखें'
                }
                variant="secondary"
                onPress={() => setIncludePast((v) => !v)}
              />
              <PrimaryButton label="Refresh" variant="secondary" onPress={load} />
            </View>
          }
        />
      </Screen>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.textMuted, fontSize: 16, fontFamily: fonts.regular },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardPast: { opacity: 0.85 },
  dir: { fontSize: 17, fontFamily: fonts.bold, color: colors.text },
  meta: {
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  metaPast: { color: colors.textMuted },
  price: {
    marginTop: 6,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  status: {
    marginTop: 8,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  pendingBadge: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
  },
  detailsLink: {
    marginTop: 10,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.primary,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  smallBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBtn: { backgroundColor: colors.danger, borderColor: colors.danger },
  smallBtnText: {
    fontFamily: fonts.bold,
    color: colors.text,
    fontSize: 13,
  },
});
