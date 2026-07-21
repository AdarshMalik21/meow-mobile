import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AuthApi } from './api';

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
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
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('EAS projectId missing; cannot get push token.');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export async function syncPushTokenWithBackend(token: string) {
  await AuthApi.updateMe({ expoPushToken: token });
}

export async function clearPushTokenOnBackend() {
  try {
    await AuthApi.updateMe({ expoPushToken: null });
  } catch {
    // ignore if already logged out
  }
}

export async function registerAndSyncPushToken() {
  const token = await registerForPushNotificationsAsync();
  if (token) {
    await syncPushTokenWithBackend(token);
  }
  return token;
}
