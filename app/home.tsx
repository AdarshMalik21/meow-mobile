import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Booking, BookingsApi } from '../src/api';
import { PrimaryButton } from '../src/components/ui';
import { routeLabel } from '../src/constants';
import { isRideDateTimePast } from '../src/dates';
import { RequireAuth } from '../src/RequireAuth';
import { useAuth } from '../src/auth';
import { useRole } from '../src/role';
import { colors, fonts, spacing } from '../src/theme';

const REJECTED_WINDOW_MS = 24 * 60 * 60 * 1000;

function pickBannerBooking(bookings: Booking[]): Booking | null {
  const now = Date.now();

  for (const b of bookings) {
    if (b.status === 'PENDING' && !isRideDateTimePast(b.ride.date, b.ride.time)) {
      return b;
    }
  }
  for (const b of bookings) {
    if (b.status === 'BOOKED' && !isRideDateTimePast(b.ride.date, b.ride.time)) {
      return b;
    }
  }
  for (const b of bookings) {
    if (b.status === 'REJECTED') {
      const created = new Date(b.createdAt).getTime();
      if (now - created < REJECTED_WINDOW_MS) return b;
    }
  }
  return null;
}

function bannerCopy(booking: Booking): { title: string; subtitle: string; tone: 'pending' | 'booked' | 'rejected' } {
  const route = routeLabel(booking.ride.fromCity, booking.ride.toCity);
  const when = `${booking.ride.date} · ${booking.ride.time}`;

  if (booking.status === 'PENDING') {
    return {
      title: 'Waiting for driver',
      subtitle: `${route} · ${when}`,
      tone: 'pending',
    };
  }
  if (booking.status === 'BOOKED') {
    return {
      title: 'Ride confirmed',
      subtitle: `${route} · ${when}`,
      tone: 'booked',
    };
  }
  return {
    title: 'Request declined',
    subtitle: `Driver declined your request for ${route}`,
    tone: 'rejected',
  };
}

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const { mode } = useRole();
  const router = useRouter();
  const [bannerBooking, setBannerBooking] = useState<Booking | null>(null);

  const loadRiderBanner = useCallback(async () => {
    if (mode !== 'rider') {
      setBannerBooking(null);
      return;
    }
    try {
      const { bookings } = await BookingsApi.mine();
      setBannerBooking(pickBannerBooking(bookings));
    } catch {
      setBannerBooking(null);
    }
  }, [mode]);

  useFocusEffect(
    useCallback(() => {
      loadRiderBanner();
    }, [loadRiderBanner])
  );

  const onLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const onBannerPress = () => {
    if (!bannerBooking) return;
    if (bannerBooking.status === 'BOOKED' && bannerBooking.ride.driver.phone) {
      router.push({
        pathname: '/rider/booked',
        params: {
          driverName: bannerBooking.ride.driver.name || 'Driver',
          driverPhone: bannerBooking.ride.driver.phone || '',
          pickup: bannerBooking.ride.pickupPoint,
          time: bannerBooking.ride.time,
          date: bannerBooking.ride.date,
          carModel: bannerBooking.ride.driver.carModel,
          carNumber: bannerBooking.ride.driver.carNumber || '',
          pricePerSeat: String(bannerBooking.ride.pricePerSeat ?? 1),
          seatsRequested: String(bannerBooking.seatsRequested ?? 1),
        },
      });
    } else {
      router.push('/rider/my-bookings');
    }
  };

  return (
    <RequireAuth>
      {!mode ? (
        <Redirect href="/choose-role" />
      ) : (
        <SafeAreaView style={styles.safe}>
          <View style={styles.hero}>
            <View style={styles.heroOverlay} />
            <View style={styles.header}>
              <Text style={styles.brand}>zuro</Text>
              <View style={styles.headerActions}>
                <Pressable onPress={() => router.push('/contact')} hitSlop={12}>
                  <Text style={styles.contactLink}>Contact us</Text>
                </Pressable>
                <Pressable onPress={onLogout} hitSlop={12}>
                  <Text style={styles.logout}>Log out</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.heroTagline}>City to city, seat by seat</Text>
          </View>

          <Text style={styles.hello}>Hi, {user?.name || 'there'}</Text>
          <Text style={styles.phone}>
            {user?.phone} · {mode === 'rider' ? 'Rider' : 'Driver'}
          </Text>

          {mode === 'rider' && bannerBooking ? (
            <Pressable onPress={onBannerPress} style={styles.bannerWrap}>
              <View
                style={[
                  styles.banner,
                  bannerCopy(bannerBooking).tone === 'pending' && styles.bannerPending,
                  bannerCopy(bannerBooking).tone === 'booked' && styles.bannerBooked,
                  bannerCopy(bannerBooking).tone === 'rejected' && styles.bannerRejected,
                ]}
              >
                <Text style={styles.bannerTitle}>
                  {bannerCopy(bannerBooking).title}
                </Text>
                <Text style={styles.bannerSub}>
                  {bannerCopy(bannerBooking).subtitle}
                </Text>
                <Text style={styles.bannerTap}>Tap for details</Text>
              </View>
            </Pressable>
          ) : null}

          <View style={styles.body}>
            {mode === 'rider' ? (
              <>
                <Text style={styles.modeTitle}>Find a ride between cities</Text>
                <Text style={styles.modeSub}>
                  Enter from and to cities, pick a date, and request a seat. The
                  driver must allow your request before it is confirmed.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.modeTitle}>Share seats on your route</Text>
                <Text style={styles.modeSub}>
                  Post your city-to-city trip. When a rider requests, Allow or
                  Decline.
                </Text>
              </>
            )}
          </View>

          <View style={styles.actions}>
            {mode === 'rider' ? (
              <>
                <PrimaryButton
                  label="Find Ride / राइड खोजें"
                  onPress={() => router.push('/rider/search')}
                />
                <View style={{ height: 12 }} />
                <PrimaryButton
                  label="My Bookings / मेरी बुकिंग"
                  variant="secondary"
                  onPress={() => router.push('/rider/my-bookings')}
                />
              </>
            ) : (
              <>
                <PrimaryButton
                  label="Post Ride / राइड पोस्ट करें"
                  onPress={() => router.push('/driver/post-ride')}
                />
                <View style={{ height: 12 }} />
                <PrimaryButton
                  label="My Rides / मेरी राइड्स"
                  variant="secondary"
                  onPress={() => router.push('/driver/my-rides')}
                />
              </>
            )}
          </View>
        </SafeAreaView>
      )}
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.primary,
    paddingBottom: spacing.lg,
    overflow: 'hidden',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  contactLink: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  brand: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  logout: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  heroTagline: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: 'rgba(255,255,255,0.9)',
  },
  hello: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  phone: {
    paddingHorizontal: spacing.lg,
    color: colors.textMuted,
    marginTop: 4,
    fontFamily: fonts.regular,
  },
  bannerWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  banner: {
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
  },
  bannerPending: {
    backgroundColor: '#E8F2FC',
    borderColor: colors.primary,
  },
  bannerBooked: {
    backgroundColor: '#E6F4EE',
    borderColor: colors.success,
  },
  bannerRejected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  bannerTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
  },
  bannerSub: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 20,
  },
  bannerTap: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  modeTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modeSub: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    lineHeight: 22,
  },
  actions: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
});
