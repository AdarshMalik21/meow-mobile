import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError, BookingsApi, Ride, RidesApi } from '../../src/api';
import { RiderBookingRow } from '../../src/components/RiderBookingRow';
import { ErrorText, PrimaryButton, Screen, Title } from '../../src/components/ui';
import { formatPricePerSeat, formatSeatsLabel, routeLabel } from '../../src/constants';
import { RequireAuth } from '../../src/RequireAuth';
import { colors, fonts, spacing } from '../../src/theme';

export default function RideDetailsScreen() {
  const router = useRouter();
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!rideId) return;
    setError(null);
    setLoading(true);
    try {
      const { ride: data } = await RidesApi.getById(rideId);
      setRide(data);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Couldn't load ride details. Check your internet and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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
          next: `/driver/ride-details?rideId=${rideId}`,
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

  if (!ride) {
    return (
      <RequireAuth>
        <Screen>
          <ErrorText>{error || 'Ride not found.'}</ErrorText>
          <PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} />
        </Screen>
      </RequireAuth>
    );
  }

  const seatsBooked = ride.seatsBooked ?? ride.totalSeats - ride.seatsAvailable;
  const requests = ride.requests || [];

  return (
    <RequireAuth>
      <Screen style={{ paddingHorizontal: 0 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 32 }}>
          <Title>{routeLabel(ride.fromCity, ride.toCity)}</Title>
          <Text style={styles.meta}>
            {ride.date} · {ride.time}
          </Text>
          <Text style={styles.meta}>{formatPricePerSeat(ride.pricePerSeat ?? 1)}</Text>
          {ride.pickupPoint ? (
            <Text style={styles.meta}>Meeting: {ride.pickupPoint}</Text>
          ) : null}
          {ride.driver.carModel ? (
            <Text style={styles.meta}>
              Car: {ride.driver.carModel}
              {ride.driver.carNumber ? ` · ${ride.driver.carNumber}` : ''}
            </Text>
          ) : null}

          <View style={styles.summaryBox}>
            <Text style={styles.summary}>
              {formatSeatsLabel(seatsBooked)} booked of {ride.totalSeats} ·{' '}
              {formatSeatsLabel(ride.seatsAvailable)} left
            </Text>
            <Text style={styles.statusLine}>Ride status: {ride.status}</Text>
          </View>

          <ErrorText>{error}</ErrorText>

          <Text style={styles.sectionTitle}>Riders / सवार</Text>
          {requests.length === 0 ? (
            <Text style={styles.empty}>No booking requests yet.</Text>
          ) : (
            requests.map((req) => (
              <RiderBookingRow
                key={req.id}
                request={req}
                driverFrom={ride.fromCity}
                driverTo={ride.toCity}
                busyId={busyId}
                showActions
                onApprove={onApprove}
                onReject={onReject}
              />
            ))
          )}

          <PrimaryButton label="Refresh" variant="secondary" onPress={load} />
        </ScrollView>
      </Screen>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  meta: {
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  summaryBox: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  summary: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  statusLine: {
    marginTop: 6,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.primary,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  empty: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
});
