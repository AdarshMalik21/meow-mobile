import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { DatePickerField } from '../../src/components/DatePickerField';
import {
  BottomBar,
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

  const onSearch = () => {
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
    setError(null);
    router.push({
      pathname: '/rider/results',
      params: { fromCity: from, toCity: to, date },
    });
  };

  return (
    <RequireAuth>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Screen>
          <Title>Find a ride</Title>
          <Subtitle>Enter cities and travel date.</Subtitle>
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
          <ErrorText>{error}</ErrorText>
        </Screen>
        <BottomBar>
          <PrimaryButton label="Search / खोजें" onPress={onSearch} />
        </BottomBar>
      </View>
    </RequireAuth>
  );
}
