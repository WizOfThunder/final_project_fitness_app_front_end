import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

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

function hasManualChallengeStarted(item: any) {
  if (item.challenge_type === 'auto') {
    return false;
  }

  const startDate = toLocalDateOnly(item.start_date);
  if (!startDate) {
    return false;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (today > startDate) {
    return true;
  }

  if (today.getTime() !== startDate.getTime()) {
    return false;
  }

  if (!item.event_start_time) {
    return true;
  }

  const [hours, minutes] = item.event_start_time.split(':').map(Number);
  const startDateTime = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
    hours,
    minutes,
    0,
  );

  return now >= startDateTime;
}

function todayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function hasTimePassed(
  date: Date,
  timeStr: string | null | undefined,
): boolean {
  if (!timeStr) {
    return true;
  }

  const now = new Date();
  const [hours, minutes] = timeStr.split(':').map(Number);

  return (
    now >=
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
      0,
    )
  );
}

function isChallengeEnded(item: any) {
  const today = todayLocal();
  const endDate = toLocalDateOnly(item.end_date);

  if (!endDate) {
    return false;
  }

  return (
    today > endDate ||
    (item.challenge_type !== 'auto' &&
      !!item.event_end_time &&
      today.getTime() === endDate.getTime() &&
      hasTimePassed(endDate, item.event_end_time))
  );
}

function formatDateRange(startDate?: string, endDate?: string) {
  const start = startDate?.split('T')[0];
  const end = endDate?.split('T')[0];

  if (start && end && start !== end) {
    return `${start} - ${end}`;
  }

  return start || end || 'Date TBA';
}

function formatEventTime(item: any) {
  const startTime = item.event_start_time?.slice(0, 5);
  const endTime = item.event_end_time?.slice(0, 5);

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

function getChallengeTypeLabel(item: any) {
  if (item.challenge_type === 'auto') {
    return item.type ? `Auto • ${item.type}` : 'Auto';
  }

  return item.challenge_type === 'online' ? 'Online event' : 'Offline event';
}

export default function ChallengeListScreen({navigation}: any) {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [myChallenges, setMyChallenges] = useState<any[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'my'>('available');
  const [myChallengeFilter, setMyChallengeFilter] = useState<
    'joined' | 'completed' | 'ended'
  >('joined');

  const load = useCallback(async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        apiClient.get('/challenges'),
        apiClient.get('/challenges/my'),
      ]);
      const allChallenges = Array.isArray(allRes.data) ? allRes.data : [];
      const mine = Array.isArray(myRes.data) ? myRes.data : [];

      setChallenges(allChallenges);
      setMyChallenges(mine);
      const ids = new Set<number>(mine.map((uc: any) => uc.challenge_id));
      setJoinedIds(ids);
    } catch (e) {
      console.error('ChallengeList fetch error:', e);
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

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleAvailablePress = async (item: any) => {
    if (item.max_participants) {
      try {
        const res = await apiClient.get(`/challenges/${item.id}`);
        const fresh = res.data;
        if (
          fresh.max_participants &&
          Number(fresh.participant_count) >= fresh.max_participants
        ) {
          Alert.alert(
            'Challenge Full',
            'This challenge just reached its participant limit.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setRefreshing(true);
                  load();
                },
              },
            ],
          );
          return;
        }
      } catch (_) {}
    }
    navigation.navigate('ChallengeDetail', {challengeId: item.id});
  };

  const handleMyChallengePress = (item: any) => {
    navigation.navigate('ChallengeDetail', {
      challengeId: item.challenge_id,
      joined: true,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  const spotsLeft = (item: any) => {
    if (!item.max_participants) {
      return null;
    }
    return item.max_participants - Number(item.participant_count ?? 0);
  };

  const availableChallenges = challenges.filter(item => !joinedIds.has(item.id));
  const filteredMyChallenges = myChallenges.filter(item => {
    const isCompleted = item.status === 'completed';
    const isEnded = isChallengeEnded(item);

    if (myChallengeFilter === 'completed') {
      return isCompleted;
    }

    if (myChallengeFilter === 'ended') {
      return !isCompleted && isEnded;
    }

    return !isCompleted && !isEnded;
  });

  const renderAvailableChallenge = ({item}: {item: any}) => {
    const spots = spotsLeft(item);
    const isLiveManual =
      item.challenge_type !== 'auto' &&
      hasManualChallengeStarted(item) &&
      !isChallengeEnded(item);

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleAvailablePress(item)}>
        <View style={styles.info}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.metaRow}>
            <Icon name="calendar-outline" size={13} color="#888" />
            <Text style={styles.duration}>
              {' '}
              {formatDateRange(item.start_date, item.end_date)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Icon name="trophy-outline" size={13} color="#FF9500" />
            <Text style={styles.points}>
              {' '}
              {item.points} pts • {getChallengeTypeLabel(item)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Icon name="person-outline" size={13} color="#888" />
            <Text style={styles.duration}>
              {' '}
              {item.creator_role === 'admin'
                ? 'Administrator'
                : item.creator_name}
            </Text>
          </View>
          {spots !== null && (
            <View style={styles.metaRow}>
              <Icon
                name="people-outline"
                size={13}
                color={spots <= 5 ? '#FF3B30' : '#34C759'}
              />
              <Text
                style={[
                  styles.duration,
                  spots <= 5 ? styles.spotWarningText : styles.spotSafeText,
                ]}>
                {' '}
                {spots} spot{spots !== 1 ? 's' : ''} left
              </Text>
            </View>
          )}
        </View>
        <View style={styles.rightCol}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{isLiveManual ? 'View' : 'Join'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMyChallenge = ({item}: {item: any}) => {
    const isCompleted = item.status === 'completed';
    const isPendingReview = !!item.has_pending_request && !isCompleted;
    const isEnded = !isCompleted && isChallengeEnded(item);
    const progress =
      item.target_value > 0
        ? Math.min(
            Math.round(
              (Number(item.current_value ?? 0) / item.target_value) * 100,
            ),
            100,
          )
        : 0;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleMyChallengePress(item)}>
        <View style={styles.info}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.metaRow}>
            <Icon name="calendar-outline" size={13} color="#888" />
            <Text style={styles.duration}>
              {' '}
              {formatDateRange(item.start_date, item.end_date)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Icon name="trophy-outline" size={13} color="#FF9500" />
            <Text style={styles.points}>
              {' '}
              {item.points ?? 0} pts • {getChallengeTypeLabel(item)}
            </Text>
          </View>
          {item.challenge_type === 'auto' ? (
            <View style={styles.metaRow}>
              <Icon name="stats-chart-outline" size={13} color="#007AFF" />
              <Text style={styles.duration}>
                {' '}
                {progress}% complete
                {item.type
                  ? ` • ${Number(item.current_value ?? 0)} ${item.type}`
                  : ''}
              </Text>
            </View>
          ) : (
            <View style={styles.metaRow}>
              <Icon name="time-outline" size={13} color="#007AFF" />
              <Text style={styles.duration}> {formatEventTime(item)}</Text>
            </View>
          )}
        </View>
        <View style={styles.rightCol}>
          <View
            style={[
              styles.statusBadge,
              isCompleted
                ? styles.completedBadge
                : isPendingReview
                ? styles.pendingBadge
                : isEnded
                ? styles.endedBadge
                : styles.joinedStatusBadge,
            ]}>
            <Text
              style={[
                styles.statusBadgeText,
                isCompleted
                  ? styles.completedBadgeText
                  : isPendingReview
                  ? styles.pendingBadgeText
                  : isEnded
                  ? styles.endedBadgeText
                  : styles.joinedStatusText,
              ]}>
              {isCompleted
                ? 'Completed'
                : isPendingReview
                ? 'Review'
                : isEnded
                ? 'Ended'
                : 'Joined'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const data =
    activeTab === 'available' ? availableChallenges : filteredMyChallenges;
  const emptyText =
    activeTab === 'available'
      ? 'No available challenges right now.'
      : myChallengeFilter === 'ended'
      ? 'No ended challenges yet.'
      : myChallengeFilter === 'completed'
      ? 'No completed challenges yet.'
      : 'No joined challenges yet.';

  return (
    <View style={styles.container}>
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'available' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('available')}>
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'available' && styles.tabButtonTextActive,
            ]}>
            Challenges
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'my' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('my')}>
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'my' && styles.tabButtonTextActive,
            ]}>
            My Challenges
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'my' ? (
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              myChallengeFilter === 'joined' && styles.filterChipActive,
            ]}
            onPress={() => setMyChallengeFilter('joined')}>
            <Text
              style={[
                styles.filterChipText,
                myChallengeFilter === 'joined' && styles.filterChipTextActive,
              ]}>
              Joined
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              myChallengeFilter === 'completed' && styles.filterChipActive,
            ]}
            onPress={() => setMyChallengeFilter('completed')}>
            <Text
              style={[
                styles.filterChipText,
                myChallengeFilter === 'completed' &&
                  styles.filterChipTextActive,
              ]}>
              Completed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              myChallengeFilter === 'ended' && styles.filterChipActive,
            ]}
            onPress={() => setMyChallengeFilter('ended')}>
            <Text
              style={[
                styles.filterChipText,
                myChallengeFilter === 'ended' && styles.filterChipTextActive,
              ]}>
              Ended
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        style={styles.list}
        data={data}
        key={activeTab}
        keyExtractor={item => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
          />
        }
        renderItem={
          activeTab === 'available'
            ? renderAvailableChallenge
            : renderMyChallenge
        }
        contentContainerStyle={[
          styles.listContent,
          data.length === 0 && styles.emptyContent,
        ]}
        ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
      />
    </View>
  );
}
