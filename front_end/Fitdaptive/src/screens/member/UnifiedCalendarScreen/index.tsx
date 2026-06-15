import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {apiClient} from '../../../services/api';
import {formatMuscleLabel} from '../../../utils/formatMuscleLabel';
import {styles} from './styles';
import {ENV} from '../../../config/env';

interface CalendarEvent {
  id: string;
  type: 'workout' | 'diet' | 'google' | 'trainer';
  title: string;
  completed?: boolean;
  details?: string;
  color: string;
  itemId?: number;
  recipeId?: number;
  sessionId?: number;
  hireId?: number;
  trainerName?: string;
}

interface DayData {
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  events: CalendarEvent[];
}

const DAY_NAMES_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getMonday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const UnifiedCalendarScreen = ({navigation}: any) => {
  const [weekDays, setWeekDays] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weekStart, setWeekStart] = useState(new Date());
  const [workoutItems, setWorkoutItems] = useState<any[]>([]);
  const [dietItems, setDietItems] = useState<any[]>([]);
  const [googleEvents, setGoogleEvents] = useState<
    Record<string, CalendarEvent[]>
  >({});
  const [trainerSessions, setTrainerSessions] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncModalVisible, setSyncModalVisible] = useState(false);

  useEffect(() => {
    loadPlans();
    loadStoredGoogleEvents();
  }, []);

  useEffect(() => {
    buildWeek(workoutItems, dietItems, googleEvents, trainerSessions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, workoutItems, dietItems, googleEvents, trainerSessions]);

  const loadStoredGoogleEvents = async () => {
    try {
      const stored = await AsyncStorage.getItem(ENV.GOOGLE_EVENTS_STORAGE_KEY);
      if (stored) {
        const parsed: Record<string, CalendarEvent[]> = JSON.parse(stored);
        Object.values(parsed).forEach(events =>
          events.forEach(e => {
            e.color = '#007AFF';
          }),
        );
        setGoogleEvents(parsed);
      }
    } catch (_) {}
  };

  const saveGoogleEvents = async (events: Record<string, CalendarEvent[]>) => {
    try {
      await AsyncStorage.setItem(
        ENV.GOOGLE_EVENTS_STORAGE_KEY,
        JSON.stringify(events),
      );
    } catch (_) {}
  };

  const loadPlans = async () => {
    setLoading(true);
    try {
      const [workoutRes, dietRes, hiresRes] = await Promise.all([
        apiClient.get('/ai/my-workout').catch(() => ({data: []})),
        apiClient.get('/ai/my-diet').catch(() => ({data: []})),
        apiClient.get('/trainers/hires/mine').catch(() => ({data: []})),
      ]);
      const wPlans: any[] = workoutRes.data || [];
      const dPlans: any[] = dietRes.data || [];
      const latestAiWorkoutPlan = wPlans[0];
      const wItems = latestAiWorkoutPlan?.items || [];
      const dItems = dPlans.length > 0 ? dPlans[0].items || [] : [];
      setWorkoutItems(wItems);
      setDietItems(dItems);

      const activeHires: any[] = (hiresRes.data || []).filter(
        (h: any) => h.status === 'active',
      );
      const allSessions: any[] = [];
      await Promise.all(
        activeHires.map(async (hire: any) => {
          try {
            const sRes = await apiClient.get(`/sessions/hire/${hire.id}`);
            (sRes.data.sessions || []).forEach((s: any) => {
              allSessions.push({
                ...s,
                hire_id: hire.id,
                trainer_name: hire.trainer_name,
                post_title: hire.title,
              });
            });
          } catch (_) {}
        }),
      );
      setTrainerSessions(allSessions);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  const buildWeek = (
    wItems: any[],
    dItems: any[],
    gEvents: Record<string, CalendarEvent[]>,
    tSessions: any[],
  ) => {
    const days = generateWeekDays(weekStart);
    const updatedDays = days.map(day => {
      const jsDay = new Date(day.date + 'T00:00:00').getDay();
      const fullDayName = DAY_NAMES_FULL[jsDay];
      const events: CalendarEvent[] = [];

      tSessions
        .filter(s => s.scheduled_date === day.date)
        .forEach(s => {
          const isConfirmed = s.status === 'confirmed';
          const isMissed = s.status === 'missed';
          events.push({
            id: `t-${s.id}`,
            type: 'trainer',
            title: s.post_title || 'Trainer Session',
            details: `${s.trainer_name} · ${s.scheduled_start}${
              isMissed ? ' · Missed' : isConfirmed ? ' · Confirmed' : ''
            }`,
            color: '#5856D6',
            sessionId: s.id,
            hireId: s.hire_id,
            trainerName: s.trainer_name,
            completed: isConfirmed,
          });
        });

      wItems
        .filter(i => i.day === fullDayName)
        .forEach(item => {
          const detail = [
            item.sets && `${item.sets} sets`,
            item.reps
              ? `${item.reps} reps`
              : item.duration
              ? `${item.duration}s`
              : null,
            formatMuscleLabel(item.muscle),
          ]
            .filter(Boolean)
            .join(' · ');
          events.push({
            id: `w-${item.id}`,
            type: 'workout',
            title: item.name,
            details: detail,
            completed: !!item.is_done,
            color: '#FF6B35',
            itemId: item.id,
          });
        });

      dItems
        .filter(i => {
          const match = i.day?.toLowerCase() === fullDayName.toLowerCase();
          if (dItems.length > 0 && i === dItems[0]) {
            console.log(
              '[Calendar] diet filter:',
              i.day,
              'vs',
              fullDayName,
              'match:',
              match,
            );
          }
          return match;
        })
        .forEach(item => {
          events.push({
            id: `d-${item.id}`,
            type: 'diet',
            title: item.title || item.meal_type,
            details: `${item.meal_type} · ${Math.round(
              item.calories || 0,
            )} kcal`,
            color: '#34C759',
            recipeId: item.recipe_id,
          });
        });

      (gEvents[day.date] || []).forEach(e => events.push(e));

      return {...day, events};
    });

    setWeekDays(updatedDays);
    setSelectedDay(prev => {
      const match = updatedDays.find(d => d.date === prev?.date);
      return match || updatedDays.find(d => d.isToday) || updatedDays[0];
    });
  };

  const generateWeekDays = (startDate: Date): DayData[] => {
    const days: DayData[] = [];
    const start = getMonday(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const jsDay = date.getDay();
      const dateStr = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        dayName: DAY_NAMES_SHORT[jsDay],
        dayNumber: date.getDate(),
        isToday: date.getTime() === today.getTime(),
        events: [],
      });
    }
    return days;
  };

  const handleSyncConfirm = async () => {
    setSyncModalVisible(false);
    setSyncing(true);
    try {
      GoogleSignin.configure({
        webClientId: ENV.WEB_CLIENT_ID,
        scopes: ['https://www.googleapis.com/auth/calendar'],
        offlineAccess: false,
      });
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      try {
        await GoogleSignin.signOut();
      } catch (_) {}
      await GoogleSignin.signIn();
      const {accessToken} = await GoogleSignin.getTokens();
      if (!accessToken) {
        throw new Error('No access token received');
      }

      const monday = getMonday(new Date());
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      const pad = (n: number) => String(n).padStart(2, '0');
      const toLocalISO = (d: Date) => {
        const offset = -d.getTimezoneOffset();
        const sign = offset >= 0 ? '+' : '-';
        const absOffset = Math.abs(offset);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
          d.getDate(),
        )}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(
          d.getSeconds(),
        )}${sign}${pad(Math.floor(absOffset / 60))}:${pad(absOffset % 60)}`;
      };
      const timeMin = toLocalISO(monday);
      const timeMax = toLocalISO(sunday);

      // ── Step 1: fetch existing Google events for the week ──
      const fetchRes = await axios.get(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          headers: {Authorization: `Bearer ${accessToken}`},
          params: {
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 200,
          },
        },
      );
      const allItems: any[] = fetchRes.data.items || [];

      // ── Step 2: delete previously synced app events ──
      const toDelete = allItems.filter(e =>
        e.description?.includes('source: fitdaptive'),
      );
      await Promise.all(
        toDelete.map(e =>
          axios
            .delete(
              `https://www.googleapis.com/calendar/v3/calendars/primary/events/${e.id}`,
              {
                headers: {Authorization: `Bearer ${accessToken}`},
              },
            )
            .catch(() => {}),
        ),
      );

      // ── Step 3: build date map from weekDays (day name → YYYY-MM-DD) ──
      const dayNameToDate: Record<string, string> = {};
      weekDays.forEach(d => {
        const jsDay = new Date(d.date + 'T00:00:00').getDay();
        dayNameToDate[DAY_NAMES_FULL[jsDay]] = d.date;
      });

      // ── Step 4: insert workout items into Google Calendar ──
      const workoutInserts = workoutItems
        .filter(item => dayNameToDate[item.day])
        .map(item => {
          const detail = [
            item.sets && `${item.sets} sets`,
            item.reps
              ? `${item.reps} reps`
              : item.duration
              ? `${item.duration}s`
              : null,
            formatMuscleLabel(item.muscle),
          ]
            .filter(Boolean)
            .join(' · ');
          return axios
            .post(
              'https://www.googleapis.com/calendar/v3/calendars/primary/events',
              {
                summary: item.name,
                description: `${detail}\nsource: fitdaptive`,
                start: {date: dayNameToDate[item.day]},
                end: {date: dayNameToDate[item.day]},
              },
              {headers: {Authorization: `Bearer ${accessToken}`}},
            )
            .catch(() => {});
        });

      // ── Step 5: insert diet items into Google Calendar ──
      const dietInserts = dietItems
        .filter(
          item =>
            dayNameToDate[
              item.day?.charAt(0).toUpperCase() +
                item.day?.slice(1).toLowerCase()
            ],
        )
        .map(item => {
          const dayKey =
            item.day?.charAt(0).toUpperCase() +
            item.day?.slice(1).toLowerCase();
          return axios
            .post(
              'https://www.googleapis.com/calendar/v3/calendars/primary/events',
              {
                summary: item.title || item.meal_type,
                description: `${item.meal_type} · ${Math.round(
                  item.calories || 0,
                )} kcal\nsource: fitdaptive`,
                start: {date: dayNameToDate[dayKey]},
                end: {date: dayNameToDate[dayKey]},
              },
              {headers: {Authorization: `Bearer ${accessToken}`}},
            )
            .catch(() => {});
        });

      await Promise.all([...workoutInserts, ...dietInserts]);

      // ── Step 6: build googleEvents state from non-app Google events ──
      const userItems = allItems.filter(
        e => !e.description?.includes('source: fitdaptive'),
      );
      const byDate: Record<string, CalendarEvent[]> = {};
      userItems.forEach((item: any) => {
        const dateStr =
          item.start?.date ||
          (() => {
            if (!item.start?.dateTime) {
              return null;
            }
            const dt = item.start.dateTime as string;
            const match = dt.match(/^(\d{4})-(\d{2})-(\d{2})/);
            return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
          })();
        if (!dateStr) {
          return;
        }
        if (!byDate[dateStr]) {
          byDate[dateStr] = [];
        }
        const startTime = item.start?.dateTime
          ? new Date(item.start.dateTime).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          : null;
        byDate[dateStr].push({
          id: `g-${item.id}`,
          type: 'google',
          title: item.summary || 'Google Event',
          details: startTime
            ? `${startTime}${item.location ? ' · ' + item.location : ''}`
            : item.location || undefined,
          color: '#007AFF',
        });
      });

      setGoogleEvents(byDate);
      await saveGoogleEvents(byDate);
      Alert.alert(
        'Synced',
        `Pushed ${
          workoutInserts.length + dietInserts.length
        } app events to Google Calendar. Imported ${
          userItems.length
        } Google events.`,
      );
    } catch (err: any) {
      if (err.code === 'SIGN_IN_CANCELLED' || err.code === '-5') {
      } else {
        Alert.alert(
          'Sync Failed',
          err?.message || 'Could not sync with Google Calendar.',
        );
      }
    } finally {
      setSyncing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPlans();
  }, []);

  const goToPreviousWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };
  const goToNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };
  const goToCurrentWeek = () => setWeekStart(new Date());

  const toggleWorkout = async (event: CalendarEvent) => {
    if (!event.itemId) {
      return;
    }
    try {
      const res = await apiClient.patch(`/workout/item/${event.itemId}/toggle`);
      const newDone = res.data.is_done;
      setWorkoutItems(prev =>
        prev.map(i => (i.id === event.itemId ? {...i, is_done: newDone} : i)),
      );
    } catch (_) {}
  };

  const getWeekRange = () => {
    if (weekDays.length === 0) {
      return '';
    }
    const first = new Date(weekDays[0].date + 'T00:00:00');
    const last = new Date(weekDays[6].date + 'T00:00:00');
    const mf = first.toLocaleString('default', {month: 'short'});
    const ml = last.toLocaleString('default', {month: 'short'});
    if (mf === ml) {
      return `${mf} ${first.getDate()} - ${last.getDate()}, ${first.getFullYear()}`;
    }
    return `${mf} ${first.getDate()} - ${ml} ${last.getDate()}, ${first.getFullYear()}`;
  };

  const renderEventIcon = (type: string) =>
    type === 'trainer'
      ? 'people'
      : type === 'workout'
      ? 'barbell'
      : type === 'diet'
      ? 'restaurant'
      : 'calendar';
  const selectedDayData =
    weekDays.find(d => d.date === selectedDay?.date) ?? selectedDay;

  if (loading && weekDays.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Week Navigation */}
      <View style={styles.weekHeader}>
        <TouchableOpacity onPress={goToPreviousWeek} style={styles.navButton}>
          <Icon name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.weekInfo}>
          <Text style={styles.weekRange}>{getWeekRange()}</Text>
          <View style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
            <TouchableOpacity
              onPress={goToCurrentWeek}
              style={styles.todayButton}>
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSyncModalVisible(true)}
              disabled={syncing}
              style={styles.syncIconBtn}>
              {syncing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.syncBtnText}>Sync</Text>
                  <Icon name="logo-google" size={16} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity onPress={goToNextWeek} style={styles.navButton}>
          <Icon name="chevron-forward" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Week Days Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daysStrip}>
        {weekDays.map(day => {
          const isSelected = selectedDay?.date === day.date;
          return (
            <TouchableOpacity
              key={day.date}
              style={[
                styles.dayCard,
                isSelected && styles.dayCardSelected,
                day.isToday && styles.dayCardToday,
              ]}
              onPress={() => setSelectedDay(day)}>
              <Text
                style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                {day.dayName}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected,
                ]}>
                {day.dayNumber}
              </Text>
              {day.events.length > 0 && (
                <View style={styles.eventDots}>
                  {(['trainer', 'workout', 'diet', 'google'] as const)
                    .filter(type => day.events.some(e => e.type === type))
                    .map(type => {
                      const color =
                        type === 'trainer'
                          ? '#5856D6'
                          : type === 'workout'
                          ? '#FF6B35'
                          : type === 'diet'
                          ? '#34C759'
                          : '#007AFF';
                      return (
                        <View
                          key={type}
                          style={[styles.eventDot, {backgroundColor: color}]}
                        />
                      );
                    })}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Events List */}
      <ScrollView
        style={styles.eventsContainer}
        contentContainerStyle={{paddingBottom: 30}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {selectedDayData && (
          <>
            <View style={styles.eventsHeader}>
              <Text style={styles.eventsTitle}>
                {selectedDayData.isToday ? 'Today' : selectedDayData.dayName},{' '}
                {new Date(
                  selectedDayData.date + 'T00:00:00',
                ).toLocaleDateString('en-US', {month: 'long', day: 'numeric'})}
              </Text>
              <Text style={styles.eventsCount}>
                {selectedDayData.events.length} events
              </Text>
            </View>
            {selectedDayData.events.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="calendar-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No events scheduled</Text>
              </View>
            ) : (
              selectedDayData.events.map(event => (
                <TouchableOpacity
                  key={event.id}
                  style={[styles.eventCard, {borderLeftColor: event.color}]}
                  onPress={() => {
                    if (event.type === 'workout' && event.itemId) {
                      const item = workoutItems.find(
                        i => i.id === event.itemId,
                      );
                      if (item) {
                        navigation.navigate('ExerciseDetail', {exercise: item});
                      }
                    } else if (event.type === 'diet' && event.recipeId) {
                      navigation.navigate('RecipeDetail', {
                        recipeId: event.recipeId,
                      });
                    } else if (event.type === 'trainer' && event.hireId) {
                      navigation.navigate('MemberSessions', {
                        hireId: event.hireId,
                        trainerName: event.trainerName,
                      });
                    }
                  }}>
                  <View style={styles.eventLeft}>
                    {event.type === 'workout' && (
                      <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() => toggleWorkout(event)}
                        disabled={!selectedDayData.isToday}>
                        <View
                          style={[
                            styles.checkboxInner,
                            event.completed && styles.checkboxChecked,
                            !selectedDayData.isToday && {
                              borderColor: '#e0e0e0',
                              backgroundColor: '#f5f5f5',
                            },
                          ]}>
                          {event.completed && (
                            <Icon name="checkmark" size={14} color="#fff" />
                          )}
                        </View>
                      </TouchableOpacity>
                    )}
                    <View
                      style={[
                        styles.eventIcon,
                        {backgroundColor: event.color + '20'},
                      ]}>
                      <Icon
                        name={renderEventIcon(event.type)}
                        size={20}
                        color={event.color}
                      />
                    </View>
                  </View>
                  <View style={styles.eventContent}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                      }}>
                      <Text
                        style={[
                          styles.eventTitle,
                          event.completed && styles.eventTitleCompleted,
                        ]}>
                        {event.title}
                      </Text>
                      {(event.type === 'trainer' ||
                        event.type === 'workout') && (
                        <View
                          style={{
                            backgroundColor: event.color + '22',
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 4,
                          }}>
                          <Text
                            style={{
                              fontSize: 10,
                              color: event.color,
                              fontWeight: '600',
                            }}>
                            {event.type === 'trainer' ? 'Trainer' : 'AI Plan'}
                          </Text>
                        </View>
                      )}
                    </View>
                    {event.details && (
                      <Text style={styles.eventDetails}>{event.details}</Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.eventTypeBadge,
                      {backgroundColor: event.color},
                    ]}>
                    <Text style={styles.eventTypeText}>
                      {event.type === 'trainer'
                        ? 'T'
                        : event.type === 'workout'
                        ? 'A'
                        : event.type === 'diet'
                        ? 'D'
                        : 'G'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          {color: '#5856D6', label: 'Trainer'},
          {color: '#FF6B35', label: 'AI Plan'},
          {color: '#34C759', label: 'Diet'},
          {color: '#007AFF', label: 'Google'},
        ].map(l => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: l.color}]} />
            <Text style={styles.legendText}>{l.label}</Text>
          </View>
        ))}
      </View>

      {/* Sync Confirmation Modal */}
      <Modal
        visible={syncModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSyncModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Icon
              name="logo-google"
              size={40}
              color="#007AFF"
              style={{marginBottom: 12}}
            />
            <Text style={styles.modalTitle}>Sync Google Calendar</Text>
            <Text style={styles.modalDesc}>
              This will push your workout and diet plan for this week (Mon–Sun)
              to Google Calendar, and import your Google Calendar events into
              the app.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSyncModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleSyncConfirm}>
                <Text style={styles.modalConfirmText}>Sync</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default UnifiedCalendarScreen;
