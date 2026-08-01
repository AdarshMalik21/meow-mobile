import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, AuthApi } from '../src/api';
import { useAuth } from '../src/auth';
import { BottomBar, ErrorText, PrimaryButton } from '../src/components/ui';
import { TERMS_SECTIONS } from '../src/content/terms';
import { RequireAuth } from '../src/RequireAuth';
import { colors, fonts, spacing } from '../src/theme';

export default function TermsScreen() {
  const { setUser, signOut } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAccept = async () => {
    if (!checked) return;
    setError(null);
    setLoading(true);
    try {
      const { user } = await AuthApi.acceptTerms();
      setUser(user);
      router.replace('/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save acceptance. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const onReject = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <RequireAuth>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <Text style={styles.title}>Terms & Conditions</Text>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
        >
          <Text style={styles.intro}>
            Please read the following terms carefully before using Zuro.
          </Text>
          {TERMS_SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}
        </ScrollView>

        <Pressable
          onPress={() => setChecked((v) => !v)}
          style={styles.checkboxRow}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
        >
          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>I have read all instructions</Text>
        </Pressable>

        <ErrorText>{error}</ErrorText>

        <BottomBar>
          <PrimaryButton
            label="Accept / स्वीकार करें"
            onPress={onAccept}
            disabled={!checked}
            loading={loading}
          />
          <View style={{ height: 12 }} />
          <PrimaryButton
            label="Reject / अस्वीकार करें"
            onPress={onReject}
            variant="secondary"
            disabled={loading}
          />
        </BottomBar>
      </SafeAreaView>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  intro: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  sectionBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
});
