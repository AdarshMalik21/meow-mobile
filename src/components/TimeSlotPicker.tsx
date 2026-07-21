import { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  getAvailableSlots,
  getSlotLabel,
  TimeSlot,
} from '../timeSlots';
import { colors, fonts, spacing } from '../theme';
import { Label } from './ui';

type Props = {
  label?: string;
  date: string;
  value: string;
  onChange: (value: string) => void;
};

export function TimeSlotPicker({ label = 'Departure time', date, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const slots = getAvailableSlots(date);
  const display = slots.find((s) => s.value === value)?.label ?? getSlotLabel(value);

  return (
    <View>
      <Label>{label}</Label>
      <Pressable
        onPress={() => slots.length > 0 && setOpen(true)}
        disabled={slots.length === 0}
        style={({ pressed }) => [
          styles.field,
          slots.length === 0 && styles.fieldDisabled,
          pressed && slots.length > 0 && { opacity: 0.85 },
        ]}
      >
        <Text style={[styles.value, slots.length === 0 && styles.valueMuted]}>
          {slots.length === 0
            ? 'No times left today — pick another date'
            : display}
        </Text>
        {slots.length > 0 ? <Text style={styles.chevron}>▼</Text> : null}
      </Pressable>

      <Modal visible={open} transparent animationType="slide">
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Choose time</Text>
          <FlatList
            data={slots}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <SlotRow
                item={item}
                selected={item.value === value}
                onPick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              />
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

function SlotRow({
  item,
  selected,
  onPick,
}: {
  item: TimeSlot;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <Pressable
      onPress={onPick}
      style={[styles.row, selected && styles.rowSelected]}
    >
      <Text style={[styles.rowText, selected && styles.rowTextSelected]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  fieldDisabled: {
    backgroundColor: colors.surface,
  },
  value: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    flex: 1,
  },
  valueMuted: {
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 12,
    color: colors.textMuted,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '55%',
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
  row: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowSelected: {
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
});
