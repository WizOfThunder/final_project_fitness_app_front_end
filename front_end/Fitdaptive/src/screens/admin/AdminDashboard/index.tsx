import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, useWindowDimensions, Image} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {LineChart, BarChart, PieChart} from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary} from 'react-native-image-picker';
import {useAuth} from '../../../store/AuthContext';
import {apiClient} from '../../../services/api';
import {styles} from './styles';



const chartConfig = {
  backgroundColor: '#fff',
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {borderRadius: 16},
  propsForDots: {r: '6', strokeWidth: '2', stroke: '#FF6B35'},
};

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const activityIconMap: Record<string, {icon: string; color: string}> = {
  admin_validation_request: {icon: 'checkmark-circle', color: '#FF9500'},
  admin_challenge_submission: {icon: 'trophy', color: '#5856D6'},
  admin_challenge_review: {icon: 'document-text', color: '#34C759'},
  trainer_hire: {icon: 'barbell', color: '#007AFF'},
  achievement:  {icon: 'trophy', color: '#FFD700'},
  session:      {icon: 'calendar', color: '#34C759'},
  dispute:      {icon: 'warning', color: '#FF3B30'},
  general:      {icon: 'notifications', color: '#FF6B35'},
};

export default function AdminDashboard({navigation}: any) {
  const {width: screenWidth} = useWindowDimensions();
  const {logout, user} = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const load = useCallback(async () => {
    try {
      const [statsRes, profileRes] = await Promise.all([
        apiClient.get('/admin/stats'),
        user?.id ? apiClient.get(`/users/${user.id}`) : Promise.resolve({data: null}),
      ]);
      setData(statsRes.data);
      setProfile(profileRes.data);
    } catch (e) {
      console.error('AdminDashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => { setRefreshing(true); load(); };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {style: 'currency', currency: 'IDR', minimumFractionDigits: 0}).format(price);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? 's' : ''} ago`;
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', style: 'destructive', onPress: logout},
    ]);
  };

  const handlePickAvatar = () => {
    if (!user?.id || uploadingAvatar) return;

    launchImageLibrary({mediaType: 'photo', quality: 0.8}, async response => {
      if (response.didCancel || !response.assets?.[0]) return;

      const asset = response.assets[0];
      setUploadingAvatar(true);

      try {
        const formData = new FormData();
        formData.append('avatar', {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'avatar.jpg',
        } as any);

        const res = await apiClient.put(`/users/${user.id}/avatar`, formData);

        setProfile((prev: any) => ({
          ...(prev || {}),
          ...(res.data?.user || {}),
        }));
      } catch {
        Alert.alert('Error', 'Failed to upload photo');
      } finally {
        setUploadingAvatar(false);
      }
    });
  };

  const buildUserGrowthChart = () => {
    const rows = data?.user_growth || [];
    if (!rows.length) return {labels: ['—'], datasets: [{data: [0]}]};
    return {labels: rows.map((r: any) => r.month), datasets: [{data: rows.map((r: any) => Number(r.count))}]};
  };

  const buildRevenueChart = () => {
    const rows = data?.revenue_trend || [];
    if (!rows.length) return {labels: ['—'], datasets: [{data: [0]}]};
    return {labels: rows.map((r: any) => r.month), datasets: [{data: rows.map((r: any) => Number(r.total))}]};
  };

  const buildWeeklyActivityChart = () => {
    const rows: any[] = data?.weekly_activity || [];
    const byDay: Record<string, number> = {};
    rows.forEach(r => { byDay[r.day] = Number(r.count); });
    const labels = DAY_ORDER.map(d => d.slice(0, 3));
    const values = DAY_ORDER.map(d => byDay[d] || 0);
    return {labels, datasets: [{data: values}]};
  };

  const buildPieChart = () => {
    const s = data?.stats;
    if (!s) return [];
    return [
      {name: 'Members', population: s.total_members || 0, color: '#FF6B35', legendFontColor: '#333', legendFontSize: 13},
      {name: 'Trainers', population: s.total_trainers || 0, color: '#34C759', legendFontColor: '#333', legendFontSize: 13},
      {name: 'Admins', population: s.total_admins || 0, color: '#007AFF', legendFontColor: '#333', legendFontSize: 13},
    ];
  };

  const adminActions = [
    {id: '1', title: 'User Management', icon: 'people', color: '#FF6B35', screen: 'UserManagement'},
    {id: '2', title: 'Transactions', icon: 'card', color: '#34C759', screen: 'TransactionList'},
    {id: '3', title: 'AI Validation', icon: 'checkmark-circle', color: '#007AFF', screen: 'AIRecommendationValidation'},
    {id: '4', title: 'Manage Content', icon: 'barbell', color: '#5856D6', screen: 'ManageContent'},
    {id: '6', title: 'Manage Challenges', icon: 'trophy', color: '#FFD700', screen: 'ManageChallenge'},
    {id: '7', title: 'Achievements', icon: 'medal', color: '#FF6B35', screen: 'ManageAchievementRules'},
    {id: '8', title: 'Trainer Posts', icon: 'document-text', color: '#34C759', screen: 'AdminTrainerPosts'},
    {id: '9', title: 'Disputes', icon: 'warning', color: '#FF3B30', screen: 'AdminDisputes'},
  ];

  if (loading) {
    return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><ActivityIndicator size="large" color="#FF6B35" /></View>;
  }

  const s = data?.stats || {};
  const baseUrl = apiClient.defaults.baseURL?.replace('/api/v1', '') || '';
  const avatarUrl = profile?.avatar_url ? `${baseUrl}${profile.avatar_url}` : null;
  const displayName = profile?.name || user?.name || 'Admin';

  const pendingItems = [
    {id: '1', title: 'AI Validations', count: s.pending_validations ?? 0, icon: 'checkmark-circle', color: '#FF6B35', screen: 'AIRecommendationValidation'},
    {id: '2', title: 'Open Disputes', count: s.open_disputes ?? 0, icon: 'warning', color: '#FF3B30', screen: 'AdminDisputes'},
    {id: '3', title: 'Trainer Approvals', count: s.pending_trainer_approvals ?? 0, icon: 'ribbon', color: '#007AFF', screen: 'UserManagement'},
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />}>
      <View style={styles.header}>
        <View style={styles.profileButton}>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={handlePickAvatar}
            activeOpacity={0.85}
            disabled={uploadingAvatar}>
            {avatarUrl ? (
              <Image source={{uri: avatarUrl}} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="camera" size={14} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeText} numberOfLines={1}>
              Welcome, {displayName}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, {backgroundColor: '#FF6B35'}]}>
          <Icon name="people" size={28} color="#fff" />
          <Text style={styles.statValue}>{s.total_users ?? 0}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: '#34C759'}]}>
          <Icon name="person" size={28} color="#fff" />
          <Text style={styles.statValue}>{s.total_members ?? 0}</Text>
          <Text style={styles.statLabel}>Total Members</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: '#007AFF'}]}>
          <Icon name="barbell" size={28} color="#fff" />
          <Text style={styles.statValue}>{s.total_trainers ?? 0}</Text>
          <Text style={styles.statLabel}>Total Trainers</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: '#5856D6'}]}>
          <Icon name="checkmark-circle" size={28} color="#fff" />
          <Text style={styles.statValue}>{s.active_subscriptions ?? 0}</Text>
          <Text style={styles.statLabel}>Active Subs</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: '#FF9500'}]}>
          <Icon name="time" size={28} color="#fff" />
          <Text style={styles.statValue}>{s.pending_validations ?? 0}</Text>
          <Text style={styles.statLabel}>Pending Validations</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: '#FFD700'}]}>
          <Icon name="cash" size={28} color="#fff" />
          <Text style={styles.statValue}>{formatPrice(s.monthly_revenue ?? 0)}</Text>
          <Text style={styles.statLabel}>Monthly Revenue</Text>
        </View>
      </View>

      {/* User Growth Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>User Growth (Last 6 Months)</Text>
        <LineChart
          data={buildUserGrowthChart()}
          width={screenWidth - 56}
          height={220}
          chartConfig={chartConfig}
          fromZero
          bezier
          style={styles.chart}
        />
      </View>

      {/* Weekly Workout Completions */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Workout Completions This Week</Text>
        {(() => {
          const weekData = buildWeeklyActivityChart();
          const allZero = weekData.datasets[0].data.every((v: number) => v === 0);
          return allZero ? (
            <View style={{height: 160, justifyContent: 'center', alignItems: 'center', gap: 8}}>
              <Icon name="barbell-outline" size={40} color="#E0E0E0" />
              <Text style={{color: '#ccc', fontSize: 14}}>No workout data this week</Text>
            </View>
          ) : (
            <BarChart
              data={weekData}
              width={screenWidth - 80}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero
              chartConfig={{
                ...chartConfig,
                decimalPlaces: 0,
                propsForLabels: {fontSize: 11},
              }}
              style={styles.chart}
              showValuesOnTopOfBars
            />
          );
        })()}
      </View>

      {/* User Distribution */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>User Distribution</Text>
        {(() => {
          const pieData = buildPieChart();
          return pieData.some(p => p.population > 0) ? (
            <PieChart
              data={pieData}
              width={screenWidth - 56}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          ) : (
            <View style={{height: 200, justifyContent: 'center', alignItems: 'center'}}>
              <Text style={{color: '#ccc'}}>No data</Text>
            </View>
          );
        })()}
      </View>

      {/* Revenue Trend */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Revenue Trend</Text>
        {(() => {
          const revenueData = buildRevenueChart();
          const allZero = revenueData.datasets[0].data.every((v: number) => v === 0);
          return allZero ? (
            <View style={{height: 160, justifyContent: 'center', alignItems: 'center', gap: 8}}>
              <Icon name="bar-chart-outline" size={40} color="#E0E0E0" />
              <Text style={{color: '#ccc', fontSize: 14}}>No revenue data yet</Text>
            </View>
          ) : (
            <LineChart
              data={revenueData}
              width={screenWidth - 56}
              height={220}
              chartConfig={{
                ...chartConfig,
                propsForDots: {r: '5', strokeWidth: '2', stroke: '#FFD700'},
                color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
              }}
              bezier
              style={styles.chart}
            />
          );
        })()}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {adminActions.map(action => (
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

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityFeed}>
          {(data?.recent_activity || []).length === 0 ? (
            <Text style={{color: '#ccc', textAlign: 'center', paddingVertical: 20}}>No recent activity</Text>
          ) : (
            (data?.recent_activity || []).map((item: any, i: number) => {
              const meta = activityIconMap[item.type] || activityIconMap.general;
              return (
                <View key={i} style={styles.activityItem}>
                  <View style={[styles.activityIcon, {backgroundColor: meta.color + '20'}]}>
                    <Icon name={meta.icon} size={20} color={meta.color} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>{item.title}</Text>
                    <Text style={styles.activityTime}>{item.user_name} · {formatTimeAgo(item.created_at)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* Pending Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Items</Text>
        <View style={styles.pendingGrid}>
          {pendingItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.pendingCard}
              onPress={() => navigation.navigate(item.screen)}>
              <View style={[styles.pendingIcon, {backgroundColor: item.color + '20'}]}>
                <Icon name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.pendingContent}>
                <Text style={styles.pendingTitle}>{item.title}</Text>
                <View style={[styles.pendingBadge, {backgroundColor: item.color}]}>
                  <Text style={styles.pendingCount}>{item.count}</Text>
                </View>
              </View>
              <Icon name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{height: 30}} />
    </ScrollView>
  );
}
