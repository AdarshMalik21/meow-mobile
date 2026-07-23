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

const CACHE_TTL_MS = 5 * 60 * 1000;

const cacheKey = (fromCity: string, toCity: string, date: string) =>
  `zippycar_rides_${fromCity}_${toCity}_${date}`;

type CachedRides = {
  savedAt: number;
  rides: Ride[];
};

async function readCache(key: string): Promise<Ride[] | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedRides | Ride[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return parsed.rides;
  } catch {
    await AsyncStorage.removeItem(key);
    return null;
  }
}

async function writeCache(key: string, rides: Ride[]) {
  const payload: CachedRides = { savedAt: Date.now(), rides };
  await AsyncStorage.setItem(key, JSON.stringify(payload));
}

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
    const key = cacheKey(fromCity, toCity, date);
    setLoading(true);
    setError(null);
    setFromCache(false);
    try {
      const { rides: data } = await RidesApi.search(fromCity, toCity, date);
      setRides(data);
      await writeCache(key, data);
    } catch (e) {
      const isClientError = e instanceof ApiError && e.status >= 400 && e.status < 500;
      if (isClientError) {
        setRides([]);
        setError(e.message);
        await AsyncStorage.removeItem(key);
      } else {
        const cached = await readCache(key);
        if (cached) {
          setRides(cached);
          setFromCache(true);
          setError('Showing last saved list. Check your internet.');
        } else {
          setRides([]);
          setError(
            e instanceof ApiError
              ? e.message
              : "Couldn't load rides. Check your internet and try again."
          );
        }
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
      await RidesApi.book(ride.id, {
        riderFromCity: fromCity || '',
        riderToCity: toCity || '',
      });
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
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No rides found</Text>
                <Text style={styles.emptyLine}>From: {fromCity}</Text>
                <Text style={styles.emptyLine}>To: {toCity}</Text>
                <Text style={styles.emptyLine}>Date: {date}</Text>
                <Text style={styles.emptyHint}>
                  Ask the driver to select your city as a pickup stop and use the
                  same destination and date. Delhi and New Delhi count as the same
                  city.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.name}>{item.driver.name || 'Driver'}</Text>
                {item.matchType === 'viaStop' ? (
                  <Text style={styles.viaBadge}>
                    Via your city · Driver route: {item.fromCity} → {item.toCity}
                  </Text>
                ) : null}
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
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyLine: {
    color: colors.text,
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  emptyHint: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    marginTop: spacing.md,
    lineHeight: 20,
  },
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
  viaBadge: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  seats: {
    marginTop: 8,
    color: colors.primary,
    fontFamily: fonts.bold,
  },
});
