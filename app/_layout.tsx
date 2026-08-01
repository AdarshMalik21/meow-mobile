import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  useFonts,
} from '@expo-google-fonts/dm-sans';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/auth';
import { RoleProvider } from '../src/role';
import { NotificationHandler } from '../src/NotificationHandler';
import { colors, fonts } from '../src/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RoleProvider>
          <NotificationHandler />
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.white },
              headerTintColor: colors.text,
              headerTitleStyle: { fontFamily: fonts.bold, fontWeight: '700' },
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ title: 'Log in', headerShown: false }} />
            <Stack.Screen name="verify-otp" options={{ title: 'Enter OTP' }} />
            <Stack.Screen name="terms" options={{ title: 'Terms', headerShown: false }} />
            <Stack.Screen name="setup-name" options={{ title: 'Your name' }} />
            <Stack.Screen name="choose-role" options={{ title: 'Choose role', headerShown: false }} />
            <Stack.Screen name="home" options={{ headerShown: false }} />
            <Stack.Screen name="contact" options={{ title: 'Contact Us' }} />
            <Stack.Screen name="rider/requested" options={{ headerShown: false }} />
            <Stack.Screen name="driver/setup-car" options={{ title: 'Your car' }} />
            <Stack.Screen name="driver/post-ride" options={{ title: 'Post Ride' }} />
            <Stack.Screen name="driver/my-rides" options={{ title: 'My Rides' }} />
            <Stack.Screen name="driver/ride-details" options={{ title: 'Ride Details' }} />
            <Stack.Screen name="rider/search" options={{ title: 'Find Ride' }} />
            <Stack.Screen name="rider/results" options={{ title: 'Rides' }} />
            <Stack.Screen name="rider/booked" options={{ headerShown: false }} />
            <Stack.Screen name="rider/my-bookings" options={{ title: 'My Bookings' }} />
            <Stack.Screen name="success" options={{ headerShown: false }} />
          </Stack>
        </RoleProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
