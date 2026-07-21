import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { ApiError, UsersApi } from '../../src/api';
import { useAuth } from '../../src/auth';
import {
  BottomBar,
  ErrorText,
  Field,
  Label,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../../src/components/ui';
import { RequireAuth } from '../../src/RequireAuth';
import { colors } from '../../src/theme';

export default function SetupCarScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [carModel, setCarModel] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setError(null);
    if (carModel.trim().length < 2 || carNumber.trim().length < 4) {
      setError('Enter car model and car number.');
      return;
    }
    setLoading(true);
    try {
      await UsersApi.saveDriverProfile(carModel.trim(), carNumber.trim());
      await refreshUser();
      router.replace('/driver/post-ride');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save car details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequireAuth>
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <Title>Your car</Title>
        <Subtitle>Riders see this when they book a seat.</Subtitle>
        <Label>Car model</Label>
        <Field
          placeholder="e.g. Swift Dzire"
          value={carModel}
          onChangeText={setCarModel}
        />
        <Label>Car number</Label>
        <Field
          placeholder="e.g. UP21 AB 1234"
          autoCapitalize="characters"
          value={carNumber}
          onChangeText={setCarNumber}
        />
        <ErrorText>{error}</ErrorText>
      </Screen>
      <BottomBar>
        <PrimaryButton
          label="Save Car / सेव करें"
          onPress={onSave}
          loading={loading}
        />
      </BottomBar>
    </KeyboardAvoidingView>
    </RequireAuth>
  );
}
