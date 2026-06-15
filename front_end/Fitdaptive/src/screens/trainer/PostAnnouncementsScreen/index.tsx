import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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

export default function PostAnnouncementsScreen({route, navigation}: any) {
  const {postId, postTitle, memberCount} = route.params;
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get(`/announcements/${postId}`);
      setAnnouncements((res.data || []).reverse());
    } catch (e) {
      console.error('PostAnnouncements fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId]);

  useEffect(() => {
    navigation.setOptions({title: 'Announcements'});
    load();
    joinPostRoom(postId);
    onNewAnnouncement(ann => {
      setAnnouncements(prev => [...prev, ann]);
      setTimeout(() => listRef.current?.scrollToEnd({animated: true}), 100);
    });
    return () => {
      leavePostRoom(postId);
      getSocket()?.off('new_announcement');
    };
  }, [load, navigation, postId]);

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg) {
      return;
    }
    setSending(true);
    try {
      await apiClient.post(`/announcements/${postId}`, {message: msg});
      setText('');
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.error || 'Failed to send announcement.',
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}>
      <View style={styles.postHeader}>
        <Text style={styles.postTitle}>{postTitle}</Text>
        <Text style={styles.postMeta}>
          {memberCount} active member{memberCount !== 1 ? 's' : ''} will receive
          this
        </Text>
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
            colors={['#FF6B35']}
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
              Send a message below to broadcast to all your members
            </Text>
          </View>
        }
        renderItem={({item}) => (
          <View style={styles.card}>
            <Text style={styles.cardMessage}>{item.message}</Text>
            <Text style={styles.cardTime}>{formatTime(item.created_at)}</Text>
          </View>
        )}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Write an announcement..."
          placeholderTextColor="#aaa"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!text.trim() || sending) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!text.trim() || sending}>
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="megaphone" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
