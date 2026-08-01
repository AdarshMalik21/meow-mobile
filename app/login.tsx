import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../src/auth';
import { useRole } from '../src/role';
import { ApiError } from '../src/api';
import { mapFirebaseAuthError, sendOtp } from '../src/firebaseAuth';
import { ZuroLogo } from '../src/components/ZuroLogo';
import {
  BottomBar,
  ErrorText,
  Field,
  Label,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../src/components/ui';
import { colors, fonts, spacing } from '../src/theme';
import { getApiUrl } from '../src/apiConfig';

const ALLOW_DEV = process.env.EXPO_PUBLIC_ALLOW_DEV_AUTH === 'true';

export default function LoginScreen() {
  const { signInWithDev } = useAuth();
  const { clearMode } = useRole();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });
    return () => sub.remove();
  }, []);

  const digits = phone.replace(/\D/g, '');

  const onSendOtp = async () => {
    setError(null);
    if (digits.length !== 10) {
      setError('Enter a 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      await clearMode();
      await sendOtp(digits);
      router.push({ pathname: '/verify-otp', params: { phone: digits } });
    } catch (e) {
      setError(mapFirebaseAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  const onDevLogin = async () => {
    if (!ALLOW_DEV) return;
    setError(null);
    if (digits.length !== 10) {
      setError('Enter a 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      await clearMode();
      await signInWithDev(digits);
      router.replace('/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not log in. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen style={styles.screen} safeTop>
        <ZuroLogo size="small" style={styles.logo} />
        <Title>Log in or sign up</Title>
        <Subtitle>
          Enter your mobile number. We will send a 6-digit OTP to verify you.
        </Subtitle>
        <Text style={styles.trustLine}>We never share your number</Text>
        <Label>Mobile number</Label>
        <Field
          keyboardType="phone-pad"
          maxLength={10}
          placeholder="10-digit number"
          value={phone}
          onChangeText={setPhone}
        />
        <ErrorText>{error}</ErrorText>
      </Screen>
      <BottomBar>
        <PrimaryButton
          label="Send OTP / OTP भेजें"
          onPress={onSendOtp}
          loading={loading}
        />
        {ALLOW_DEV || __DEV__ ? (
          <View style={styles.devBlock}>
            {ALLOW_DEV ? (
              <Pressable onPress={onDevLogin} hitSlop={8}>
                <Text style={styles.devLink}>Dev login (no OTP) — tap here</Text>
              </Pressable>
            ) : null}
            {__DEV__ ? (
              <Text style={styles.devHint}>API: {getApiUrl()}</Text>
            ) : null}
          </View>
        ) : null}
      </BottomBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: spacing.sm,
  },
  logo: {
    marginBottom: spacing.md,
  },
  trustLine: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  devBlock: {
    marginTop: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  devLink: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  devHint: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.regular,
  },
});
