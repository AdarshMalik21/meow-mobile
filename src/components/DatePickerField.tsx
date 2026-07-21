import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDisplayDate, parseISODate, toISO } from '../dates';
import { colors, fonts, spacing } from '../theme';
import { Label } from './ui';

type Props = {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  minimumDate?: Date;
};

export function DatePickerField({
  label,
  value,
  onChange,
  minimumDate,
}: Props) {
  const [show, setShow] = useState(false);
  const dateValue = parseISODate(value);

  const onPickerChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (selected) {
      onChange(toISO(selected));
    }
  };

  return (
    <View>
      <Label>{label}</Label>
      <Pressable
        onPress={() => setShow(true)}
        style={({ pressed }) => [
          styles.field,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={styles.value}>{formatDisplayDate(value)}</Text>
        <Text style={styles.chevron}>▼</Text>
      </Pressable>
      {show ? (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minimumDate}
          onChange={onPickerChange}
        />
      ) : null}
      {Platform.OS === 'ios' && show ? (
        <Pressable onPress={() => setShow(false)} style={styles.doneBtn}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      ) : null}
    </View>
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
  value: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  chevron: {
    fontSize: 12,
    color: colors.textMuted,
  },
  doneBtn: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  doneText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
});
