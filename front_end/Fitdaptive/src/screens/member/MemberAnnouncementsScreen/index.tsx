import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {
  joinPostRoom,
  leavePostRoom,
  onNewAnnouncement,
  getSocket,
} from '../../../services/socketService';
import {styles} from './styles';

const formatTime = (d?: string) => {
  const parsed = d ? new Date(d) : new Date();

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function MemberAnnouncementsScreen({route, navigation}: any) {
  const {postId, postTitle, trainerName} = route.params;
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get(`/announcements/${postId}`);
      setAnnouncements((res.data || []).reverse());
    } catch (e) {
      console.error('MemberAnnouncements fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId]);

  useEffect(() => {
    navigation.setOptions({title: `${trainerName}'s Announcements`});
    load();
    joinPostRoom(postId);
    onNewAnnouncement(ann => {
      setAnnouncements(prev => [...prev, ann]);
      setNewIds(prev => new Set(prev).add(ann.id));
      setTimeout(() => listRef.current?.scrollToEnd({animated: true}), 100);
    });
    return () => {
      leavePostRoom(postId);
      getSocket()?.off('new_announcement');
    };
  }, [load, navigation, postId, trainerName]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.postHeader}>
        <Text style={styles.postTitle}>{postTitle}</Text>
        <Text style={styles.postMeta}>Announcements from {trainerName}</Text>
      </View>

      <FlatList
        ref={listRef}
        data={announcements}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={['#007AFF']}
          />
        }
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({animated: false})
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="megaphone-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No announcements yet</Text>
            <Text style={styles.emptySubText}>
              Your trainer hasn't posted anything yet. Check back later.
            </Text>
          </View>
        }
        renderItem={({item}) => (
          <View style={styles.card}>
            {newIds.has(item.id) && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
            <Text style={styles.trainerLabel}>{item.trainer_name}</Text>
            <Text style={styles.cardMessage}>{item.message}</Text>
            <Text style={styles.cardTime}>{formatTime(item.created_at)}</Text>
          </View>
        )}
      />
    </View>
  );
}
