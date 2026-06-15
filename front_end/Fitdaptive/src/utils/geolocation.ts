import Geolocation from '@react-native-community/geolocation';
import {PermissionsAndroid, Platform} from 'react-native';

let pendingLocationPermissionRequest: Promise<boolean> | null = null;

async function requestAndroidLocationPermission(): Promise<boolean> {
  const alreadyGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  if (alreadyGranted) {
    return true;
  }

  const status = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return status === PermissionsAndroid.RESULTS.GRANTED;
}

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    Geolocation.requestAuthorization();
    return true;
  }

  if (Platform.OS !== 'android') {
    return true;
  }

  if (!pendingLocationPermissionRequest) {
    pendingLocationPermissionRequest = requestAndroidLocationPermission();
  }

  try {
    return await pendingLocationPermissionRequest;
  } finally {
    pendingLocationPermissionRequest = null;
  }
}

export const getCurrentPosition = async (
  onSuccess: (position: any) => void,
  onError: (error: any) => void,
) => {
  try {
    if (Platform.OS === 'android') {
      const granted = await requestLocationPermission();
      if (!granted) {
        onError({code: 1, message: 'Location permission denied'});
        return;
      }
    }

    Geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 60000,
    });
  } catch (e) {
    onError(e);
  }
};
