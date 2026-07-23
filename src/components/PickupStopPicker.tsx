import { ChoiceChip, Label } from './ui';
import { colors, fonts, spacing } from '../theme';
import { Text, View } from 'react-native';

type Props = {
  driverFrom: string;
  driverTo: string;
  intermediateCities: string[];
  selected: string[];
  onChange: (stops: string[]) => void;
};

export function PickupStopPicker({
  driverFrom,
  driverTo,
  intermediateCities,
  selected,
  onChange,
}: Props) {
  if (intermediateCities.length === 0) return null;

  const toggle = (city: string) => {
    if (selected.includes(city)) {
      onChange(selected.filter((c) => c !== city));
    } else {
      onChange([...selected, city]);
    }
  };

  return (
    <View style={{ marginTop: spacing.md }}>
      <Label>Pickup cities along your route</Label>
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: 13,
          color: colors.textMuted,
          marginBottom: spacing.sm,
        }}
      >
        Riders searching from these cities to {driverTo} will see your ride.{' '}
        {driverFrom} is always included.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <ChoiceChip label={`${driverFrom} (start)`} selected onPress={() => {}} />
        {intermediateCities.map((city) => (
          <ChoiceChip
            key={city}
            label={city}
            selected={selected.includes(city)}
            onPress={() => toggle(city)}
          />
        ))}
      </View>
    </View>
  );
}
