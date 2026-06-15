import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useFocusEffect} from '@react-navigation/native';
import {apiClient} from '../../../services/api';
import {useAuth} from '../../../store/AuthContext';
import {styles} from './styles';

type NotificationTarget = {
  screen: string;
  params?: Record<string, any>;
};

const TYPE_ICON: Record<string, {icon: string; color: string}> = {
  admin_validation_request: {icon: 'checkmark-circle', color: '#FF9500'},
  admin_challenge_submission: {icon: 'trophy', color: '#5856D6'},
  admin_challenge_review: {icon: 'document-text', color: '#34C759'},
  challenge_review: {icon: 'trophy', color: '#FF9500'},
  achievement: {icon: 'medal', color: '#FFD700'},
  plan_validated: {icon: 'checkmark-circle', color: '#34C759'},
  trainer_hire: {icon: 'people', color: '#5856D6'},
  session: {icon: 'calendar', color: '#007AFF'},
  dispute: {icon: 'warning', color: '#FF3B30'},
  announcement: {icon: 'megaphone', color: '#34C759'},
  general: {icon: 'notifications', color: '#007AFF'},
};

const SCREEN_TAB_MAP: Record<
  string,
  Record<string, {tab: string; direct?: boolean}>
> = {
  member: {
    Achievement: {tab: 'Leaderboard'},
    ChallengeList: {tab: 'Leaderboard'},
    ChallengeDetail: {tab: 'Leaderboard'},
    TrainerOffers: {tab: 'Trainers'},
    Chat: {tab: 'Trainers'},
    MemberAnnouncements: {tab: 'Trainers'},
    MemberSessions: {tab: 'Trainers'},
    AIWorkoutPlan: {tab: 'Main'},
    AIDietPlan: {tab: 'Main'},
  },
  trainer: {
    Achievement: {tab: 'Leaderboard'},
    ChallengeList: {tab: 'Leaderboard'},
    ChallengeDetail: {tab: 'Leaderboard'},
    TrainerHireManagement: {tab: 'Main'},
    ManagePosts: {tab: 'Main'},
    ManageChallenge: {tab: 'Main'},
    CreateChallenge: {tab: 'Main'},
    AIWorkoutPlan: {tab: 'Main'},
    AIDietPlan: {tab: 'Main'},
    Chat: {tab: 'Main'},
    PostAnnouncements: {tab: 'Main'},
  },
  admin: {
    UserManagement: {tab: 'Users', direct: true},
    TransactionList: {tab: 'Transactions'},
    TransactionDetail: {tab: 'Transactions'},
    AIRecommendationValidation: {tab: 'Validation'},
    ValidationLog: {tab: 'Validation'},
    ManageContent: {tab: 'Content'},
    ManageChallenge: {tab: 'Content'},
    CreateChallenge: {tab: 'Content'},
    ChallengeDetail: {tab: 'Content'},
    ManageAchievementRules: {tab: 'Content'},
    AdminTrainerPosts: {tab: 'Content'},
    AdminDisputes: {tab: 'Content'},
  },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) {
    return 'Just now';
  }
  if (mins < 60) {
    return `${mins}m ago`;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    return `${hrs}h ago`;
  }
  return `${Math.floor(hrs / 24)}d ago`;
}

function normalizeText(item: any) {
  return `${item?.title || ''} ${item?.message || ''}`.toLowerCase();
}

function resolveGeneralTarget(
  item: any,
  role?: string,
): NotificationTarget | null {
  if (item?.data?.screen) {
    return {
      screen: item.data.screen,
      params: item.data.params || {},
    };
  }

  const text = normalizeText(item);

  if (
    text.includes('certification approved') ||
    text.includes('certification rejected')
  ) {
    return null;
  }

  if (text.includes('workout plan')) {
    return {screen: 'AIWorkoutPlan'};
  }

  if (text.includes('diet plan')) {
    return {screen: 'AIDietPlan'};
  }

  if (
    role === 'trainer' &&
    (text.includes('post deactivated') ||
      text.includes('post reactivated') ||
      text.includes('deactivated by admin') ||
      text.includes('reactivated by admin'))
  ) {
    return {screen: 'ManagePosts'};
  }

  return null;
}

function resolveTarget(item: any, role?: string): NotificationTarget | null {
  if (item?.data?.screen) {
    return {
      screen: item.data.screen,
      params: item.data.params || {},
    };
  }

  switch (item?.type) {
    case 'admin_validation_request':
      return role === 'admin' ? {screen: 'AIRecommendationValidation'} : null;
    case 'admin_challenge_submission':
    case 'admin_challenge_review':
      return role === 'admin' ? {screen: 'ManageChallenge'} : null;
    case 'achievement':
      return {screen: 'Achievement'};
    case 'challenge_review':
      return role === 'trainer' ? {screen: 'ChallengeList'} : null;
    case 'trainer_hire':
      if (role === 'trainer') {
        return {screen: 'TrainerHireManagement'};
      }
      return role === 'member' ? {screen: 'TrainerOffers'} : null;
    case 'session':
      if (role === 'trainer') {
        return {screen: 'TrainerHireManagement'};
      }
      return role === 'member' ? {screen: 'TrainerOffers'} : null;
    case 'dispute':
      if (role === 'admin') {
        return {screen: 'AdminDisputes'};
      }
      if (role === 'trainer') {
        return {screen: 'TrainerHireManagement'};
      }
      return role === 'member' ? {screen: 'TrainerOffers'} : null;
    case 'announcement':
      if (role === 'trainer') {
        return {screen: 'PostAnnouncements'};
      }
      return role === 'member' ? {screen: 'MemberAnnouncements'} : null;
    case 'general':
    case 'plan_validated':
      return resolveGeneralTarget(item, role);
    default:
      return null;
  }
}

function navigateToTarget(
  navigation: any,
  role: string | undefined,
  target: NotificationTarget,
) {
  const routeNames: string[] = navigation.getState?.()?.routeNames || [];

  if (routeNames.includes(target.screen)) {
    navigation.navigate(target.screen, target.params);
    return;
  }

  const parent = navigation.getParent?.();
  const mapEntry = role ? SCREEN_TAB_MAP[role]?.[target.screen] : null;

  if (parent && mapEntry) {
    if (mapEntry.direct) {
      parent.navigate(mapEntry.tab, target.params);
      return;
    }

    parent.navigate(mapEntry.tab, {
      initial: false,
      screen: target.screen,
      params: target.params,
    });
    return;
  }

  navigation.navigate(target.screen, target.params);
}

export default function NotificationScreen({navigation}: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const {notifRefreshKey, user} = useAuth();

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/notification/my');
      setNotifications(res.data || []);
      apiClient.patch('/notification/read-all').catch(() => {});
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (notifRefreshKey > 0) {
      load();
    }
  }, [notifRefreshKey, load]);

  const handleNotificationPress = (item: any) => {
    const target = resolveTarget(item, user?.role);
    if (!target) {
      return;
    }

    navigateToTarget(navigation, user?.role, target);
  };

  if (loading) {
    return (
      <ActivityIndicator style={styles.loading} size="large" color="#FF6B35" />
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={notifications}
      keyExtractor={item => String(item.id)}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          colors={['#FF6B35']}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Icon name="notifications-off-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      }
      renderItem={({item}) => {
        const {icon, color} = TYPE_ICON[item.type] || TYPE_ICON.general;
        const target = resolveTarget(item, user?.role);
        const content = (
          <>
            <View
              style={[styles.iconContainer, {backgroundColor: color + '20'}]}>
              <Icon name={icon} size={24} color={color} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
            </View>
            <View style={styles.itemEnd}>
              {!item.is_read ? <View style={styles.unreadDot} /> : null}
              {target ? (
                <Icon name="chevron-forward" size={16} color="#bbb" />
              ) : null}
            </View>
          </>
        );

        if (target) {
          return (
            <TouchableOpacity
              style={[styles.item, !item.is_read && styles.unreadItem]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.8}>
              {content}
            </TouchableOpacity>
          );
        }

        return <View style={[styles.item, !item.is_read && styles.unreadItem]}>{content}</View>;
      }}
    />
  );
}
