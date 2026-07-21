import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import { AuthApi } from './api';

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    if (__DEV__) console.warn('[push] Skipped — not a physical device');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    if (__DEV__) console.warn('[push] Permission not granted:', finalStatus);
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('[push] EAS projectId missing; cannot get push token.');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  if (__DEV__) console.log('[push] Token obtained:', token.data.slice(0, 30) + '…');
  return token.data;
}

export async function syncPushTokenWithBackend(token: string) {
  await AuthApi.updateMe({ expoPushToken: token });
  if (__DEV__) console.log('[push] Token synced to backend');
}

export async function clearPushTokenOnBackend() {
  try {
    await AuthApi.updateMe({ expoPushToken: null });
  } catch {
    // ignore if already logged out
  }
}

export async function registerAndSyncPushToken(): Promise<string | null> {
  try {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await syncPushTokenWithBackend(token);
    }
    return token;
  } catch (err) {
    console.warn('[push] registerAndSyncPushToken failed:', err);
    return null;
  }
}

/** Re-sync token when app returns to foreground (token can change after updates). */
export function subscribePushTokenRefresh(onRefresh: () => void) {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') onRefresh();
  });
  return () => sub.remove();
}
