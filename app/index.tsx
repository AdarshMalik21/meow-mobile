import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { useAuth } from '../src/auth';
import { useRole } from '../src/role';
import { colors } from '../src/theme';

const SPLASH_MS = 2500;
const SPLASH_BG = '#EEF1F4';

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
        <Image
          source={require('../assets/splash-screen.png')}
          style={styles.splashImage}
          resizeMode="contain"
          accessibilityLabel="Zuro — Better together on every road"
        />
        {!authReady && timerDone ? (
          <ActivityIndicator
            style={styles.loader}
            size="small"
            color={colors.brandNavy}
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
    backgroundColor: SPLASH_BG,
    paddingHorizontal: 40,
  },
  splashImage: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 1,
  },
  loader: {
    position: 'absolute',
    bottom: 48,
  },
});
