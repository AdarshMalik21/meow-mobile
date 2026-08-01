import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
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
  /** Hide multiple cities from suggestions. */
  excludeCities?: string[];
};

export function CityAutocomplete({
  label,
  placeholder = 'Tap to search cities…',
  value,
  onChange,
  excludeCity,
  excludeCities,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    if (!open) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const { cities } = await CitiesApi.search(debouncedQuery, controller.signal);
        if (controller.signal.aborted) return;
        const excluded = new Set(
          [
            ...(excludeCities ?? []),
            ...(excludeCity ? [excludeCity] : []),
          ].map((c) => c.toLowerCase())
        );
        const filtered = cities.filter((c) => !excluded.has(c.toLowerCase()));
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
  }, [debouncedQuery, open, excludeCity, excludeCities]);

  const openPicker = () => {
    setQuery(value);
    setOpen(true);
  };

  const onSelect = (city: string) => {
    onChange(city);
    setQuery(city);
    setOpen(false);
  };

  const closePicker = () => {
    setOpen(false);
  };

  const display = value || placeholder;
  const needsSelection = !value;

  return (
    <View style={styles.wrap}>
      <Label>{label}</Label>
      <Pressable
        onPress={openPicker}
        style={({ pressed }) => [styles.field, pressed && { opacity: 0.85 }]}
      >
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {display}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </Pressable>

      {needsSelection ? (
        <Text style={styles.hint}>Tap above and pick a city from the list</Text>
      ) : (
        <Text style={styles.selectedHint}>Selected: {value}</Text>
      )}

      <Modal visible={open} transparent animationType="slide" onRequestClose={closePicker}>
        <Pressable style={styles.backdrop} onPress={closePicker} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <View style={styles.searchWrap}>
            <Field
              value={query}
              onChangeText={setQuery}
              placeholder="Type to search…"
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
            />
          </View>
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
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => onSelect(item)}
                  style={({ pressed }) => [
                    styles.row,
                    item === value && styles.rowSelected,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.rowText,
                      item === value && styles.rowTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  field: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  hint: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  selectedHint: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.primary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: spacing.lg,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  row: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowSelected: {
    backgroundColor: colors.surface,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  rowText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  rowTextSelected: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  loadingRow: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    padding: spacing.lg,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
});
