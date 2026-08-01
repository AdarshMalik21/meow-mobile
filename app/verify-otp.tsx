import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { useAuth } from '../src/auth';
import { ApiError } from '../src/api';
import {
  clearPendingConfirmation,
  confirmOtp,
  mapFirebaseAuthError,
  sendOtp,
} from '../src/firebaseAuth';
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
import { colors } from '../src/theme';

export default function VerifyOtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { signInWithFirebase } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneDigits = (phone || '').replace(/\D/g, '');

  const onVerify = async () => {
    setError(null);
    if (code.trim().length < 6) {
      setError('Enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const idToken = await confirmOtp(code);
      const user = await signInWithFirebase(idToken);
      router.replace('/');
    } catch (e) {
      if (e instanceof Error && e.message === 'NO_CONFIRMATION') {
        setError('OTP session expired. Send OTP again.');
      } else if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError(mapFirebaseAuthError(e));
      }
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setError(null);
    if (phoneDigits.length !== 10) {
      router.replace('/login');
      return;
    }
    setLoading(true);
    try {
      clearPendingConfirmation();
      await sendOtp(phoneDigits);
      setCode('');
      setError(null);
    } catch (e) {
      setError(mapFirebaseAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <Title>Enter OTP</Title>
        <Subtitle>
          We sent a code to +91 {phoneDigits}. For Firebase test numbers, use
          the code from Firebase console.
        </Subtitle>
        <Label>6-digit OTP</Label>
        <Field
          keyboardType="number-pad"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChangeText={setCode}
          autoFocus
        />
        <ErrorText>{error}</ErrorText>
        <Pressable onPress={onResend} style={{ marginTop: 16 }} hitSlop={8}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>
            Send OTP again / फिर से भेजें
          </Text>
        </Pressable>
      </Screen>
      <BottomBar>
        <PrimaryButton
          label="Verify / पुष्टि करें"
          onPress={onVerify}
          loading={loading}
        />
      </BottomBar>
    </KeyboardAvoidingView>
  );
}
