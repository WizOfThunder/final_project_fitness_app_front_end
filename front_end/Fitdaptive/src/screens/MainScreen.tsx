import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import ProfileScreen from './ProfileScreen';
import { fetchNearbyGyms } from '../utils/placesApi';

const Tab = createBottomTabNavigator();

function HomeTab({ navigation }: any) {
  const [location, setLocation] = useState({
    latitude: -7.2575,
    longitude: 112.7521,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [gyms, setGyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setLoading(false);
          return;
        }
      }

      getCurrentLocation();
    } catch (error) {
      console.error('Permission error:', error);
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setLoading(true);

    Geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const region = {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };

          setLocation(region);

          const nearbyGyms = await fetchNearbyGyms(latitude, longitude);
          setGyms(nearbyGyms);
        } catch (err) {
          console.error('Error fetching gyms:', err);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Location error:', error);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    const url =
      Platform.OS === 'android'
        ? `google.navigation:q=${lat},${lng}`
        : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={location}
        showsUserLocation
        showsMyLocationButton
      >
        {gyms.map((gym) => (
          <Marker
            key={gym.id}
            coordinate={{
              latitude: gym.latitude,
              longitude: gym.longitude,
            }}
          >
            <Callout tooltip>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{gym.name}</Text>

                <TouchableOpacity
                  style={styles.calloutButton}
                  onPress={() =>
                    openGoogleMaps(gym.latitude, gym.longitude)
                  }
                >
                  <Text style={styles.calloutButtonText}>
                    Open in Google Maps
                  </Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            Finding nearby gyms...
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => navigation.navigate('FitnessSurvey')}
        >
          <Text style={styles.buttonText}>
            🏋️ Create Workout Plan Using AI
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => navigation.navigate('FitnessSurvey')}
        >
          <Text style={styles.buttonText}>
            🥗 Create Diet Plan Using AI
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function WorkoutTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Workout</Text>
    </View>
  );
}

function ProgressTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Progress</Text>
    </View>
  );
}

function NutritionTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Nutrition</Text>
    </View>
  );
}

export default function MainScreen() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeTab} />
      <Tab.Screen name="Workout" component={WorkoutTab} />
      <Tab.Screen name="Progress" component={ProgressTab} />
      <Tab.Screen name="Nutrition" component={NutritionTab} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { flex: 1 },

  loadingContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 15,
    borderRadius: 10,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },

  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },

  aiButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 5,
  },

  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },

  text: {
    fontSize: 24,
    fontWeight: '600',
  },

  calloutContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    width: 200,
    elevation: 5,
  },

  calloutTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 8,
  },

  calloutButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    borderRadius: 6,
  },

  calloutButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});