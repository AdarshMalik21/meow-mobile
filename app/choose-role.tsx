import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRole, RoleMode } from '../src/role';
import { PrimaryButton, Subtitle, Title } from '../src/components/ui';
import { RequireAuth } from '../src/RequireAuth';
import { colors, fonts, spacing } from '../src/theme';

export default function ChooseRoleScreen() {
  const { setMode } = useRole();
  const router = useRouter();

  const pick = async (mode: RoleMode) => {
    await setMode(mode);
    router.replace('/home');
  };

  return (
    <RequireAuth>
      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <Text style={styles.brand}>zuro</Text>
          <Title>How are you using the app today?</Title>
          <Subtitle>Choose Rider or Driver for this session.</Subtitle>
        </View>
        <View style={styles.actions}>
          <PrimaryButton
            label="I'm a Rider / मैं राइडर हूँ"
            onPress={() => pick('rider')}
          />
          <View style={{ height: 12 }} />
          <PrimaryButton
            label="I'm a Driver / मैं ड्राइवर हूँ"
            variant="secondary"
            onPress={() => pick('driver')}
          />
        </View>
      </SafeAreaView>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  brand: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  actions: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
});
