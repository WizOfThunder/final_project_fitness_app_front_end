import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, FlatList, ActivityIndicator} from 'react-native';
import {Calendar} from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '../../../config/apiConfig';
import {styles} from './styles';

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

interface MealItem {
  id: string;
  day: string;
  meal_type: string;
  recipe_id: number;
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ready_in_minutes: number;
}

const MEAL_TYPE_COLORS: {[key: string]: string} = {
  breakfast: '#FF9800',
  morning_snack: '#FF6B35',
  lunch: '#4CAF50',
  afternoon_snack: '#9C27B0',
  dinner: '#2196F3',
  snack: '#9C27B0',
};

const MEAL_TYPE_LABELS: {[key: string]: string} = {
  breakfast: 'Breakfast',
  morning_snack: 'Morning Snack',
  lunch: 'Lunch',
  afternoon_snack: 'Afternoon Snack',
  dinner: 'Dinner',
  snack: 'Snack',
};

const MEAL_TYPE_ORDER = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'snack'];

const DietPlanCalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [allItems, setAllItems] = useState<MealItem[]>([]);
  const [markedDates, setMarkedDates] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);
  const [planCreatedAt, setPlanCreatedAt] = useState<string | null>(null);

  const getToken = async () => {
    const raw = await AsyncStorage.getItem('auth-storage');
    return raw ? JSON.parse(raw)?.state?.token : null;
  };

  const buildMarkedDates = useCallback((items: MealItem[], createdAt: string) => {
    const startDate = new Date(createdAt);
    const dayOfWeek = startDate.getDay();
    const monday = new Date(startDate);
    monday.setDate(startDate.getDate() - ((dayOfWeek + 6) % 7));

    const marked: {[key: string]: any} = {};
      const uniqueDays = [...new Set(items.map(i => i.day))];
      uniqueDays.forEach(dayName => {
        const idx = DAY_ORDER.indexOf(dayName);
        if (idx === -1) return;
        const d = new Date(monday);
        d.setDate(monday.getDate() + ((idx + 6) % 7));
        const dateStr = formatLocalDate(d);
        marked[dateStr] = {marked: true, dotColor: '#4CAF50'};
      });
      return marked;
  }, []);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/ai/my-diet`, {
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
        console.error('Error fetching diet plan:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [buildMarkedDates]);

  const getMealsForDate = (dateStr: string): MealItem[] => {
    if (!planCreatedAt || allItems.length === 0) return [];
    const startDate = new Date(planCreatedAt);
    const dayOfWeek = startDate.getDay();
    const monday = new Date(startDate);
    monday.setDate(startDate.getDate() - ((dayOfWeek + 6) % 7));

    const selected = parseDateOnly(dateStr);
    const diffDays = Math.round((selected.getTime() - monday.getTime()) / 86400000);
    const dayName = DAY_ORDER[(diffDays + 1) % 7];
    return allItems.filter(i => i.day === dayName);
  };

  const meals = selectedDate
    ? getMealsForDate(selectedDate).sort(
        (a, b) => MEAL_TYPE_ORDER.indexOf(a.meal_type) - MEAL_TYPE_ORDER.indexOf(b.meal_type)
      )
    : [];

  const renderItem = ({item}: {item: MealItem}) => (
    <View style={styles.mealItem}>
      <View style={styles.mealDetails}>
        <View style={styles.mealHeader}>
          <Text style={styles.mealName}>{item.title}</Text>
          <View style={[styles.mealTypeBadge, {backgroundColor: MEAL_TYPE_COLORS[item.meal_type] || '#757575'}]}>
            <Text style={styles.mealTypeText}>{item.meal_type.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.nutritionInfo}>
          {!!item.calories && <Text style={styles.nutritionText}>{Math.round(item.calories)} cal</Text>}
          {!!item.protein && <Text style={styles.nutritionText}>P: {Math.round(item.protein)}g</Text>}
          {!!item.carbs && <Text style={styles.nutritionText}>C: {Math.round(item.carbs)}g</Text>}
          {!!item.fat && <Text style={styles.nutritionText}>F: {Math.round(item.fat)}g</Text>}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Diet Plan</Text>
      <Calendar
        markedDates={{
          ...markedDates,
          ...(selectedDate && {
            [selectedDate]: {
              selected: true,
              selectedColor: '#4CAF50',
              marked: !!markedDates[selectedDate],
            },
          }),
        }}
        onDayPress={(day: {dateString: string}) => setSelectedDate(day.dateString)}
        theme={{
          selectedDayBackgroundColor: '#4CAF50',
          todayTextColor: '#4CAF50',
          arrowColor: '#4CAF50',
        }}
      />
      <View style={styles.mealListContainer}>
        {!selectedDate ? (
          <Text style={styles.selectDateText}>Select a date to view meals</Text>
        ) : meals.length > 0 ? (
          <>
            <Text style={styles.dateTitle}>Meals for {selectedDate}</Text>
            <FlatList
              data={meals}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.mealList}
            />
          </>
        ) : (
          <Text style={styles.noMeals}>No meals scheduled for this day</Text>
        )}
      </View>
    </View>
  );
};

export default DietPlanCalendarScreen;
