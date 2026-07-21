import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError, Ride, RidesApi } from '../../src/api';
import { routeLabel } from '../../src/constants';
import {
  BottomBar,
  ErrorText,
  PrimaryButton,
  Screen,
  Title,
} from '../../src/components/ui';
import { RequireAuth } from '../../src/RequireAuth';
import { colors, fonts, spacing } from '../../src/theme';

const cacheKey = (fromCity: string, toCity: string, date: string) =>
  `zippycar_rides_${fromCity}_${toCity}_${date}`;

export default function ResultsScreen() {
  const { fromCity, toCity, date } = useLocalSearchParams<{
    fromCity: string;
    toCity: string;
    date: string;
  }>();
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const load = useCallback(async () => {
    if (!fromCity || !toCity || !date) return;
    setLoading(true);
    setError(null);
    setFromCache(false);
    try {
      const { rides: data } = await RidesApi.search(fromCity, toCity, date);
      setRides(data);
      await AsyncStorage.setItem(
        cacheKey(fromCity, toCity, date),
        JSON.stringify(data)
      );
    } catch (e) {
      const cached = await AsyncStorage.getItem(cacheKey(fromCity, toCity, date));
      if (cached) {
        setRides(JSON.parse(cached));
        setFromCache(true);
        setError('Showing last saved list. Check your internet.');
      } else {
        setError(
          e instanceof ApiError
            ? e.message
            : "Couldn't load rides. Check your internet and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [fromCity, toCity, date]);

  useEffect(() => {
    load();
  }, [load]);

  const onBook = async (ride: Ride) => {
    setBookingId(ride.id);
    setError(null);
    try {
      await RidesApi.book(ride.id);
      router.replace({
        pathname: '/rider/requested',
        params: {
          driverName: ride.driver.name || 'Driver',
          pickup: ride.pickupPoint || `${ride.fromCity} → ${ride.toCity}`,
          time: ride.time,
          date: ride.date,
        },
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send request.');
      await load();
    } finally {
      setBookingId(null);
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
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Screen style={{ paddingHorizontal: 0, flex: 1 }}>
          <View style={{ paddingHorizontal: spacing.lg }}>
            <Title>Available rides</Title>
            <Text style={styles.meta}>
              {routeLabel(fromCity || '', toCity || '')} · {date}
              {fromCache ? ' (saved)' : ''}
            </Text>
            <ErrorText>{error}</ErrorText>
          </View>
          <FlatList
            data={rides}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: spacing.lg }}
            ListEmptyComponent={
              <Text style={styles.empty}>No rides for this route yet.</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.name}>{item.driver.name || 'Driver'}</Text>
                <Text style={styles.metaLine}>
                  {item.driver.carModel} · {item.time}
                </Text>
                {item.pickupPoint ? (
                  <Text style={styles.metaLine}>Meeting: {item.pickupPoint}</Text>
                ) : null}
                <Text style={styles.seats}>{item.seatsAvailable} seats left</Text>
                <View style={{ marginTop: 12 }}>
                  <PrimaryButton
                    label="Request Seat / सीट माँगें"
                    loading={bookingId === item.id}
                    disabled={!!bookingId}
                    onPress={() => onBook(item)}
                  />
                </View>
              </View>
            )}
          />
        </Screen>
        <BottomBar>
          <PrimaryButton label="Refresh" variant="secondary" onPress={load} />
        </BottomBar>
      </View>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  meta: {
    color: colors.textMuted,
    marginBottom: 8,
    fontFamily: fonts.regular,
  },
  empty: { color: colors.textMuted, fontSize: 16, fontFamily: fonts.regular },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  metaLine: {
    color: colors.textMuted,
    marginTop: 4,
    fontFamily: fonts.regular,
  },
  seats: {
    marginTop: 8,
    color: colors.primary,
    fontFamily: fonts.bold,
  },
});
