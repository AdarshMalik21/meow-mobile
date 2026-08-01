import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ZuroIcon } from '../src/components/ZuroIcon';
import { ZuroWordmark } from '../src/components/ZuroWordmark';
import { useAuth } from '../src/auth';
import { useRole } from '../src/role';
import { colors } from '../src/theme';

const SPLASH_MS = 2500;

let splashShownThisSession = false;

export default function Index() {
  const { user, loading } = useAuth();
  const { mode, roleReady } = useRole();
  const [timerDone, setTimerDone] = useState(splashShownThisSession);

  useEffect(() => {
    if (splashShownThisSession) return;
    const timer = setTimeout(() => {
      splashShownThisSession = true;
      setTimerDone(true);
    }, SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  const authReady = !loading && roleReady;
  const showSplash = !timerDone || !authReady;

  if (showSplash) {
    return (
      <View style={styles.splash}>
        <ZuroIcon size="large" />
        <ZuroWordmark style={styles.wordmark} />
        {!authReady && timerDone ? (
          <ActivityIndicator
            style={styles.loader}
            size="small"
            color={colors.brandTagline}
          />
        ) : null}
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;
  if (user.needsTermsAcceptance) return <Redirect href="/terms" />;
  if (user.needsName) return <Redirect href="/setup-name" />;
  if (!mode) return <Redirect href="/choose-role" />;
  return <Redirect href="/home" />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandNavy,
    paddingHorizontal: 40,
  },
  wordmark: {
    marginTop: 24,
  },
  loader: {
    position: 'absolute',
    bottom: 48,
  },
});
