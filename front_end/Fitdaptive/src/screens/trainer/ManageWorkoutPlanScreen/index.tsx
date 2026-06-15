import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

export default function ManageWorkoutPlanScreen({navigation}: any) {
  const [clients, setClients] = useState<any[]>([]);
  const [plans, setPlans] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const clientsRes = await apiClient.get('/workout/trainer/clients');
      const clientList: any[] = clientsRes.data || [];
      setClients(clientList);

      const planMap: Record<number, any[]> = {};
      await Promise.all(
        clientList.map(async (c: any) => {
          try {
            const res = await apiClient.get(
              `/workout/trainer/member/${c.user_id}`,
            );
            planMap[c.user_id] = res.data || [];
          } catch {
            planMap[c.user_id] = [];
          }
        }),
      );
      setPlans(planMap);
    } catch (e) {
      console.error('ManageWorkoutPlan fetch error:', e);
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

  const handleDelete = (planId: number, memberName: string) => {
    Alert.alert('Delete Plan', `Delete this workout plan for ${memberName}?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/workout/${planId}`);
            setPlans(prev => {
              const updated = {...prev};
              for (const uid in updated) {
                updated[uid] = updated[uid].filter(p => p.id !== planId);
              }
              return updated;
            });
          } catch (e: any) {
            Alert.alert(
              'Error',
              e?.response?.data?.error || 'Failed to delete.',
            );
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  const allPlans: any[] = clients.flatMap(c =>
    (plans[c.user_id] || []).map(p => ({
      ...p,
      member_name: c.name,
      user_id: c.user_id,
      hire_id: c.hire_id,
    })),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Workout Plans</Text>
        <Text style={styles.subtitle}>
          {allPlans.length} plan{allPlans.length !== 1 ? 's' : ''} assigned
        </Text>
      </View>

      <FlatList
        data={allPlans}
        keyExtractor={item => String(item.id)}
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
            <Icon name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No plans assigned yet</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('MemberMonitoring')}>
              <Icon name="add-circle" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Go to Members</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({item}) => (
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>Workout Plan</Text>
                <View style={styles.memberRow}>
                  <Icon name="person" size={14} color="#666" />
                  <Text style={styles.memberName}> {item.member_name}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, {backgroundColor: '#E8F5E9'}]}>
                <Text style={[styles.statusText, {color: '#34C759'}]}>
                  VERIFIED
                </Text>
              </View>
            </View>

            <View style={styles.planDetails}>
              <View style={styles.detailItem}>
                <Icon name="barbell" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {item.items?.length || 0} exercises
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="calendar" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {new Date(item.created_at).toLocaleDateString('en-GB')}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() =>
                  navigation.navigate('TrainerSessions', {
                    hireId: item.hire_id,
                    memberId: item.user_id,
                    memberName: item.member_name,
                  })
                }>
                <Icon name="calendar-outline" size={18} color="#007AFF" />
                <Text style={styles.editButtonText}>Pick Session</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(item.id, item.member_name)}>
                <Icon name="trash" size={18} color="#FF3B30" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
