import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen, Subtitle, Title } from '../src/components/ui';
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_TEL,
} from '../src/constants';
import { RequireAuth } from '../src/RequireAuth';
import { colors, fonts, spacing } from '../src/theme';

function ContactRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </Pressable>
  );
}

export default function ContactScreen() {
  const openEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  const openPhone = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE_TEL}`);
  };

  return (
    <RequireAuth>
      <SafeAreaView style={styles.safe}>
        <Screen>
          <Title>Contact Us</Title>
          <Subtitle>
            Reach out for help, feedback, or to report an issue with a ride.
          </Subtitle>

          <View style={styles.card}>
            <ContactRow
              label="Email"
              value={SUPPORT_EMAIL}
              onPress={openEmail}
            />
            <View style={styles.divider} />
            <ContactRow
              label="Phone"
              value={SUPPORT_PHONE}
              onPress={openPhone}
            />
          </View>

          <Text style={styles.hint}>Tap email or phone to open your mail or dialer app.</Text>
        </Screen>
      </SafeAreaView>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    padding: spacing.md,
  },
  rowLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },
  rowValue: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  hint: {
    marginTop: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
