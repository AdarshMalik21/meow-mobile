import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { AuthApi, ApiError } from '../src/api';
import { useAuth } from '../src/auth';
import { registerAndSyncPushToken } from '../src/pushNotifications';
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

export default function SetupNameScreen() {
  const { setUser, user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setError(null);
    if (name.trim().length < 2) {
      setError('Enter your full name.');
      return;
    }
    setLoading(true);
    try {
      const { user: updated } = await AuthApi.updateMe({ name: name.trim() });
      setUser(updated);
      await registerAndSyncPushToken();
      router.replace('/choose-role');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save name.');
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
        <Title>What should we call you?</Title>
        <Subtitle>Drivers and riders see this name on rides.</Subtitle>
        <Label>Your name</Label>
        <Field
          placeholder="e.g. Rahul Sharma"
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <ErrorText>{error}</ErrorText>
      </Screen>
      <BottomBar>
        <PrimaryButton
          label="Save & Continue / सेव करें"
          onPress={onSave}
          loading={loading}
        />
      </BottomBar>
    </KeyboardAvoidingView>
  );
}
