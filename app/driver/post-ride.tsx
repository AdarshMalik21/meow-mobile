import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ApiError, RoutesApi, RidesApi } from '../../src/api';
import { CityAutocomplete } from '../../src/components/CityAutocomplete';
import { CorridorRouteBuilder } from '../../src/components/CorridorRouteBuilder';
import { DatePickerField } from '../../src/components/DatePickerField';
import { PickupStopPicker } from '../../src/components/PickupStopPicker';
import { TimeSlotPicker } from '../../src/components/TimeSlotPicker';
import {
  BottomBar,
  ChoiceChip,
  ErrorText,
  Field,
  Label,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../../src/components/ui';
import { todayISO } from '../../src/dates';
import { RequireAuth } from '../../src/RequireAuth';
import { useAuth } from '../../src/auth';
import { colors, fonts, spacing } from '../../src/theme';
import {
  firstAvailableSlot,
  getAvailableSlots,
} from '../../src/timeSlots';

export default function PostRideScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState(() => firstAvailableSlot(todayISO()) ?? '07:00');
  const [pickupPoint, setPickupPoint] = useState('');
  const [pickupStops, setPickupStops] = useState<string[]>([]);
  const [intermediateCities, setIntermediateCities] = useState<string[]>([]);
  const [corridorFound, setCorridorFound] = useState(false);
  const [corridorCreated, setCorridorCreated] = useState(false);
  const [pathLoading, setPathLoading] = useState(false);
  const [pricePerSeat, setPricePerSeat] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [seats, setSeats] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const minDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const availableSlots = useMemo(() => getAvailableSlots(date), [date]);
  const parsedPrice = parseInt(pricePerSeat.replace(/\D/g, ''), 10);
  const priceValid = Number.isFinite(parsedPrice) && parsedPrice >= 1;
  const carValid =
    carModel.trim().length >= 2 && carNumber.trim().length >= 4;
  const corridorReady = corridorFound || corridorCreated;
  const canPost =
    availableSlots.length > 0 &&
    fromCity.length > 0 &&
    toCity.length > 0 &&
    fromCity.toLowerCase() !== toCity.toLowerCase() &&
    priceValid &&
    carValid &&
    corridorReady;

  const loadPath = useCallback(async (signal?: AbortSignal) => {
    const path = await RoutesApi.getPath(fromCity, toCity, signal);
    setCorridorFound(path.corridorFound);
    setIntermediateCities(path.intermediateCities);
    setPickupStops((prev) =>
      prev.filter((c) => path.intermediateCities.includes(c))
    );
    return path;
  }, [fromCity, toCity]);

  useEffect(() => {
    const slots = getAvailableSlots(date);
    if (slots.length === 0) return;
    if (!slots.some((s) => s.value === time)) {
      setTime(slots[0].value);
    }
  }, [date, time]);

  useEffect(() => {
    if (!user?.driverProfile) return;
    setCarModel((prev) => prev || user.driverProfile!.carModel);
    setCarNumber((prev) => prev || user.driverProfile!.carNumber);
  }, [user?.driverProfile]);

  useEffect(() => {
    if (!fromCity || !toCity || fromCity.toLowerCase() === toCity.toLowerCase()) {
      setIntermediateCities([]);
      setPickupStops([]);
      setCorridorFound(false);
      setCorridorCreated(false);
      return;
    }

    const controller = new AbortController();
    setPathLoading(true);
    setCorridorCreated(false);
    loadPath(controller.signal)
      .catch((e) => {
        if (e?.name === 'AbortError') return;
        setIntermediateCities([]);
        setPickupStops([]);
        setCorridorFound(false);
      })
      .finally(() => setPathLoading(false));

    return () => controller.abort();
  }, [fromCity, toCity, loadPath]);

  const onCorridorCreated = async () => {
    setPathLoading(true);
    try {
      await loadPath();
      setCorridorCreated(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load route after save.');
    } finally {
      setPathLoading(false);
    }
  };

  const onPost = async () => {
    setError(null);
    if (!fromCity || !toCity) {
      setError('Pick from and to cities from the list.');
      return;
    }
    if (fromCity.toLowerCase() === toCity.toLowerCase()) {
      setError('From and To must be different cities.');
      return;
    }
    if (!corridorReady) {
      setError('Add this route to our system before posting.');
      return;
    }
    if (!canPost) {
      setError('No departure times left for this date. Pick another date.');
      return;
    }
    if (!priceValid) {
      setError('Enter a valid price per seat (minimum ₹1).');
      return;
    }
    if (!carValid) {
      setError('Enter car model and registration number for this ride.');
      return;
    }
    setLoading(true);
    try {
      await RidesApi.create({
        fromCity,
        toCity,
        date,
        time,
        pickupPoint: pickupPoint.trim() || undefined,
        pickupStops,
        totalSeats: seats,
        pricePerSeat: parsedPrice,
        carModel: carModel.trim(),
        carNumber: carNumber.trim(),
      });
      const stopsLabel =
        pickupStops.length > 0 ? ` · Pickups: ${pickupStops.join(', ')}` : '';
      router.replace({
        pathname: '/success',
        params: {
          title: 'Ride Posted!',
          message:
            'Riders searching from your pickup cities to your destination will see this ride.',
          routeLine: `${fromCity} → ${toCity} · ${date} · ${time}${stopsLabel}`,
          next: '/driver/my-rides',
        },
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not post ride.');
    } finally {
      setLoading(false);
    }
  };

  const cityHint =
    !fromCity || !toCity
      ? 'Select From and To cities from the list to enable Post Ride.'
      : !corridorReady
        ? 'This route needs to be added before you can post a ride.'
        : null;

  const showRouteBuilder =
    !pathLoading && fromCity && toCity && fromCity.toLowerCase() !== toCity.toLowerCase() && !corridorFound && !corridorCreated;

  const showPickupPicker =
    !pathLoading && corridorReady && fromCity && toCity;

  return (
    <RequireAuth>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <Screen>
            <Title>Post a ride</Title>
            <Subtitle>Share your city-to-city trip and available seats.</Subtitle>

            <CityAutocomplete
              label="From city"
              placeholder="e.g. Moradabad"
              value={fromCity}
              onChange={setFromCity}
              excludeCity={toCity}
            />

            <CityAutocomplete
              label="To city"
              placeholder="e.g. Delhi"
              value={toCity}
              onChange={setToCity}
              excludeCity={fromCity}
            />

            {pathLoading ? (
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  color: colors.textMuted,
                  marginTop: spacing.sm,
                }}
              >
                Loading route cities…
              </Text>
            ) : null}

            {showRouteBuilder ? (
              <CorridorRouteBuilder
                fromCity={fromCity}
                toCity={toCity}
                onCreated={onCorridorCreated}
              />
            ) : null}

            {showPickupPicker ? (
              <PickupStopPicker
                driverFrom={fromCity}
                driverTo={toCity}
                intermediateCities={intermediateCities}
                selected={pickupStops}
                onChange={setPickupStops}
              />
            ) : null}

            <DatePickerField
              label="Travel date"
              value={date}
              onChange={setDate}
              minimumDate={minDate}
            />

            <TimeSlotPicker date={date} value={time} onChange={setTime} />

            <Label>Meeting point (optional)</Label>
            <Field
              value={pickupPoint}
              onChangeText={setPickupPoint}
              placeholder="e.g. Railway Station"
            />

            <Label>Price per seat (₹)</Label>
            <Field
              value={pricePerSeat}
              onChangeText={setPricePerSeat}
              keyboardType="number-pad"
              placeholder="e.g. 300"
            />

            <Label>Car model</Label>
            <Field
              value={carModel}
              onChangeText={setCarModel}
              placeholder="e.g. Swift"
              autoCapitalize="words"
            />

            <Label>Registration number</Label>
            <Field
              value={carNumber}
              onChangeText={setCarNumber}
              placeholder="e.g. UP16AB1234"
              autoCapitalize="characters"
            />

            <Label>Seats available</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <ChoiceChip
                  key={n}
                  label={`${n}`}
                  selected={seats === n}
                  onPress={() => setSeats(n)}
                />
              ))}
            </View>
            <ErrorText>{error}</ErrorText>
            {!error && cityHint ? (
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 13,
                  color: colors.textMuted,
                  marginTop: spacing.sm,
                }}
              >
                {cityHint}
              </Text>
            ) : null}
          </Screen>
        </ScrollView>
        <BottomBar>
          <PrimaryButton
            label="Post Ride / राइड पोस्ट करें"
            onPress={onPost}
            loading={loading}
            disabled={!canPost}
          />
        </BottomBar>
      </View>
    </RequireAuth>
  );
}
