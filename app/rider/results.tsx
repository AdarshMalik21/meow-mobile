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
import {
  formatBookingTotal,
  formatPricePerSeat,
  routeLabel,
} from '../../src/constants';
import {
  BottomBar,
  ChoiceChip,
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
  const [seatCounts, setSeatCounts] = useState<Record<string, number>>({});

  const getSeatCount = (ride: Ride) => seatCounts[ride.id] ?? 1;

  const setSeatCount = (rideId: string, count: number) => {
    setSeatCounts((prev) => ({ ...prev, [rideId]: count }));
  };

  const load = useCallback(async () => {
    if (!fromCity || !toCity || !date) return;
    const key = cacheKey(fromCity, toCity, date);
    setLoading(true);
    setError(null);
    setFromCache(false);
    try {
      const { rides: data } = await RidesApi.search(fromCity, toCity, date);
      setRides(data);
      setSeatCounts((prev) => {
        const next = { ...prev };
        for (const ride of data) {
          if (!next[ride.id]) next[ride.id] = 1;
          else if (next[ride.id] > ride.seatsAvailable) {
            next[ride.id] = Math.max(1, ride.seatsAvailable);
          }
        }
        return next;
      });
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
    const seatsRequested = getSeatCount(ride);
    setBookingId(ride.id);
    setError(null);
    try {
      await RidesApi.book(ride.id, {
        riderFromCity: fromCity || '',
        riderToCity: toCity || '',
        seatsRequested,
      });
      router.replace({
        pathname: '/rider/requested',
        params: {
          driverName: ride.driver.name || 'Driver',
          pickup: ride.pickupPoint || `${ride.fromCity} → ${ride.toCity}`,
          time: ride.time,
          date: ride.date,
          pricePerSeat: String(ride.pricePerSeat ?? 1),
          seatsRequested: String(seatsRequested),
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
            renderItem={({ item }) => {
              const seatsRequested = getSeatCount(item);
              const price = item.pricePerSeat ?? 1;
              return (
                <View style={styles.card}>
                  <Text style={styles.name}>{item.driver.name || 'Driver'}</Text>
                  {item.matchType === 'viaStop' ? (
                    <Text style={styles.viaBadge}>
                      Via your city · Driver route: {item.fromCity} → {item.toCity}
                    </Text>
                  ) : null}
                  {item.matchType === 'partial' ? (
                    <Text style={styles.partialBadge}>
                      Partial route · Driver goes {item.fromCity} → {item.toCity},
                      you travel {fromCity} → {toCity}
                    </Text>
                  ) : null}
                  <Text style={styles.metaLine}>
                    {item.driver.carModel} · {item.time}
                  </Text>
                  {item.pickupPoint ? (
                    <Text style={styles.metaLine}>Meeting: {item.pickupPoint}</Text>
                  ) : null}
                  <Text style={styles.price}>{formatPricePerSeat(price)}</Text>
                  <Text style={styles.seats}>{item.seatsAvailable} seats left</Text>
                  <Text style={styles.seatsLabel}>Seats to request</Text>
                  <View style={styles.seatRow}>
                    {Array.from({ length: item.seatsAvailable }, (_, i) => i + 1).map(
                      (n) => (
                        <ChoiceChip
                          key={n}
                          label={`${n}`}
                          selected={seatsRequested === n}
                          onPress={() => setSeatCount(item.id, n)}
                        />
                      )
                    )}
                  </View>
                  <Text style={styles.totalPreview}>
                    {formatBookingTotal(seatsRequested, price)}
                  </Text>
                  <View style={{ marginTop: 12 }}>
                    <PrimaryButton
                      label="Request Seat(s) / सीट माँगें"
                      loading={bookingId === item.id}
                      disabled={!!bookingId}
                      onPress={() => onBook(item)}
                    />
                  </View>
                </View>
              );
            }}
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
  partialBadge: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.brandAccent,
    lineHeight: 18,
  },
  price: {
    marginTop: 8,
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 17,
  },
  seats: {
    marginTop: 4,
    color: colors.primary,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  seatsLabel: {
    marginTop: spacing.sm,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  seatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  totalPreview: {
    marginTop: spacing.sm,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
});
