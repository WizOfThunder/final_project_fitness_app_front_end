import React, {useState, useCallback} from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../services/api';
import {useFocusEffect} from '@react-navigation/native';
import {styles} from '../screens/member/MemberDashboard/styles';

const EMPTY = {steps: 0, calories: 0, distance: 0, exercise_minutes: 0, avg_sleep: 0};

export default function WeeklyStatsCard({refreshKey = 0}: {refreshKey?: number}) {
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const tzOffset = -(new Date().getTimezoneOffset());
      const res = await apiClient.get('/activity/weekly', {params: {tz_offset: tzOffset}});
      setWeeklyStats(res.data);
    } catch (e) {
      console.error('[WeeklyStats] fetch error:', e);
      setWeeklyStats(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load, refreshKey]));

  const data = weeklyStats ?? EMPTY;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>This Week</Text>
      {loading ? (
        <View style={styles.weekCard}>
          <ActivityIndicator size="small" color="#FF6B35" />
        </View>
      ) : (
        <View style={styles.weekCard}>
          <View style={styles.weekRow}>
            <View style={styles.weekStat}>
              <Icon name="walk" size={20} color="#FF6B35" />
              <Text style={styles.weekValue}>{data.steps.toLocaleString()}</Text>
              <Text style={styles.weekLabel}>Steps</Text>
            </View>
            <View style={styles.weekStat}>
              <Icon name="flame" size={20} color="#FF6B35" />
              <Text style={styles.weekValue}>{data.calories.toLocaleString()}</Text>
              <Text style={styles.weekLabel}>Calories</Text>
            </View>
            <View style={styles.weekStat}>
              <Icon name="moon" size={20} color="#5856D6" />
              <Text style={styles.weekValue}>{parseFloat(data.avg_sleep).toFixed(1)}h</Text>
              <Text style={styles.weekLabel}>Avg Sleep</Text>
            </View>
          </View>
          <View style={[styles.weekRow, {marginTop: 10}]}>
            <View style={styles.weekStat}>
              <Icon name="navigate" size={20} color="#34C759" />
              <Text style={styles.weekValue}>{parseFloat(data.distance).toFixed(2)} km</Text>
              <Text style={styles.weekLabel}>Distance</Text>
            </View>
            <View style={styles.weekStat}>
              <Icon name="barbell" size={20} color="#FF9500" />
              <Text style={styles.weekValue}>{data.exercise_minutes} min</Text>
              <Text style={styles.weekLabel}>Exercise</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
