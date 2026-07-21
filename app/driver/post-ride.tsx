import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ApiError, RidesApi } from '../../src/api';
import { DatePickerField } from '../../src/components/DatePickerField';
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
import { trimCity } from '../../src/constants';
import { todayISO } from '../../src/dates';
import { RequireAuth } from '../../src/RequireAuth';
import { colors } from '../../src/theme';
import {
  firstAvailableSlot,
  getAvailableSlots,
} from '../../src/timeSlots';

export default function PostRideScreen() {
  const router = useRouter();
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState(() => firstAvailableSlot(todayISO()) ?? '07:00');
  const [pickupPoint, setPickupPoint] = useState('');
  const [seats, setSeats] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const minDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const availableSlots = useMemo(() => getAvailableSlots(date), [date]);
  const canPost = availableSlots.length > 0;

  useEffect(() => {
    const slots = getAvailableSlots(date);
    if (slots.length === 0) return;
    if (!slots.some((s) => s.value === time)) {
      setTime(slots[0].value);
    }
  }, [date, time]);

  const onPost = async () => {
    setError(null);
    const from = trimCity(fromCity);
    const to = trimCity(toCity);
    if (from.length < 2 || to.length < 2) {
      setError('Enter from and to cities.');
      return;
    }
    if (from.toLowerCase() === to.toLowerCase()) {
      setError('From and To must be different cities.');
      return;
    }
    if (!canPost) {
      setError('No departure times left for this date. Pick another date.');
      return;
    }
    setLoading(true);
    try {
      await RidesApi.create({
        fromCity: from,
        toCity: to,
        date,
        time,
        pickupPoint: pickupPoint.trim() || undefined,
        totalSeats: seats,
      });
      router.replace({
        pathname: '/success',
        params: {
          title: 'Ride Posted!',
          message: 'Riders can now find and request a seat on your ride.',
          next: '/driver/my-rides',
        },
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not post ride.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequireAuth>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <Screen>
            <Title>Post a ride</Title>
            <Subtitle>Share your city-to-city trip and available seats.</Subtitle>

            <Label>From city</Label>
            <Field
              value={fromCity}
              onChangeText={setFromCity}
              placeholder="e.g. Moradabad"
              autoCapitalize="words"
            />

            <Label>To city</Label>
            <Field
              value={toCity}
              onChangeText={setToCity}
              placeholder="e.g. Delhi"
              autoCapitalize="words"
            />

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
