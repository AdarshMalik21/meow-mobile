import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../src/auth';
import { useRole } from '../src/role';
import { colors } from '../src/theme';

export default function Index() {
  const { user, loading } = useAuth();
  const { mode, roleReady } = useRole();

  if (loading || !roleReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;
  if (user.needsName) return <Redirect href="/setup-name" />;
  if (!mode) return <Redirect href="/choose-role" />;
  return <Redirect href="/home" />;
}
