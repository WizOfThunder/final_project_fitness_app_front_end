import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, FlatList, ActivityIndicator} from 'react-native';
import {Calendar} from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '../../../config/apiConfig';
import {styles} from './styles';

const DAY_ORDER = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const formatLocalDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;

const parseDateOnly = (value: string) => {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  return new Date(value);
};

interface ExerciseItem {
  id: string;
  name: string;
  day: string;
  sets?: number;
  reps?: number;
  duration?: number;
}

const WorkoutPlanCalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [allItems, setAllItems] = useState<ExerciseItem[]>([]);
  const [markedDates, setMarkedDates] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);
  const [planCreatedAt, setPlanCreatedAt] = useState<string | null>(null);

  const getToken = async () => {
    const raw = await AsyncStorage.getItem('auth-storage');
    return raw ? JSON.parse(raw)?.state?.token : null;
  };

  const buildMarkedDates = useCallback(
    (items: ExerciseItem[], createdAt: string) => {
      const startDate = new Date(createdAt);
      const dayOfWeek = startDate.getDay();
      const monday = new Date(startDate);
      monday.setDate(startDate.getDate() - ((dayOfWeek + 6) % 7));

      const marked: {[key: string]: any} = {};
      const uniqueDays = [...new Set(items.map(i => i.day))];
      uniqueDays.forEach(dayName => {
        const idx = DAY_ORDER.indexOf(dayName);
        if (idx === -1) {
          return;
        }
        const d = new Date(monday);
        d.setDate(monday.getDate() + ((idx + 6) % 7));
        const dateStr = formatLocalDate(d);
        marked[dateStr] = {marked: true, dotColor: '#007AFF'};
      });
      return marked;
    },
    [],
  );

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/ai/my-workout`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        const data = await res.json();
        const plans = Array.isArray(data) ? data : [];
        const latest = plans[0];
        if (latest && latest.items) {
          setAllItems(latest.items);
          setPlanCreatedAt(latest.created_at);
          setMarkedDates(buildMarkedDates(latest.items, latest.created_at));
        }
      } catch (e) {
        console.error('Error fetching plan:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [buildMarkedDates]);

  const getExercisesForDate = (dateStr: string): ExerciseItem[] => {
    if (!planCreatedAt || allItems.length === 0) {
      return [];
    }
    const startDate = new Date(planCreatedAt);
    const dayOfWeek = startDate.getDay();
    const monday = new Date(startDate);
    monday.setDate(startDate.getDate() - ((dayOfWeek + 6) % 7));

    const selected = parseDateOnly(dateStr);
    const diffDays = Math.round(
      (selected.getTime() - monday.getTime()) / 86400000,
    );
    const dayName = DAY_ORDER[(diffDays + 1) % 7];
    return allItems.filter(i => i.day === dayName);
  };

  const exercises = selectedDate ? getExercisesForDate(selectedDate) : [];

  const renderItem = ({item}: {item: ExerciseItem}) => (
    <View style={styles.exerciseItem}>
      <View style={styles.exerciseDetails}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        {item.sets && item.reps ? (
          <Text style={styles.exerciseInfo}>
            {item.sets} sets × {item.reps} reps
          </Text>
        ) : item.duration ? (
          <Text style={styles.exerciseInfo}>{item.duration}s</Text>
        ) : null}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {justifyContent: 'center', alignItems: 'center'},
        ]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Workout Plan</Text>
      <Calendar
        markedDates={{
          ...markedDates,
          ...(selectedDate && {
            [selectedDate]: {
              selected: true,
              selectedColor: '#007AFF',
              marked: !!markedDates[selectedDate],
            },
          }),
        }}
        onDayPress={(day: {dateString: string}) =>
          setSelectedDate(day.dateString)
        }
        theme={{
          selectedDayBackgroundColor: '#007AFF',
          todayTextColor: '#007AFF',
          arrowColor: '#007AFF',
        }}
      />
      <View style={styles.exerciseListContainer}>
        {!selectedDate ? (
          <Text style={styles.selectDateText}>
            Select a date to view exercises
          </Text>
        ) : exercises.length > 0 ? (
          <>
            <Text style={styles.dateTitle}>Exercises for {selectedDate}</Text>
            <FlatList
              data={exercises}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.exerciseList}
            />
          </>
        ) : (
          <Text style={styles.noExercises}>
            No exercises scheduled for this day
          </Text>
        )}
      </View>
    </View>
  );
};

export default WorkoutPlanCalendarScreen;
