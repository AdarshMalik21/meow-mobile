import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError, BookingsApi, Ride, RidesApi } from '../../src/api';
import { routeLabel } from '../../src/constants';
import { ErrorText, PrimaryButton, Screen, Title } from '../../src/components/ui';
import { RequireAuth } from '../../src/RequireAuth';
import { colors, fonts, spacing } from '../../src/theme';

export default function MyRidesScreen() {
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { rides: data } = await RidesApi.mine();
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
  }, []);

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

  const onApprove = async (requestId: string) => {
    setBusyId(requestId);
    setError(null);
    try {
      await BookingsApi.approve(requestId);
      router.push({
        pathname: '/success',
        params: {
          title: 'Request Allowed!',
          message: 'Seat is confirmed for the rider. They can now see your phone.',
          next: '/driver/my-rides',
        },
      });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not allow request.');
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async (requestId: string) => {
    setBusyId(requestId);
    setError(null);
    try {
      await BookingsApi.reject(requestId);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not decline request.');
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
            <Text style={styles.empty}>No rides yet. Post your first ride.</Text>
          }
          renderItem={({ item }) => {
            const pending = (item.requests || []).filter((r) => r.status === 'PENDING');
            const booked = (item.requests || []).filter((r) => r.status === 'BOOKED');
            return (
              <View style={styles.card}>
                <Text style={styles.dir}>
                  {routeLabel(item.fromCity, item.toCity)}
                </Text>
                <Text style={styles.meta}>
                  {item.date} · {item.time}
                </Text>
                {item.pickupPoint ? (
                  <Text style={styles.meta}>Meeting: {item.pickupPoint}</Text>
                ) : null}
                <Text style={styles.meta}>
                  Seats left: {item.seatsAvailable}/{item.totalSeats}
                </Text>
                <Text style={styles.status}>Status: {item.status}</Text>

                {pending.length > 0 ? (
                  <View style={styles.requestsBox}>
                    <Text style={styles.requestsTitle}>
                      Seat requests ({pending.length})
                    </Text>
                    {pending.map((req) => (
                      <View key={req.id} style={styles.requestRow}>
                        <Text style={styles.requestName}>
                          {req.rider.name || 'Rider'} · {req.rider.phone}
                        </Text>
                        <View style={styles.row}>
                          <Pressable
                            style={[styles.smallBtn, styles.allowBtn]}
                            disabled={busyId === req.id}
                            onPress={() => onApprove(req.id)}
                          >
                            <Text style={[styles.smallBtnText, { color: colors.white }]}>
                              Allow
                            </Text>
                          </Pressable>
                          <Pressable
                            style={[styles.smallBtn, styles.dangerBtn]}
                            disabled={busyId === req.id}
                            onPress={() => onReject(req.id)}
                          >
                            <Text style={[styles.smallBtnText, { color: colors.white }]}>
                              Decline
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}

                {booked.length > 0 ? (
                  <Text style={styles.meta}>
                    Confirmed riders:{' '}
                    {booked.map((b) => b.rider.name || b.rider.phone).join(', ')}
                  </Text>
                ) : null}

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
            <View style={{ marginTop: spacing.md }}>
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
  dir: { fontSize: 17, fontFamily: fonts.bold, color: colors.text },
  meta: {
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  status: {
    marginTop: 8,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  requestsBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  requestsTitle: {
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  requestRow: { marginBottom: 12 },
  requestName: {
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 },
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
  allowBtn: { backgroundColor: colors.success, borderColor: colors.success },
  dangerBtn: { backgroundColor: colors.danger, borderColor: colors.danger },
  smallBtnText: {
    fontFamily: fonts.bold,
    color: colors.text,
    fontSize: 13,
  },
});
