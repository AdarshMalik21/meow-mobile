import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError, Booking, BookingsApi } from '../../src/api';
import { routeLabel } from '../../src/constants';
import { ErrorText, PrimaryButton, Screen, Title } from '../../src/components/ui';
import { isRideDateTimePast } from '../../src/dates';
import { RequireAuth } from '../../src/RequireAuth';
import { colors, fonts, spacing } from '../../src/theme';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Waiting for driver',
  BOOKED: 'Confirmed',
  REJECTED: 'Declined',
  CANCELLED: 'Cancelled',
};

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { bookings: data } = await BookingsApi.mine();
      setBookings(data);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Couldn't load bookings. Check your internet and try again."
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

  const onCancel = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await BookingsApi.cancel(id);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not cancel booking.');
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
          <Title>My bookings</Title>
          <ErrorText>{error}</ErrorText>
        </View>
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg }}
          ListEmptyComponent={
            <Text style={styles.empty}>No bookings yet.</Text>
          }
          renderItem={({ item }) => {
            const past = isRideDateTimePast(item.ride.date, item.ride.time);
            return (
              <View style={styles.card}>
                <Text style={styles.name}>
                  {item.ride.driver.name || 'Driver'}
                </Text>
                <Text style={styles.meta}>
                  {routeLabel(item.ride.fromCity, item.ride.toCity)}
                </Text>
                <Text style={styles.meta}>
                  {item.ride.date} · {item.ride.time}
                </Text>
                {item.ride.pickupPoint ? (
                  <Text style={styles.meta}>Meeting: {item.ride.pickupPoint}</Text>
                ) : null}
                {past ? (
                  <Text style={styles.unavailable}>
                    Unavailable — ride time has passed
                  </Text>
                ) : (
                  <>
                    <Text
                      style={[
                        styles.status,
                        item.status === 'BOOKED' && { color: colors.success },
                        item.status === 'PENDING' && { color: colors.primary },
                      ]}
                    >
                      {STATUS_LABEL[item.status] || item.status}
                    </Text>
                    {item.status === 'BOOKED' && item.ride.driver.phone ? (
                      <Text style={styles.phone}>
                        Phone: {item.ride.driver.phone}
                      </Text>
                    ) : null}
                    {item.status === 'BOOKED' ? (
                      <View style={{ marginTop: 12 }}>
                        <PrimaryButton
                          label="Call details"
                          variant="secondary"
                          onPress={() =>
                            router.push({
                              pathname: '/rider/booked',
                              params: {
                                driverName: item.ride.driver.name || 'Driver',
                                driverPhone: item.ride.driver.phone || '',
                                pickup: item.ride.pickupPoint,
                                time: item.ride.time,
                                date: item.ride.date,
                                carModel: item.ride.driver.carModel,
                                carNumber: item.ride.driver.carNumber || '',
                              },
                            })
                          }
                        />
                        <View style={{ height: 8 }} />
                        <PrimaryButton
                          label="Cancel Booking / बुकिंग रद्द करें"
                          variant="danger"
                          loading={busyId === item.id}
                          onPress={() => onCancel(item.id)}
                        />
                      </View>
                    ) : null}
                    {item.status === 'PENDING' ? (
                      <View style={{ marginTop: 12 }}>
                        <PrimaryButton
                          label="Cancel Request / अनुरोध रद्द करें"
                          variant="danger"
                          loading={busyId === item.id}
                          onPress={() => onCancel(item.id)}
                        />
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            );
          }}
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
  name: { fontSize: 17, fontFamily: fonts.bold, color: colors.text },
  meta: { color: colors.textMuted, marginTop: 4, fontFamily: fonts.regular },
  phone: {
    color: colors.primary,
    marginTop: 8,
    fontFamily: fonts.bold,
  },
  status: { marginTop: 8, fontFamily: fonts.bold, color: colors.text },
  unavailable: {
    marginTop: 8,
    fontFamily: fonts.medium,
    color: colors.textMuted,
    fontSize: 15,
  },
});
