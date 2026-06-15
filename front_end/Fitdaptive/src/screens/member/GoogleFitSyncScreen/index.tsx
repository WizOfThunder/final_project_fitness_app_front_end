import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {initialize, requestPermission, readRecords, SdkAvailabilityStatus} from 'react-native-health-connect';
import {styles} from './styles';

export default function GoogleFitSyncScreen() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState({
    steps: 0,
    calories: 0,
    distance: 0,
    heartRate: 0,
    activeMinutes: 0,
  });

  useEffect(() => {
    checkHealthConnectAvailability();
  }, []);

  const checkHealthConnectAvailability = async () => {
    const status = await initialize();
    if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
      setIsConnected(true);
    }
  };

  const requestHealthPermissions = async () => {
    try {
      const permissions = [
        {accessType: 'read', recordType: 'Steps'},
        {accessType: 'read', recordType: 'TotalCaloriesBurned'},
        {accessType: 'read', recordType: 'Distance'},
        {accessType: 'read', recordType: 'HeartRate'},
        {accessType: 'read', recordType: 'ExerciseSession'},
      ];
      
      const granted = await requestPermission(permissions);
      if (granted) {
        Alert.alert('Success', 'Health Connect permissions granted');
        fetchHealthData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      // Fetch Steps
      const stepsData = await readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });
      const totalSteps = stepsData.records.reduce((sum: number, record: any) => sum + (record.count || 0), 0);

      // Fetch Calories
      const caloriesData = await readRecords('TotalCaloriesBurned', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });
      const totalCalories = caloriesData.records.reduce((sum: number, record: any) => sum + (record.energy?.inKilocalories || 0), 0);

      // Fetch Distance
      const distanceData = await readRecords('Distance', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });
      const totalDistance = distanceData.records.reduce((sum: number, record: any) => sum + (record.distance?.inKilometers || 0), 0);

      // Fetch Heart Rate (latest)
      const heartRateData = await readRecords('HeartRate', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });
      const latestHeartRate = heartRateData.records.length > 0 ? heartRateData.records[heartRateData.records.length - 1].samples[0]?.beatsPerMinute || 0 : 0;

      // Fetch Exercise Sessions
      const exerciseData = await readRecords('ExerciseSession', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });
      const totalMinutes = exerciseData.records.reduce((sum: number, record: any) => {
        const start = new Date(record.startTime).getTime();
        const end = new Date(record.endTime).getTime();
        return sum + (end - start) / 60000;
      }, 0);

      setHealthData({
        steps: Math.round(totalSteps),
        calories: Math.round(totalCalories),
        distance: parseFloat(totalDistance.toFixed(2)),
        heartRate: Math.round(latestHeartRate),
        activeMinutes: Math.round(totalMinutes),
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Icon name="fitness" size={60} color="#FF6B35" />
        <Text style={styles.title}>Health Connect</Text>
        <Text style={styles.subtitle}>Sync your fitness data from Health Connect</Text>
      </View>

      {!isConnected ? (
        <View style={styles.notAvailable}>
          <Icon name="alert-circle" size={50} color="#FF6B35" />
          <Text style={styles.notAvailableText}>Health Connect is not available on this device</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.connectButton} onPress={requestHealthPermissions}>
            <Icon name="link" size={24} color="#fff" />
            <Text style={styles.connectButtonText}>Connect Health Connect</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.syncButton} onPress={fetchHealthData} disabled={loading}>
            <Icon name="sync" size={24} color="#FF6B35" />
            <Text style={styles.syncButtonText}>{loading ? 'Syncing...' : 'Sync Data'}</Text>
          </TouchableOpacity>

          {loading && <ActivityIndicator size="large" color="#FF6B35" style={styles.loader} />}

          <View style={styles.dataContainer}>
            <Text style={styles.sectionTitle}>Today's Activity</Text>

            <View style={styles.dataCard}>
              <View style={styles.iconCircle}>
                <Icon name="footsteps" size={28} color="#FF6B35" />
              </View>
              <View style={styles.dataContent}>
                <Text style={styles.dataLabel}>Steps</Text>
                <Text style={styles.dataValue}>{healthData.steps.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.dataCard}>
              <View style={styles.iconCircle}>
                <Icon name="flame" size={28} color="#FF6B35" />
              </View>
              <View style={styles.dataContent}>
                <Text style={styles.dataLabel}>Calories Burned</Text>
                <Text style={styles.dataValue}>{healthData.calories.toLocaleString()} kcal</Text>
              </View>
            </View>

            <View style={styles.dataCard}>
              <View style={styles.iconCircle}>
                <Icon name="navigate" size={28} color="#FF6B35" />
              </View>
              <View style={styles.dataContent}>
                <Text style={styles.dataLabel}>Distance</Text>
                <Text style={styles.dataValue}>{healthData.distance} km</Text>
              </View>
            </View>

            <View style={styles.dataCard}>
              <View style={styles.iconCircle}>
                <Icon name="heart" size={28} color="#FF6B35" />
              </View>
              <View style={styles.dataContent}>
                <Text style={styles.dataLabel}>Heart Rate</Text>
                <Text style={styles.dataValue}>{healthData.heartRate} bpm</Text>
              </View>
            </View>

            <View style={styles.dataCard}>
              <View style={styles.iconCircle}>
                <Icon name="time" size={28} color="#FF6B35" />
              </View>
              <View style={styles.dataContent}>
                <Text style={styles.dataLabel}>Active Minutes</Text>
                <Text style={styles.dataValue}>{healthData.activeMinutes} min</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
