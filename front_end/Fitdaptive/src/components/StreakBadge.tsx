import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../services/api';
import {useFocusEffect} from '@react-navigation/native';

export default function StreakBadge({refreshKey = 0}: {refreshKey?: number}) {
  const [streak, setStreak] = useState<{active_days_this_week: number; weekly_streak: number} | null>(null);

  useFocusEffect(useCallback(() => {
    const tzOffset = -(new Date().getTimezoneOffset());
    apiClient.get('/activity/streak', {params: {tz_offset: tzOffset}})
      .then(res => setStreak(res.data))
      .catch(() => {});
  }, [refreshKey]));

  const days = streak?.active_days_this_week ?? 0;
  const weeks = streak?.weekly_streak ?? 0;

  return (
    <View style={s.row}>
      <View style={s.badge}>
        <Icon name="flame" size={16} color="#FF6B35" />
        <Text style={s.value}>{days}</Text>
        <Text style={s.label}>days{'\n'}this week</Text>
      </View>
      <View style={s.divider} />
      <View style={s.badge}>
        <Icon name="calendar" size={16} color="#5856D6" />
        <Text style={[s.value, {color: '#5856D6'}]}>{weeks}</Text>
        <Text style={s.label}>week{'\n'}streak</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8F5', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16, marginHorizontal: 16, marginTop: 10, borderWidth: 1, borderColor: '#FFE0D0'},
  badge: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8},
  value: {fontSize: 22, fontWeight: '800', color: '#FF6B35'},
  label: {fontSize: 11, color: '#888', lineHeight: 15},
  divider: {width: 1, height: 36, backgroundColor: '#FFE0D0', marginHorizontal: 12},
});
