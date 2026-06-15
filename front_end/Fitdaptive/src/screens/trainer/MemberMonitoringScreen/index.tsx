import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

const getAge = (dob?: string | null) => {
  if (!dob) {
    return null;
  }

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const formatGender = (gender?: string | null) => {
  if (!gender) {
    return null;
  }

  return gender.charAt(0).toUpperCase() + gender.slice(1);
};

export default function MemberMonitoringScreen({navigation}: any) {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/workout/trainer/clients');
      setClients(res.data || []);
    } catch (e) {
      console.error('MemberMonitoring fetch error:', e);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Members</Text>
        <Text style={styles.subtitle}>
          {clients.length} active client{clients.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={clients}
        keyExtractor={item => String(item.hire_id)}
        contentContainerStyle={styles.listContainer}
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
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No active clients yet</Text>
          </View>
        }
        renderItem={({item}) => {
          const memberFacts = [
            formatGender(item.gender),
            getAge(item.dob) != null ? `${getAge(item.dob)} yrs` : null,
            item.height != null ? `${Number(item.height)} cm` : null,
            item.weight != null ? `${Number(item.weight)} kg` : null,
          ].filter(Boolean);
          const completionRate =
            item.total_this_week > 0
              ? Math.round((item.done_this_week / item.total_this_week) * 100)
              : null;
          return (
            <TouchableOpacity
              style={styles.memberCard}
              onPress={() =>
                navigation.navigate('TrainerSessions', {
                  hireId: item.hire_id,
                  memberId: item.user_id,
                  memberName: item.name,
                })
              }>
              {item.avatar_url ? (
                <Image
                  source={{uri: item.avatar_url}}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Text style={styles.profilePlaceholderText}>
                    {item.name?.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberEmail}>{item.post_title}</Text>
                {!!item.phone_number && (
                  <View style={styles.phoneRow}>
                    <Icon name="call-outline" size={13} color="#666" />
                    <Text style={styles.phoneText}>{item.phone_number}</Text>
                  </View>
                )}
                {memberFacts.length > 0 && (
                  <View style={styles.profileFactsRow}>
                    {memberFacts.map(fact => (
                      <View key={String(fact)} style={styles.profileFactChip}>
                        <Text style={styles.profileFactText}>{fact}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Icon name="document-text-outline" size={14} color="#666" />
                    <Text style={styles.statText}>
                      {item.plan_count} plan{item.plan_count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  {completionRate !== null && (
                    <View style={styles.statItem}>
                      <Icon name="checkmark-circle" size={14} color="#34C759" />
                      <Text style={styles.statText}>
                        {completionRate}% this week
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          item.visibility === 'private' ? '#007AFF' : '#FF6B35',
                      },
                    ]}>
                    <Text style={styles.statusText}>
                      {item.visibility === 'private' ? '1-on-1' : 'Public'}
                    </Text>
                  </View>
                </View>
              </View>
              <Icon name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
