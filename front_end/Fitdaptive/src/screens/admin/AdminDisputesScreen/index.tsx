import React, {useState, useCallback} from 'react';
import {View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, TextInput, Modal} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

const REASON_LABEL: Record<string, string> = {
  trainer_no_show: 'Trainer No-Show',
  wrong_content: 'Wrong Content',
  technical_issues: 'Technical Issues',
  other: 'Other',
};

export default function AdminDisputesScreen() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resolving, setResolving] = useState<any>(null);
  const [note, setNote] = useState('');
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get('/sessions/disputes');
      setDisputes(res.data || []);
    } catch (e) {
      console.error('AdminDisputes fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleResolve = async (status: 'resolved' | 'rejected') => {
    if (!resolving) return;
    setActing(true);
    try {
      await apiClient.put(`/sessions/disputes/${resolving.id}/resolve`, {status, note: note || null});
      Alert.alert('Done', `Dispute ${status}.`);
      setResolving(null);
      setNote('');
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed.');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#FF6B35" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={disputes}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#FF6B35']} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="shield-checkmark-outline" size={56} color="#ccc" />
            <Text style={styles.emptyText}>No open disputes</Text>
          </View>
        }
        renderItem={({item}) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.reasonBadge}>
                <Text style={styles.reasonText}>{REASON_LABEL[item.reason] || item.reason}</Text>
              </View>
              <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString('en-GB')}</Text>
            </View>
            <Text style={styles.postTitle}>{item.post_title}</Text>
            <View style={styles.row}>
              <Icon name="person-outline" size={13} color="#888" />
              <Text style={styles.meta}> Member: {item.member_name}</Text>
            </View>
            <View style={styles.row}>
              <Icon name="barbell-outline" size={13} color="#888" />
              <Text style={styles.meta}> Trainer: {item.trainer_name}</Text>
            </View>
            <View style={styles.row}>
              <Icon name="checkmark-done-outline" size={13} color="#888" />
              <Text style={styles.meta}> Sessions confirmed: {item.sessions_confirmed}/{item.sessions_total}</Text>
            </View>
            {!!item.description && (
              <Text style={styles.description}>"{item.description}"</Text>
            )}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.resolveBtn} onPress={() => { setResolving(item); setNote(''); }}>
                <Icon name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={styles.btnText}> Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={!!resolving} transparent animationType="slide" onRequestClose={() => setResolving(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Resolve Dispute</Text>
            <Text style={styles.modalSub}>{resolving?.member_name} — {REASON_LABEL[resolving?.reason]}</Text>
            <Text style={styles.modalSub}>Sessions confirmed: {resolving?.sessions_confirmed}/{resolving?.sessions_total}</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Admin note (sent to member and trainer)..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setResolving(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.rejectBtn, acting && {opacity: 0.6}]} onPress={() => handleResolve('rejected')} disabled={acting}>
                {acting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Reject</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.resolveBtn, acting && {opacity: 0.6}]} onPress={() => handleResolve('resolved')} disabled={acting}>
                {acting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Resolve</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
