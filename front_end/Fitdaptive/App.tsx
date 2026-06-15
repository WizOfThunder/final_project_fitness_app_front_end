import React, {useEffect} from 'react';
import {Alert} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {AuthProvider, useAuth} from './src/store/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import {
  onForegroundMessage,
  requestUserPermission,
  getFCMToken,
  onTokenRefresh,
  syncWeatherLocation,
} from './src/services/notificationService';
import {apiClient} from './src/services/api';
import {requestLocationPermission} from './src/utils/geolocation';

function AppContent() {
  const {user, triggerNotifRefresh} = useAuth();

  useEffect(() => {
    const unsubscribe = onForegroundMessage(remoteMessage => {
      const title = remoteMessage.notification?.title;
      const body = remoteMessage.notification?.body;
      if (title || body) {
        Alert.alert(title || 'Notification', body || '');
      }
      triggerNotifRefresh();
    });
    return unsubscribe;
  }, [triggerNotifRefresh]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const registerToken = async (token: string) => {
      try {
        await apiClient.post('/notification/update-token', {fcm_token: token});
      } catch (_) {}
    };

    (async () => {
      const notificationsGranted = await requestUserPermission();
      if (notificationsGranted) {
        const token = await getFCMToken();
        if (token) {
          await registerToken(token);
        }
      }

      const locationGranted = await requestLocationPermission();
      if (locationGranted) {
        await syncWeatherLocation();
      }
    })().catch(() => {});

    const unsubRefresh = onTokenRefresh(registerToken);
    return unsubRefresh;
  }, [user?.id]);

  return (
    <NavigationContainer>
      <RootNavigator userRole={user?.role || null} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
