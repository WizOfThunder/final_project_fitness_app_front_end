import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../../../store/AuthContext';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

const TABS = [
  {key: 'badges', label: 'Badges', icon: 'medal'},
  {key: 'points', label: 'Points', icon: 'trophy'},
  {key: 'streak', label: 'Streak', icon: 'flame'},
];

const PERIODS = ['all', 'weekly'];
const STREAK_PERIODS = ['all_time', 'this_week'];

const BADGE_CATEGORIES = [
  {key: 'all', label: 'All'},
  {key: 'challenge', label: 'Challenge'},
  {key: 'weekly_streak', label: 'Streak'},
  {key: 'steps', label: 'Steps'},
  {key: 'calories', label: 'Calories'},
  {key: 'distance', label: 'Distance'},
];

type Entry = {
  user_id: number;
  name: string;
  avatar_url?: string;
  badge_count?: number;
  total_points?: number;
  challenges_completed?: number;
  active_days?: number;
};

export default function RankingScreen() {
  const {user} = useAuth();
  const [tab, setTab] = useState<'badges' | 'points' | 'streak'>('badges');
  const [period, setPeriod] = useState<'all' | 'weekly'>('all');
  const [streakPeriod, setStreakPeriod] = useState<'all_time' | 'this_week'>(
    'all_time',
  );
  const [badgeCategory, setBadgeCategory] = useState('all');
  const [data, setData] = useState<Entry[]>([]);
  const [myRank, setMyRank] = useState<{
    rank: number | null;
    score: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = tab === 'streak' ? {period: streakPeriod} : {period};
      if (tab === 'badges' && badgeCategory !== 'all') {
        params.category = badgeCategory;
      }
      const [listRes, rankRes] = await Promise.all([
        apiClient.get(`/ranking/${tab}`, {params}),
        apiClient.get('/ranking/my-rank', {
          params: {
            type: tab,
            period: tab === 'streak' ? streakPeriod : period,
            ...(tab === 'badges' ? {category: badgeCategory} : {}),
          },
        }),
      ]);
      setData(listRes.data || []);
      setMyRank(rankRes.data);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [tab, period, streakPeriod, badgeCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getScore = (item: Entry) =>
    tab === 'badges'
      ? item.badge_count ?? 0
      : tab === 'streak'
      ? item.active_days ?? 0
      : item.total_points ?? 0;

  const getScoreLabel = (item: Entry) =>
    tab === 'badges'
      ? `${item.badge_count ?? 0} badge${
          (item.badge_count ?? 0) !== 1 ? 's' : ''
        }`
      : tab === 'streak'
      ? `${item.active_days ?? 0} active day${
          (item.active_days ?? 0) !== 1 ? 's' : ''
        }`
      : `${item.total_points ?? 0} pts · ${
          item.challenges_completed ?? 0
        } challenges`;

  const baseUrl = apiClient.defaults.baseURL?.replace('/api/v1', '');

  const renderAvatar = (item: Entry, size = 44) => {
    const url = item.avatar_url ? `${baseUrl}${item.avatar_url}` : null;
    if (url) {
      return (
        <Image
          source={{uri: url}}
          style={[
            styles.avatar,
            {width: size, height: size, borderRadius: size / 2},
          ]}
        />
      );
    }
    return (
      <View
        style={[
          styles.avatarPlaceholder,
          {width: size, height: size, borderRadius: size / 2},
        ]}>
        <Text style={[styles.avatarText, {fontSize: size * 0.4}]}>
          {item.name?.[0]?.toUpperCase()}
        </Text>
      </View>
    );
  };

  const getMedalIcon = (rank: number) =>
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
  const getMedalColor = (rank: number) =>
    rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32';
  const getPodiumHeight = (rank: number) =>
    rank === 1 ? 60 : rank === 2 ? 44 : 30;
  const getPodiumAvatarSize = (rank: number) =>
    rank === 1 ? 48 : rank === 2 ? 38 : 32;

  const podium = data.slice(0, 3);
  const rest = data.slice(3);
  const isMe = (item: Entry) => item.user_id === user?.id;
  const myInList = data.some(d => d.user_id === user?.id);

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key as any)}>
            <Icon
              name={t.icon}
              size={16}
              color={tab === t.key ? '#fff' : '#888'}
            />
            <Text
              style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Period toggle (points) or Category filter (badges) or Streak period */}
      {tab === 'streak' ? (
        <View style={styles.periodRow}>
          {STREAK_PERIODS.map(p => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodBtn,
                streakPeriod === p && styles.periodBtnActive,
              ]}
              onPress={() => setStreakPeriod(p as any)}>
              <Text
                style={[
                  styles.periodText,
                  streakPeriod === p && styles.periodTextActive,
                ]}>
                {p === 'all_time' ? 'All Time' : 'This Week'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : tab === 'points' ? (
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p as any)}>
              <Text
                style={[
                  styles.periodText,
                  period === p && styles.periodTextActive,
                ]}>
                {p === 'all' ? 'All Time' : 'This Week'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.periodScroll}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodRow}>
            {BADGE_CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.key}
                style={[
                  styles.periodBtn,
                  badgeCategory === c.key && styles.periodBtnActive,
                ]}
                onPress={() => setBadgeCategory(c.key)}>
                <Text
                  style={[
                    styles.periodText,
                    badgeCategory === c.key && styles.periodTextActive,
                  ]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#FF6B35" />
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Icon
            name={
              tab === 'badges'
                ? 'medal-outline'
                : tab === 'streak'
                ? 'flame-outline'
                : 'trophy-outline'
            }
            size={56}
            color="#ddd"
          />
          <Text style={styles.emptyText}>No data yet</Text>
          <Text style={styles.emptySubText}>
            {tab === 'badges'
              ? 'Complete challenges to earn badges'
              : tab === 'streak'
              ? 'Complete workouts to build your streak'
              : 'Complete challenges to earn points'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={item => String(item.user_id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              {/* Podium */}
              {podium.length > 0 && (
                <View style={styles.podium}>
                  {/* 2nd place */}
                  {podium[1] && (
                    <View style={styles.podiumItem}>
                      <Text style={styles.podiumMedal}>
                        {getMedalIcon(podium[1].rank)}
                      </Text>
                      {renderAvatar(
                        podium[1],
                        getPodiumAvatarSize(podium[1].rank),
                      )}
                      <Text style={styles.podiumName} numberOfLines={1}>
                        {podium[1].name}
                        {podium[1].user_id === user?.id ? ' (You)' : ''}
                      </Text>
                      <Text style={styles.podiumScore}>
                        {getScore(podium[1])}
                      </Text>
                      <View
                        style={[
                          styles.podiumBar,
                          {
                            height: getPodiumHeight(podium[1].rank),
                            backgroundColor: getMedalColor(podium[1].rank),
                          },
                        ]}>
                        <Text style={styles.podiumRankText}>
                          {podium[1].rank}
                        </Text>
                      </View>
                    </View>
                  )}
                  {/* 1st place */}
                  {podium[0] && (
                    <View style={styles.podiumItem}>
                      <Text style={styles.podiumMedal}>
                        {getMedalIcon(podium[0].rank)}
                      </Text>
                      {renderAvatar(
                        podium[0],
                        getPodiumAvatarSize(podium[0].rank),
                      )}
                      <Text style={styles.podiumName} numberOfLines={1}>
                        {podium[0].name}
                        {podium[0].user_id === user?.id ? ' (You)' : ''}
                      </Text>
                      <Text style={styles.podiumScore}>
                        {getScore(podium[0])}
                      </Text>
                      <View
                        style={[
                          styles.podiumBar,
                          {
                            height: getPodiumHeight(podium[0].rank),
                            backgroundColor: getMedalColor(podium[0].rank),
                          },
                        ]}>
                        <Text style={styles.podiumRankText}>
                          {podium[0].rank}
                        </Text>
                      </View>
                    </View>
                  )}
                  {/* 3rd place */}
                  {podium[2] && (
                    <View style={styles.podiumItem}>
                      <Text style={styles.podiumMedal}>
                        {getMedalIcon(podium[2].rank)}
                      </Text>
                      {renderAvatar(
                        podium[2],
                        getPodiumAvatarSize(podium[2].rank),
                      )}
                      <Text style={styles.podiumName} numberOfLines={1}>
                        {podium[2].name}
                        {podium[2].user_id === user?.id ? ' (You)' : ''}
                      </Text>
                      <Text style={styles.podiumScore}>
                        {getScore(podium[2])}
                      </Text>
                      <View
                        style={[
                          styles.podiumBar,
                          {
                            height: getPodiumHeight(podium[2].rank),
                            backgroundColor: getMedalColor(podium[2].rank),
                          },
                        ]}>
                        <Text style={styles.podiumRankText}>
                          {podium[2].rank}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
              {rest.length > 0 && (
                <Text style={styles.restTitle}>Rankings</Text>
              )}
            </>
          }
          renderItem={({item}) => (
            <View style={[styles.row, isMe(item) && styles.rowMe]}>
              <Text style={styles.rowRank}>#{item.rank}</Text>
              {renderAvatar(item, 38)}
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>
                  {item.name}
                  {isMe(item) ? ' (You)' : ''}
                </Text>
                <Text style={styles.rowScore}>{getScoreLabel(item)}</Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            myRank && !myInList ? (
              <View style={styles.myRankBanner}>
                <Icon name="person-circle" size={20} color="#FF6B35" />
                <Text style={styles.myRankText}>
                  Your rank: #{myRank.rank ?? '—'} · {myRank.score}{' '}
                  {tab === 'badges'
                    ? 'badges'
                    : tab === 'streak'
                    ? 'active days'
                    : 'pts'}
                </Text>
                <Text style={styles.myRankSub}>
                  out of {myRank.total} users
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
