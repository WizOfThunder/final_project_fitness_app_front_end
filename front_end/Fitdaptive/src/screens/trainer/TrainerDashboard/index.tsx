import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
  AppState,
  Modal,
} from 'react-native';
import WebView from 'react-native-webview';
import {useFocusEffect} from '@react-navigation/native';
import {getCurrentPosition} from '../../../utils/geolocation';
import {fetchNearbyGyms} from '../../../utils/placesApi';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  initialize,
  requestPermission,
  readRecords,
  getGrantedPermissions,
} from 'react-native-health-connect';
import {apiClient} from '../../../services/api';
import {formatMuscleLabel} from '../../../utils/formatMuscleLabel';
import {styles} from './styles';
import {useAuth} from '../../../store/AuthContext';
import MemberDashboardContent from '../../../components/MemberDashboardContent';
import WeeklyStatsCard from '../../../components/WeeklyStatsCard';
import BrowseSections from '../../../components/BrowseSections';
import StreakBadge from '../../../components/StreakBadge';

const PLAN_STATUS_META: Record<
  string,
  {
    label: string;
    description: string;
    actionLabel: string;
    badgeBackground: string;
    badgeColor: string;
  }
> = {
  draft: {
    label: 'Pending Review',
    description: 'Your latest plan is waiting for admin review.',
    actionLabel: 'View Draft Plan',
    badgeBackground: '#FFF4DD',
    badgeColor: '#B26A00',
  },
  verified: {
    label: 'Approved',
    description: 'Your personalized plan is ready to use.',
    actionLabel: 'Open Plan',
    badgeBackground: '#E9F8EE',
    badgeColor: '#1B8A3C',
  },
  modified: {
    label: 'Reviewed',
    description: 'Your plan has been reviewed and updated.',
    actionLabel: 'Open Plan',
    badgeBackground: '#E8F2FF',
    badgeColor: '#1565C0',
  },
  denied: {
    label: 'Needs Changes',
    description: 'This plan was not approved and should be reviewed.',
    actionLabel: 'Review Plan',
    badgeBackground: '#FFF0F0',
    badgeColor: '#D93025',
  },
};

function toLocalDateOnly(value?: string | null) {
  if (!value) {
    return null;
  }
  const [year, month, day] = String(value).split('T')[0].split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
}

function isChallengeOngoing(endDate?: string | null) {
  const end = toLocalDateOnly(endDate);
  if (!end) {
    return true;
  }
  const today = new Date();
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return end >= todayOnly;
}

function isChallengeNotStarted(startDate?: string | null) {
  const start = toLocalDateOnly(startDate);
  if (!start) {
    return false;
  }
  const today = new Date();
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return start > todayOnly;
}

function getChallengeDaysLeft(endDate?: string | null) {
  const end = toLocalDateOnly(endDate);
  if (!end) {
    return 0;
  }

  const now = new Date();
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.ceil((end.getTime() - todayOnly.getTime()) / 86400000));
}

function formatLocalDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(value.getDate()).padStart(2, '0')}`;
}

function formatChallengeDateLabel(challenge: any) {
  const start = challenge?.start_date?.split('T')[0];
  const end = challenge?.end_date?.split('T')[0];

  if (start && end && start !== end) {
    return `${start} - ${end}`;
  }

  return start || end || 'Date TBA';
}

function formatChallengeTimeLabel(challenge: any) {
  const startTime = challenge?.event_start_time?.slice(0, 5);
  const endTime = challenge?.event_end_time?.slice(0, 5);

  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }

  if (startTime) {
    return `Starts ${startTime}`;
  }

  if (endTime) {
    return `Until ${endTime}`;
  }

  return 'Time TBA';
}

function formatPlanDate(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function sortPlansByLatest(plans: any[]) {
  return [...plans].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function hasChallengeTimePassed(date: Date, timeStr?: string | null) {
  if (!timeStr) {
    return true;
  }

  const [hours, minutes] = String(timeStr).split(':').map(Number);
  const targetTime = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
  );

  return new Date() >= targetTime;
}

function isManualChallengeSubmittable(challenge: any) {
  if (challenge?.challenge_type === 'auto') {
    return false;
  }

  const endDate = toLocalDateOnly(challenge?.end_date);
  if (!endDate) {
    return false;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (today > endDate) {
    return true;
  }

  if (today.getTime() !== endDate.getTime()) {
    return false;
  }

  if (!challenge?.event_end_time) {
    return false;
  }

  return hasChallengeTimePassed(endDate, challenge.event_end_time);
}

function getChallengeNotice(challenge: any) {
  if (!challenge || challenge.status === 'completed') {
    return null;
  }

  if (challenge.challenge_type === 'auto') {
    const targetValue = Number(challenge.target_value ?? 0);
    const currentValue = Number(challenge.current_value ?? 0);

    if (targetValue > 0 && currentValue >= targetValue) {
      return {
        icon: 'gift-outline',
        label: 'Reward can be claimed',
        tone: 'ready',
      };
    }

    if (isChallengeNotStarted(challenge.start_date)) {
      return {
        icon: 'calendar-outline',
        label: `This challenge starts on ${challenge.start_date?.split('T')[0] || 'TBA'}`,
        tone: 'scheduled',
      };
    }

    return null;
  }

  if (challenge.has_pending_request) {
    return {
      icon: 'time-outline',
      label: 'Awaiting review',
      tone: 'pending',
    };
  }

  if (isManualChallengeSubmittable(challenge)) {
    return {
      icon: 'checkmark-done-outline',
      label: 'Can be submitted now',
      tone: 'ready',
    };
  }

  return null;
}

function getChallengeUnit(type: string | null | undefined) {
  return type === 'distance' ? 'km' : type || 'progress';
}

function formatChallengeValue(
  value: number | string | null | undefined,
  type: string | null | undefined,
  fixedDecimals = false,
) {
  const numericValue = Number(value ?? 0);
  if (type === 'distance') {
    return numericValue.toLocaleString(undefined, {
      minimumFractionDigits: fixedDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    });
  }
  return numericValue.toLocaleString();
}

export default function TrainerDashboard({navigation}: any) {
  const {user} = useAuth();
  const isApproved = user?.certification_status === 'approved';
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [myChallenges, setMyChallenges] = useState<any[]>([]);
  const [todayExercises, setTodayExercises] = useState<any[]>([]);
  const [todayTrainerSessions, setTodayTrainerSessions] = useState<any[]>([]);
  const [latestWorkoutPlan, setLatestWorkoutPlan] = useState<any>(null);
  const [latestDietPlan, setLatestDietPlan] = useState<any>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [streakRefreshKey, setStreakRefreshKey] = useState(0);
  const [weeklyStatsRefreshKey, setWeeklyStatsRefreshKey] = useState(0);
  const [trainerHealthStats, setTrainerHealthStats] = useState<{
    steps: number;
    caloriesBurned: number;
    sleepHours: number;
    distanceKm: number;
    exerciseMinutes: number;
    bloodPressure: string;
    heartRate: number;
  } | null>(null);
  const [location, setLocation] = useState({
    latitude: -7.2575,
    longitude: 112.7521,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [mapLoading, setMapLoading] = useState(true);
  const [gyms, setGyms] = useState<
    {id: string; name: string; latitude: number; longitude: number}[]
  >([]);

  const appState = useRef(AppState.currentState);
  const healthInitialized = useRef(false);

  useEffect(() => {
    requestLocationPermission();
    initializeHealthConnect();

    const sub = AppState.addEventListener('change', nextState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active' &&
        healthInitialized.current
      ) {
        fetchTrainerHealthData();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
    // This dashboard intentionally bootstraps once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeHealthConnect = async () => {
    try {
      const initialized = await initialize();
      if (!initialized) {
        setTrainerHealthStats({
          steps: 0,
          caloriesBurned: 0,
          sleepHours: 0,
          distanceKm: 0,
          exerciseMinutes: 0,
          bloodPressure: '--',
          heartRate: 0,
        });
        return;
      }
      const needed = [
        'Steps',
        'ActiveCaloriesBurned',
        'TotalCaloriesBurned',
        'SleepSession',
        'Distance',
        'ExerciseSession',
        'BloodPressure',
        'HeartRate',
      ];
      const granted = await getGrantedPermissions();
      const grantedTypes = granted.map((p: any) => p.recordType);
      const allGranted = needed.every(t => grantedTypes.includes(t));
      healthInitialized.current = true;
      if (allGranted) {
        await fetchTrainerHealthData();
      } else {
        await requestPermission(
          needed.map(t => ({accessType: 'read', recordType: t})),
        );
      }
    } catch (error) {
      console.error('Health Connect init error:', error);
      setTrainerHealthStats({
        steps: 0,
        caloriesBurned: 0,
        sleepHours: 0,
        distanceKm: 0,
        exerciseMinutes: 0,
        bloodPressure: '--',
        heartRate: 0,
      });
    }
  };

  const fetchTrainerHealthData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const sleepStart = new Date();
      sleepStart.setDate(sleepStart.getDate() - 1);
      sleepStart.setHours(12, 0, 0, 0);

      const stepsData = await readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });
      const totalSteps = stepsData.records.reduce(
        (sum: number, record: any) => sum + (record.count || 0),
        0,
      );

      // Calories from today midnight until now
      let totalCalories = 0;
      try {
        const activeCalData = await readRecords('ActiveCaloriesBurned', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });
        totalCalories = activeCalData.records.reduce(
          (sum: number, record: any) =>
            sum + (record.energy?.inKilocalories || 0),
          0,
        );
      } catch (_) {}
      if (totalCalories === 0) {
        try {
          const totalCalData = await readRecords('TotalCaloriesBurned', {
            timeRangeFilter: {
              operator: 'between',
              startTime: startDate.toISOString(),
              endTime: endDate.toISOString(),
            },
          });
          totalCalories = totalCalData.records.reduce(
            (sum: number, record: any) =>
              sum + (record.energy?.inKilocalories || 0),
            0,
          );
        } catch (_) {}
      }

      const sleepData = await readRecords('SleepSession', {
        timeRangeFilter: {
          operator: 'between',
          startTime: sleepStart.toISOString(),
          endTime: endDate.toISOString(),
        },
      });
      let sleepHours = 0;
      if (sleepData.records.length > 0) {
        const longest = sleepData.records.reduce((best: any, record: any) => {
          const dur =
            new Date(record.endTime).getTime() -
            new Date(record.startTime).getTime();
          const bestDur =
            new Date(best.endTime).getTime() -
            new Date(best.startTime).getTime();
          return dur > bestDur ? record : best;
        });
        sleepHours =
          (new Date(longest.endTime).getTime() -
            new Date(longest.startTime).getTime()) /
          3600000;
      }

      const distanceData = await readRecords('Distance', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });
      const totalDistanceMeters = distanceData.records.reduce(
        (sum: number, record: any) => sum + (record.distance?.inMeters || 0),
        0,
      );
      const distanceKm = totalDistanceMeters / 1000;

      const exerciseData = await readRecords('ExerciseSession', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });
      const exerciseMinutes = exerciseData.records.reduce(
        (sum: number, record: any) =>
          sum +
          (new Date(record.endTime).getTime() -
            new Date(record.startTime).getTime()) /
            60000,
        0,
      );

      const bpData = await readRecords('BloodPressure', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });
      let bloodPressure = '--';
      if (bpData.records.length > 0) {
        const latest: any = bpData.records[bpData.records.length - 1];
        const sys = Math.round(latest.systolic?.inMillimetersOfMercury || 0);
        const dia = Math.round(latest.diastolic?.inMillimetersOfMercury || 0);
        bloodPressure = `${sys}/${dia}`;
      }

      const hrData = await readRecords('HeartRate', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });
      let heartRate = 0;
      if (hrData.records.length > 0) {
        const latest: any = hrData.records[hrData.records.length - 1];
        heartRate = Math.round(
          latest.samples?.[latest.samples.length - 1]?.beatsPerMinute || 0,
        );
      }

      setTrainerHealthStats({
        steps: Math.round(totalSteps),
        caloriesBurned: Math.round(totalCalories),
        sleepHours: parseFloat(sleepHours.toFixed(1)),
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        exerciseMinutes: Math.round(exerciseMinutes),
        bloodPressure,
        heartRate,
      });

      try {
        await apiClient.post('/activity/sync', {
          date: formatLocalDate(new Date()),
          steps: Math.round(totalSteps),
          calories: Math.round(totalCalories),
          distance: parseFloat(distanceKm.toFixed(2)),
          exercise_minutes: Math.round(exerciseMinutes),
          sleep_hours: parseFloat(sleepHours.toFixed(1)),
        });
        setWeeklyStatsRefreshKey(k => k + 1);
      } catch (_) {}
    } catch (error) {
      console.error('Fetch health data error:', error);
    }
  };

  const fetchMyChallenges = useCallback(async () => {
    try {
      const res = await apiClient.get('/challenges/my');
      setMyChallenges(
        (res.data as any[]).filter(
          (uc: any) =>
            uc.status === 'active' && isChallengeOngoing(uc.end_date),
        ),
      );
    } catch (_) {}
  }, []);

  const fetchTodaySchedule = useCallback(async () => {
    const DAY_NAMES = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const todayName = DAY_NAMES[new Date().getDay()];
    const todayDate = formatLocalDate(new Date());

    try {
      const workoutRes = await apiClient.get('/ai/my-workout');
      const workoutPlans = sortPlansByLatest(
        (workoutRes.data || []).filter((item: any) => item.generated_by === 'ai'),
      );
      const latestWorkout = workoutPlans[0] || null;
      setLatestWorkoutPlan(latestWorkout);
      setTodayExercises(
        latestWorkout
          ? (latestWorkout.items || []).filter(
              (item: any) => item.day === todayName,
            )
          : [],
      );
    } catch (_) {
      setLatestWorkoutPlan(null);
      setTodayExercises([]);
    }

    try {
      const dietRes = await apiClient.get('/ai/my-diet');
      const dietPlans = sortPlansByLatest(dietRes.data || []);
      setLatestDietPlan(dietPlans[0] || null);
    } catch (_) {
      setLatestDietPlan(null);
    }

    try {
      const hiresRes = await apiClient
        .get('/trainers/hires/mine')
        .catch(() => ({data: []}));
      const activeHires = (hiresRes.data || []).filter(
        (h: any) => h.status === 'active',
      );
      const sessions: any[] = [];
      await Promise.all(
        activeHires.map(async (hire: any) => {
          try {
            const sRes = await apiClient.get(`/sessions/hire/${hire.id}`);
            (sRes.data.sessions || [])
              .filter((s: any) => s.scheduled_date === todayDate)
              .forEach((s: any) => {
                sessions.push({
                  ...s,
                  hire_id: hire.id,
                  hire_status: hire.status,
                  trainer_name: hire.trainer_name,
                  post_title: hire.title,
                });
              });
          } catch (_) {}
        }),
      );
      setTodayTrainerSessions(sessions);
    } catch (_) {
      setTodayTrainerSessions([]);
    }
  }, []);

  const handleToggle = async (itemId: number) => {
    setTogglingId(itemId);
    try {
      const res = await apiClient.patch(`/workout/item/${itemId}/toggle`, {
        date: formatLocalDate(new Date()),
      });
      const updated = res.data.is_done;
      const newExercises = todayExercises.map(item =>
        item.id === itemId ? {...item, is_done: updated} : item,
      );
      setTodayExercises(newExercises);
      if (newExercises.length > 0 && newExercises.every(i => i.is_done)) {
        const completeRes = await apiClient
          .post('/activity/workout-complete', {
            date: formatLocalDate(new Date()),
          })
          .catch(() => null);
        if (completeRes?.data?.marked) {
          setStreakRefreshKey(k => k + 1);
        }
        setWorkoutComplete(true);
      }
    } catch (_) {}
    setTogglingId(null);
  };

  const openTrainerSession = (session: any) => {
    if (!session.hire_id) {
      return;
    }

    navigation.navigate('Trainers', {
      screen: 'MemberSessions',
      params: {
        hireId: session.hire_id,
        trainerName: session.trainer_name,
        hireStatus: session.hire_status,
      },
    });
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, notifRes] = await Promise.all([
        apiClient.get('/trainers/dashboard-stats'),
        apiClient.get('/notification/my'),
      ]);
      setDashboardStats(statsRes.data);
      setNotifications(notifRes.data || []);
    } catch (_) {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isApproved) {
        return;
      }

      fetchDashboardData();
      fetchMyChallenges();
      fetchTodaySchedule();
    }, [fetchDashboardData, fetchMyChallenges, fetchTodaySchedule, isApproved]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    await fetchTrainerHealthData();
    await fetchMyChallenges();
    await fetchTodaySchedule();
    getCurrentLocation();
    setRefreshing(false);
  };

  const requestLocationPermission = async () => {
    getCurrentLocation();
  };

  const getCurrentLocation = () => {
    setMapLoading(true);
    getCurrentPosition(
      async (position: any) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLocation({
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setMapLoading(false);
        const nearby = await fetchNearbyGyms(lat, lon);
        setGyms(nearby);
      },
      (error: any) => {
        console.error('Location error:', JSON.stringify(error));
        setMapLoading(false);
      },
    );
  };

  const openGymInMaps = (lat: number, lon: number, name: string) => {
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        name,
      )}&center=${lat},${lon}`,
    );
  };

  const planCards = [
    {
      key: 'workout',
      title: 'Workout Plan',
      icon: 'barbell-outline',
      accentColor: '#FF6B35',
      emptyDescription:
        'Generate a personalized workout plan based on your goals, level, and equipment.',
      emptyAction: 'Generate Plan',
      emptyScreen: 'FitnessSurvey',
      planScreen: 'AIWorkoutPlan',
      plan: latestWorkoutPlan,
    },
    {
      key: 'diet',
      title: 'Diet Plan',
      icon: 'restaurant-outline',
      accentColor: '#34C759',
      emptyDescription:
        'Build a personalized diet plan that matches your goal and meal preferences.',
      emptyAction: 'Generate Plan',
      emptyScreen: 'DietSurvey',
      planScreen: 'AIDietPlan',
      plan: latestDietPlan,
    },
  ].map(card => {
    if (!card.plan) {
      return {
        ...card,
        badgeLabel: 'Not Generated',
        badgeBackground: card.accentColor + '18',
        badgeColor: card.accentColor,
        description: card.emptyDescription,
        actionLabel: card.emptyAction,
        screen: card.emptyScreen,
      };
    }

    const statusMeta = PLAN_STATUS_META[card.plan.status] || {
      label: 'Available',
      description: 'Your latest AI plan is ready to open.',
      actionLabel: 'Open Plan',
      badgeBackground: card.accentColor + '18',
      badgeColor: card.accentColor,
    };
    const createdDate = formatPlanDate(card.plan.created_at);

    return {
      ...card,
      badgeLabel: statusMeta.label,
      badgeBackground: statusMeta.badgeBackground,
      badgeColor: statusMeta.badgeColor,
      description: createdDate
        ? `${statusMeta.description} Updated ${createdDate}.`
        : statusMeta.description,
      actionLabel: statusMeta.actionLabel,
      screen: card.planScreen,
    };
  });

  if (!isApproved) {
    const pendingBanner = (
      <View style={styles.pendingBanner}>
        <Icon
          name={
            user?.certification_status === 'rejected' ? 'close-circle' : 'time'
          }
          size={22}
          color={
            user?.certification_status === 'rejected' ? '#FF3B30' : '#FF9500'
          }
        />
        <View style={styles.pendingBannerText}>
          <Text style={styles.pendingBannerTitle}>
            {user?.certification_status === 'rejected'
              ? 'Certification Rejected'
              : 'Certification Pending Approval'}
          </Text>
          <Text style={styles.pendingBannerSub}>
            {user?.certification_status === 'rejected'
              ? 'Your certification was rejected. Please contact admin at fitdaptive@gmail.com.'
              : 'Trainer features will be unlocked once an admin approves your certification.'}
          </Text>
        </View>
      </View>
    );
    return (
      <MemberDashboardContent
        navigation={navigation}
        headerContent={pendingBanner}
      />
    );
  }

  const quickActions = [
    {
      id: '14',
      title: 'My Clients',
      icon: 'person-add',
      color: '#007AFF',
      screen: 'TrainerHireManagement',
    },
    {
      id: '15',
      title: 'Manage Posts',
      icon: 'document-text',
      color: '#34C759',
      screen: 'ManagePosts',
    },
    {
      id: '5',
      title: 'Manage Challenges',
      icon: 'checkmark-done',
      color: '#FF6B35',
      screen: 'ManageChallenge',
    },
    {
      id: '12',
      title: 'Find Trainers',
      icon: 'people',
      color: '#007AFF',
      screen: 'TrainerList',
    },
    {
      id: '6',
      title: 'Challenges',
      icon: 'ribbon',
      color: '#FFD700',
      screen: 'ChallengeList',
    },
    {
      id: '11',
      title: 'Achievements',
      icon: 'medal',
      color: '#FF9500',
      screen: 'Achievement',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#FF6B35']}
        />
      }>
      <View style={styles.planHeroSection}>
        <Text style={styles.sectionTitle}>Your AI Plans</Text>
        <Text style={styles.planHeroSubtitle}>
          Generate and manage your personalized workout and diet plans from one
          place.
        </Text>
        <View style={styles.planCardsColumn}>
          {planCards.map(card => (
            <TouchableOpacity
              key={card.key}
              style={styles.planCard}
              activeOpacity={0.88}
              onPress={() => navigation.navigate(card.screen)}>
              <View style={styles.planCardTopRow}>
                <View
                  style={[
                    styles.planIconWrap,
                    {backgroundColor: card.accentColor + '18'},
                  ]}>
                  <Icon
                    name={card.icon}
                    size={22}
                    color={card.accentColor}
                  />
                </View>
                <View
                  style={[
                    styles.planStatusBadge,
                    {backgroundColor: card.badgeBackground},
                  ]}>
                  <Text
                    style={[
                      styles.planStatusBadgeText,
                      {color: card.badgeColor},
                    ]}>
                    {card.badgeLabel}
                  </Text>
                </View>
              </View>
              <Text style={styles.planCardTitle}>{card.title}</Text>
              <Text style={styles.planCardDescription}>{card.description}</Text>
              <View style={styles.planCardFooter}>
                <Text
                  style={[
                    styles.planCardActionText,
                    {color: card.accentColor},
                  ]}>
                  {card.actionLabel}
                </Text>
                <Icon
                  name="arrow-forward-circle"
                  size={22}
                  color={card.accentColor}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Personal Health Stats */}
      <View style={styles.healthSection}>
        <Text style={styles.sectionTitle}>Your Health Today</Text>
        {trainerHealthStats === null ? (
          <ActivityIndicator size="small" color="#FF6B35" />
        ) : (
          <View style={styles.healthRow}>
            <View style={styles.healthBox}>
              <Icon name="walk" size={20} color="#FF6B35" />
              <Text style={styles.healthValue}>
                {trainerHealthStats.steps.toLocaleString()}
              </Text>
              <Text style={styles.healthLabel}>Steps</Text>
            </View>
            <View style={styles.healthBox}>
              <Icon name="flame" size={20} color="#FF6B35" />
              <Text style={styles.healthValue}>
                {trainerHealthStats.caloriesBurned}
              </Text>
              <Text style={styles.healthLabel}>Calories</Text>
            </View>
            <View style={styles.healthBox}>
              <Icon name="moon" size={20} color="#5856D6" />
              <Text style={styles.healthValue}>
                {trainerHealthStats.sleepHours}h
              </Text>
              <Text style={styles.healthLabel}>Sleep</Text>
            </View>
            <View style={styles.healthBox}>
              <Icon name="navigate" size={20} color="#34C759" />
              <Text style={styles.healthValue}>
                {trainerHealthStats.distanceKm} km
              </Text>
              <Text style={styles.healthLabel}>Distance</Text>
            </View>
            <View style={styles.healthBox}>
              <Icon name="barbell" size={20} color="#FF9500" />
              <Text style={styles.healthValue}>
                {trainerHealthStats.exerciseMinutes} min
              </Text>
              <Text style={styles.healthLabel}>Exercise</Text>
            </View>
            <View style={styles.healthBox}>
              <Icon name="pulse" size={20} color="#FF3B30" />
              <Text style={styles.healthValue}>
                {trainerHealthStats.bloodPressure}
              </Text>
              <Text style={styles.healthLabel}>BP (mmHg)</Text>
            </View>
            <View style={styles.healthBox}>
              <Icon name="heart" size={20} color="#FF2D55" />
              <Text style={styles.healthValue}>
                {trainerHealthStats.heartRate > 0
                  ? `${trainerHealthStats.heartRate}`
                  : '--'}
              </Text>
              <Text style={styles.healthLabel}>HR (bpm)</Text>
            </View>
          </View>
        )}
      </View>

      {/* This Week */}
      <StreakBadge refreshKey={streakRefreshKey} />
      <WeeklyStatsCard refreshKey={weeklyStatsRefreshKey} />

      <View style={styles.syncReminder}>
        <Icon name="information-circle-outline" size={15} color="#007AFF" />
        <Text style={styles.syncReminderText}>
          Open the app at the end of the day to sync your Health Connect data and keep your progress up to date.
        </Text>
      </View>

      {/* Active Challenges */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Challenges</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ChallengeList')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {myChallenges.length === 0 ? (
          <TouchableOpacity
            style={styles.challengeEmptyCard}
            onPress={() => navigation.navigate('ChallengeList')}>
            <Text style={styles.challengeEmptyText}>
              No active challenges yet
            </Text>
            <Text style={styles.challengeEmptySubText}>
              Tap "See All" to browse and join challenges!
            </Text>
          </TouchableOpacity>
        ) : (
          myChallenges.slice(0, 3).map((uc: any) => {
            const isAutoChallenge = uc.challenge_type === 'auto';
            const challengeNotice = getChallengeNotice(uc);
            const targetValue = Number(uc.target_value ?? 0);
            const currentValue = Number(uc.current_value ?? 0);
            const challengeUnit = getChallengeUnit(uc.type);
            const showDecimalProgress = uc.type === 'distance';
            const progress =
              targetValue > 0
                ? Math.min(
                    (currentValue / targetValue) * 100,
                    100,
                  )
                : 0;
            const progressLabel = showDecimalProgress
              ? progress.toFixed(2)
              : Math.round(progress).toString();
            const daysLeft = getChallengeDaysLeft(uc.end_date);
            return (
              <TouchableOpacity
                key={uc.id}
                style={styles.challengeCard}
                onPress={() =>
                    navigation.navigate('ChallengeDetail', {
                      challengeId: uc.challenge_id,
                      joined: true,
                    })
                  }>
                  <View style={styles.challengeTopRow}>
                    <View style={styles.challengeBadgeRow}>
                      <View
                        style={[
                          styles.challengeTypeChip,
                          isAutoChallenge
                            ? styles.challengeTypeChipAuto
                            : styles.challengeTypeChipManual,
                        ]}>
                        <Icon
                          name={
                            isAutoChallenge
                              ? 'sync-outline'
                              : uc.challenge_type === 'online'
                              ? 'globe-outline'
                              : 'location-outline'
                          }
                          size={12}
                          color={isAutoChallenge ? '#007AFF' : '#7C3AED'}
                        />
                        <Text
                          style={[
                            styles.challengeTypeText,
                            isAutoChallenge
                              ? styles.challengeTypeTextAuto
                              : styles.challengeTypeTextManual,
                          ]}>
                          {isAutoChallenge
                            ? `Auto${uc.type ? ` • ${uc.type}` : ''}`
                            : uc.challenge_type === 'online'
                            ? 'Online event'
                            : 'Offline event'}
                        </Text>
                      </View>
                    </View>
                    <Icon
                      name="chevron-forward"
                      size={18}
                      color="#C4C4C4"
                    />
                  </View>
                  <View style={styles.challengeHeader}>
                    <Text style={styles.challengeName} numberOfLines={1}>
                      {uc.title}
                    </Text>
                    <View style={styles.challengeDaysPill}>
                      <Text style={styles.challengeDays}>{daysLeft}d left</Text>
                    </View>
                  </View>
                  {isAutoChallenge ? (
                    <>
                      <View style={styles.challengeProgressHeader}>
                        <Text style={styles.challengeMetricText}>
                          {formatChallengeValue(currentValue, uc.type, showDecimalProgress)} /{' '}
                          {formatChallengeValue(targetValue, uc.type)} {challengeUnit}
                        </Text>
                        <Text style={styles.challengePercentStrong}>
                          {progressLabel}%
                        </Text>
                      </View>
                      <View style={styles.challengeProgress}>
                        <View
                          style={[
                          styles.challengeProgressFill,
                          {width: `${progress}%`},
                        ]}
                      />
                      </View>
                      <Text style={styles.challengePercent}>
                        Progress tracked automatically from the challenge start
                      </Text>
                    </>
                  ) : (
                  <>
                    <View style={styles.challengeMetaRow}>
                      <Icon name="calendar-outline" size={14} color="#666" />
                      <Text style={styles.challengeMetaText}>
                        {formatChallengeDateLabel(uc)}
                      </Text>
                    </View>
                    <View style={styles.challengeMetaRow}>
                      <Icon name="time-outline" size={14} color="#666" />
                      <Text style={styles.challengeMetaText}>
                        {formatChallengeTimeLabel(uc)}
                      </Text>
                      </View>
                    </>
                  )}
                  <View style={styles.challengeFooter}>
                    <View style={styles.challengeFooterPill}>
                      <Icon name="trophy-outline" size={13} color="#FF9500" />
                      <Text style={styles.challengeFooterText}>
                        {uc.points ?? 0} pts
                      </Text>
                    </View>
                    {isAutoChallenge ? (
                      <View style={styles.challengeFooterPill}>
                        <Icon
                          name="flag-outline"
                          size={13}
                          color="#007AFF"
                        />
                        <Text style={styles.challengeFooterText}>
                          Target {formatChallengeValue(targetValue, uc.type)} {challengeUnit}
                        </Text>
                      </View>
                    ) : uc.location ? (
                      <View style={styles.challengeFooterPill}>
                        <Icon
                          name="location-outline"
                          size={13}
                          color="#7C3AED"
                        />
                        <Text style={styles.challengeFooterText}>
                          {uc.location}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {challengeNotice ? (
                    <View
                      style={[
                        styles.challengeNotice,
                        challengeNotice.tone === 'ready'
                          ? styles.challengeNoticeReady
                          : challengeNotice.tone === 'pending'
                          ? styles.challengeNoticePending
                          : styles.challengeNoticeScheduled,
                      ]}>
                      <Icon
                        name={challengeNotice.icon}
                        size={14}
                        color={
                          challengeNotice.tone === 'ready'
                            ? '#1B8A3C'
                            : challengeNotice.tone === 'pending'
                            ? '#B26A00'
                            : '#1565C0'
                        }
                      />
                      <Text
                        style={[
                          styles.challengeNoticeText,
                          challengeNotice.tone === 'ready'
                            ? styles.challengeNoticeTextReady
                            : challengeNotice.tone === 'pending'
                            ? styles.challengeNoticeTextPending
                            : styles.challengeNoticeTextScheduled,
                        ]}>
                        {challengeNotice.label}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })
        )}
      </View>

      {/* Client Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client Overview</Text>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, {backgroundColor: '#FF6B35'}]}>
            <Icon name="people" size={28} color="#fff" />
            <Text style={styles.statValue}>
              {dashboardStats?.total_clients ?? '—'}
            </Text>
            <Text style={styles.statLabel}>Active Clients</Text>
          </View>
          <View style={[styles.statCard, {backgroundColor: '#34C759'}]}>
            <Icon name="checkmark-circle" size={28} color="#fff" />
            <Text style={styles.statValue}>
              {dashboardStats?.confirmed_today ?? '—'}/
              {dashboardStats?.scheduled_today ?? '—'}
            </Text>
            <Text style={styles.statLabel}>Confirmed Today</Text>
          </View>
          <View style={[styles.statCard, {backgroundColor: '#007AFF'}]}>
            <Icon name="chatbubbles" size={28} color="#fff" />
            <Text style={styles.statValue}>
              {dashboardStats?.unread_messages ?? '—'}
            </Text>
            <Text style={styles.statLabel}>Unread Messages</Text>
          </View>
          <View style={[styles.statCard, {backgroundColor: '#FFD700'}]}>
            <Icon name="person-add" size={28} color="#fff" />
            <Text style={styles.statValue}>
              {dashboardStats?.new_requests ?? '—'}
            </Text>
            <Text style={styles.statLabel}>New Requests</Text>
          </View>
        </View>
      </View>

      {/* Today's Schedule */}
      {(todayTrainerSessions.length > 0 || todayExercises.length > 0) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Workouts', {
                  screen: 'UnifiedCalendar',
                })
              }>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {todayTrainerSessions.map((s: any) => (
            <TouchableOpacity
              key={`t-${s.id}`}
              activeOpacity={0.85}
              onPress={() => openTrainerSession(s)}
              style={[
                styles.scheduleExerciseRow,
                {borderLeftWidth: 3, borderLeftColor: '#5856D6'},
                styles.scheduleExerciseRowBorder,
              ]}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  backgroundColor: '#5856D6',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                <Icon name="people" size={14} color="#fff" />
              </View>
              <View style={{flex: 1}}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 2,
                  }}>
                  <Text style={styles.scheduleExerciseName}>
                    {s.post_title || 'Trainer Session'}
                  </Text>
                  <View
                    style={{
                      backgroundColor: '#5856D620',
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                      borderRadius: 4,
                    }}>
                    <Text
                      style={{
                        fontSize: 10,
                        color: '#5856D6',
                        fontWeight: '600',
                      }}>
                      Trainer
                    </Text>
                  </View>
                </View>
                <Text style={styles.scheduleExerciseDetail}>
                  {s.trainer_name} · {s.scheduled_start} ·{' '}
                  <Text
                    style={{
                      color:
                        s.status === 'confirmed'
                          ? '#34C759'
                          : s.status === 'missed'
                          ? '#FF3B30'
                          : '#888',
                    }}>
                    {s.status}
                  </Text>
                </Text>
              </View>
              <Icon name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>
          ))}
          {todayExercises.map((item: any, index: number) => {
            const isDone = !!item.is_done;
            const isToggling = togglingId === item.id;
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
            return (
              <View
                key={item.id}
                style={[
                  styles.scheduleExerciseRow,
                  {borderLeftWidth: 3, borderLeftColor: '#FF6B35'},
                  index < todayExercises.length - 1 &&
                    styles.scheduleExerciseRowBorder,
                  isToggling && {opacity: 0.5},
                ]}>
                <TouchableOpacity
                  style={[
                    styles.scheduleCheckbox,
                    isDone && styles.scheduleCheckboxDone,
                  ]}
                  onPress={() => handleToggle(item.id)}
                  disabled={isToggling}>
                  {isDone && <Icon name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={{flex: 1}}
                  onPress={() =>
                    navigation.navigate('ExerciseDetail', {exercise: item})
                  }>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 2,
                    }}>
                    <Text
                      style={[
                        styles.scheduleExerciseName,
                        isDone && styles.scheduleExerciseNameDone,
                      ]}>
                      {item.name.length > 25
                        ? item.name.slice(0, 25) + '...'
                        : item.name}
                    </Text>
                    <View
                      style={{
                        backgroundColor: '#FF6B3520',
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: 4,
                      }}>
                      <Text
                        style={{
                          fontSize: 10,
                          color: '#FF6B35',
                          fontWeight: '600',
                        }}>
                        AI Plan
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.scheduleExerciseDetail}>{detail}</Text>
                </TouchableOpacity>
                <Icon name="chevron-forward" size={16} color="#ccc" />
              </View>
            );
          })}
        </View>
      )}

      {/* Client Activity Feed */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client Activity</Text>
        {(dashboardStats?.client_activity || []).length === 0 ? (
          <View style={styles.activityItem}>
            <Text
              style={{
                color: '#ccc',
                textAlign: 'center',
                flex: 1,
                paddingVertical: 12,
              }}>
              No recent session activity
            </Text>
          </View>
        ) : (
          (dashboardStats?.client_activity || []).map((item: any) => {
            const isConfirmed = item.status === 'confirmed';
            const timeStr = item.member_confirmed_at
              ? new Date(item.member_confirmed_at).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : item.scheduled_start;
            return (
              <View key={item.id} style={styles.activityItem}>
                <View
                  style={[
                    styles.activityIcon,
                    {backgroundColor: isConfirmed ? '#E8F5E9' : '#FFF0F0'},
                  ]}>
                  <Icon
                    name={isConfirmed ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={isConfirmed ? '#34C759' : '#FF3B30'}
                  />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityClient}>{item.member_name}</Text>
                  <Text style={styles.activityText}>
                    {isConfirmed ? 'Confirmed attendance' : 'Missed session'} —{' '}
                    {item.post_title}
                  </Text>
                  <Text style={styles.activityTime}>
                    {item.scheduled_day} {timeStr}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {notifications.length === 0 ? (
          <View style={styles.activityItem}>
            <Text
              style={{
                color: '#ccc',
                textAlign: 'center',
                flex: 1,
                paddingVertical: 12,
              }}>
              No recent activity
            </Text>
          </View>
        ) : (
          notifications.slice(0, 5).map((notif: any, i: number) => (
            <View key={i} style={styles.activityItem}>
              <View style={[styles.activityIcon, {backgroundColor: '#FFF0EB'}]}>
                <Icon name="notifications" size={20} color="#FF6B35" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityClient}>{notif.title}</Text>
                <Text style={styles.activityTime}>
                  {new Date(notif.created_at).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Nearby Gyms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nearby Gyms</Text>
        {mapLoading ? (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        ) : (
          <WebView
            key={`${location.latitude},${location.longitude},${gyms.length}`}
            style={styles.map}
            onMessage={e => {
              const {lat, lon, name} = JSON.parse(e.nativeEvent.data);
              openGymInMaps(lat, lon, name);
            }}
            source={{
              html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>html,body,#map{margin:0;padding:0;height:100%;width:100%}</style></head><body><div id="map"></div><script>var map=L.map('map').setView([${
                location.latitude
              },${
                location.longitude
              }],15);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'\u00a9 OpenStreetMap'}).addTo(map);L.marker([${
                location.latitude
              },${
                location.longitude
              }]).addTo(map).bindPopup('You are here').openPopup();${gyms
                .map(
                  g =>
                    `L.marker([${g.latitude},${
                      g.longitude
                    }],{icon:L.icon({iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',iconSize:[25,41],iconAnchor:[12,41]})}).addTo(map).bindPopup(${JSON.stringify(
                      g.name,
                    )}).on('click',function(){window.ReactNativeWebView.postMessage(JSON.stringify({lat:${
                      g.latitude
                    },lon:${g.longitude},name:${JSON.stringify(g.name)}}));});`,
                )
                .join('')}</script></body></html>`,
            }}
          />
        )}
        <TouchableOpacity
          style={styles.findGymsButton}
          onPress={() =>
            Linking.openURL(
              `https://www.google.com/maps/search/gym/@${location.latitude},${location.longitude},14z`,
            )
          }>
          <Text style={styles.findGymsButtonText}>🏋️ Find Nearby Gyms</Text>
        </TouchableOpacity>
      </View>

      {/* Browse Exercises & Recipes */}
      <BrowseSections navigation={navigation} />

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>More Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map(action => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionCard, {backgroundColor: action.color}]}
              onPress={() => navigation.navigate(action.screen)}>
              <Icon name={action.icon} size={32} color="#fff" />
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{height: 30}} />

      <Modal
        visible={workoutComplete}
        transparent
        animationType="fade"
        onRequestClose={() => setWorkoutComplete(false)}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setWorkoutComplete(false)}>
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              padding: 32,
              alignItems: 'center',
              marginHorizontal: 40,
            }}>
            <Text style={{fontSize: 48}}>🎉</Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#333',
                marginTop: 12,
              }}>
              Today's workout complete!
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#888',
                marginTop: 8,
                textAlign: 'center',
              }}>
              Great job! Your streak has been updated.
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 20,
                backgroundColor: '#FF6B35',
                paddingHorizontal: 32,
                paddingVertical: 12,
                borderRadius: 12,
              }}
              onPress={() => setWorkoutComplete(false)}>
              <Text style={{color: '#fff', fontWeight: '700', fontSize: 15}}>
                Keep it up!
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}
