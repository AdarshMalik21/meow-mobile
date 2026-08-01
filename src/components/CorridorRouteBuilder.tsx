import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError, CorridorsApi } from '../api';
import { CityAutocomplete } from './CityAutocomplete';
import { ErrorText, PrimaryButton } from './ui';
import { colors, fonts, spacing } from '../theme';

type Props = {
  fromCity: string;
  toCity: string;
  onCreated: () => void;
};

export function CorridorRouteBuilder({ fromCity, toCity, onCreated }: Props) {
  const [cities, setCities] = useState<string[]>(() => [fromCity, toCity]);
  const [draftCity, setDraftCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intermediates = useMemo(
    () => cities.filter((c) => c !== fromCity && c !== toCity),
    [cities, fromCity, toCity]
  );

  const excludeForPicker = useMemo(() => cities, [cities]);

  useEffect(() => {
    setCities([fromCity, toCity]);
    setDraftCity('');
    setError(null);
  }, [fromCity, toCity]);

  const routePreview = cities.join(' → ');

  const addCity = () => {
    setError(null);
    if (!draftCity || excludeForPicker.includes(draftCity)) return;
    setCities((prev) => {
      const next = [...prev];
      next.splice(next.length - 1, 0, draftCity);
      return next;
    });
    setDraftCity('');
  };

  const removeCity = (city: string) => {
    setCities((prev) => prev.filter((c) => c !== city));
  };

  const moveCity = (index: number, direction: -1 | 1) => {
    setCities((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 1 || target >= next.length - 1) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await CorridorsApi.create({ fromCity, toCity, cities });
      onCreated();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save route. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Add this route / यह रास्ता जोड़ें</Text>
      <Text style={styles.body}>
        This route isn't in our system yet — help us add it. Which cities does your route
        pass through, in order from {fromCity} to {toCity}?
      </Text>
      <Text style={styles.bodyHi}>
        यह रास्ता अभी हमारे सिस्टम में नहीं है। कृपया बीच की शहरें क्रम से जोड़ें।
      </Text>
      <Text style={styles.hint}>
        Adding cities in between helps more riders find your ride.
      </Text>

      <Text style={styles.previewLabel}>Your route</Text>
      <Text style={styles.preview}>{routePreview}</Text>

      {intermediates.map((city, idx) => {
        const listIndex = idx + 1;
        return (
          <View key={city} style={styles.row}>
            <Text style={styles.rowCity}>{city}</Text>
            <View style={styles.rowActions}>
              <Pressable onPress={() => moveCity(listIndex, -1)} hitSlop={8}>
                <Text style={styles.action}>↑</Text>
              </Pressable>
              <Pressable onPress={() => moveCity(listIndex, 1)} hitSlop={8}>
                <Text style={styles.action}>↓</Text>
              </Pressable>
              <Pressable onPress={() => removeCity(city)} hitSlop={8}>
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      <CityAutocomplete
        label="Add a city along the route"
        placeholder="Search and tap a city…"
        value={draftCity}
        onChange={setDraftCity}
        excludeCities={excludeForPicker}
      />
      <PrimaryButton
        label="Add city / शहर जोड़ें"
        onPress={addCity}
        disabled={!draftCity || excludeForPicker.includes(draftCity)}
        variant="secondary"
      />

      <View style={{ height: spacing.md }} />
      <PrimaryButton
        label="Save route & continue / रास्ता सेव करें"
        onPress={onSubmit}
        loading={loading}
      />
      <ErrorText>{error}</ErrorText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  bodyHi: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  hint: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
  previewLabel: {
    marginTop: spacing.md,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  preview: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowCity: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  action: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.primary,
  },
  remove: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
  },
});
