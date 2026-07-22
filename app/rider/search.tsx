import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { CityAutocomplete } from '../../src/components/CityAutocomplete';
import { DatePickerField } from '../../src/components/DatePickerField';
import {
  BottomBar,
  ErrorText,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../../src/components/ui';
import { todayISO } from '../../src/dates';
import { RequireAuth } from '../../src/RequireAuth';
import { colors } from '../../src/theme';

export default function SearchScreen() {
  const router = useRouter();
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);
  const minDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const canSearch =
    fromCity.length > 0 &&
    toCity.length > 0 &&
    fromCity.toLowerCase() !== toCity.toLowerCase();

  const onSearch = () => {
    if (!fromCity || !toCity) {
      setError('Pick from and to cities from the list.');
      return;
    }
    if (fromCity.toLowerCase() === toCity.toLowerCase()) {
      setError('From and To must be different cities.');
      return;
    }
    setError(null);
    router.push({
      pathname: '/rider/results',
      params: { fromCity, toCity, date },
    });
  };

  return (
    <RequireAuth>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Screen>
          <Title>Find a ride</Title>
          <Subtitle>Search cities from the directory and pick a date.</Subtitle>
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
          <DatePickerField
            label="Travel date"
            value={date}
            onChange={setDate}
            minimumDate={minDate}
          />
          <ErrorText>{error}</ErrorText>
        </Screen>
        <BottomBar>
          <PrimaryButton
            label="Search / खोजें"
            onPress={onSearch}
            disabled={!canSearch}
          />
        </BottomBar>
      </View>
    </RequireAuth>
  );
}
