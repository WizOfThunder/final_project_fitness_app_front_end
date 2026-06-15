import messaging from '@react-native-firebase/messaging';
import {PermissionsAndroid, Platform} from 'react-native';
import {apiClient} from './api';
import {getCurrentPosition} from '../utils/geolocation';

export async function requestUserPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Platform.Version < 33) {
      return true;
    }

    const alreadyGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (alreadyGranted) {
      return true;
    }

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return status === PermissionsAndroid.RESULTS.GRANTED;
  }

  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

export function onTokenRefresh(callback: (token: string) => void): () => void {
  return messaging().onTokenRefresh(callback);
}

export function onForegroundMessage(
  callback: (remoteMessage: any) => void,
): () => void {
  return messaging().onMessage(callback);
}

export async function syncWeatherLocation(options?: {
  skipPreferenceCheck?: boolean;
}): Promise<void> {
  try {
    if (!options?.skipPreferenceCheck) {
      const {data: prefs} = await apiClient.get('/users/notification-prefs');
      if (prefs?.weather === false) {
        return;
      }
    }

    await new Promise<void>(resolve => {
      getCurrentPosition(
        async (position: any) => {
          try {
            await apiClient.post('/notification/location', {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
          } catch (_) {}

          resolve();
        },
        () => resolve(),
      );
    });
  } catch (_) {}
}
