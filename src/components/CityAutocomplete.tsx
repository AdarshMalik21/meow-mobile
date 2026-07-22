import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError, CitiesApi } from '../api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { colors, fonts, spacing } from '../theme';
import { Field, Label } from './ui';

type Props = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (city: string) => void;
  /** Hide this city from suggestions (e.g. the other field's selection). */
  excludeCity?: string;
};

export function CityAutocomplete({
  label,
  placeholder = 'Start typing a city…',
  value,
  onChange,
  excludeCity,
}: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebouncedValue(query, 300);
  const showList = focused && (loading || results.length > 0 || fetchError || debouncedQuery.length > 0);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!focused) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const { cities } = await CitiesApi.search(debouncedQuery, controller.signal);
        if (controller.signal.aborted) return;
        const filtered = excludeCity
          ? cities.filter((c) => c.toLowerCase() !== excludeCity.toLowerCase())
          : cities;
        setResults(filtered);
      } catch (e) {
        if (controller.signal.aborted) return;
        setResults([]);
        setFetchError(e instanceof ApiError ? e.message : 'Could not load cities.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [debouncedQuery, focused, excludeCity]);

  const onSelect = (city: string) => {
    onChange(city);
    setQuery(city);
    setFocused(false);
    setResults([]);
  };

  const onChangeText = (text: string) => {
    setQuery(text);
    if (value && text.trim().toLowerCase() !== value.toLowerCase()) {
      onChange('');
    }
  };

  return (
    <View style={styles.wrap}>
      <Label>{label}</Label>
      <Field
        value={query}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize="words"
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          // Delay so tap on suggestion registers
          setTimeout(() => setFocused(false), 200);
        }}
      />
      {showList ? (
        <View style={styles.listBox}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : fetchError ? (
            <Text style={styles.emptyText}>{fetchError}</Text>
          ) : results.length === 0 ? (
            <Text style={styles.emptyText}>No matching cities</Text>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => onSelect(item)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <Text style={styles.rowText}>{item}</Text>
                </Pressable>
              )}
            />
          )}
        </View>
      ) : null}
      {value ? <Text style={styles.selectedHint}>Selected: {value}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    zIndex: 1,
  },
  listBox: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    maxHeight: 200,
    overflow: 'hidden',
  },
  list: {
    maxHeight: 200,
  },
  row: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  rowText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  loadingRow: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    padding: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  selectedHint: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
});
