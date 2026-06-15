import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

const STATUS_COLOR: Record<string, string> = {
  upcoming: '#FF9500',
  started: '#007AFF',
  confirmed: '#34C759',
  missed: '#FF3B30',
};
const STATUS_ICON: Record<string, string> = {
  upcoming: 'time-outline',
  started: 'play-circle-outline',
  confirmed: 'checkmark-circle',
  missed: 'close-circle-outline',
};

const PAST_HIRE_STATUSES = ['ended', 'cancelled', 'expired'];

const parseDateOnly = (value?: string | null) => {
  if (!value) {
    return new Date(NaN);
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  return new Date(value);
};

const sortSessionsBySchedule = (items: any[], newestFirst = false) =>
  [...items].sort((a, b) => {
    const left = `${a.scheduled_date} ${a.scheduled_start || '00:00:00'}`;
    const right = `${b.scheduled_date} ${b.scheduled_start || '00:00:00'}`;
    return newestFirst ? right.localeCompare(left) : left.localeCompare(right);
  });

export default function TrainerSessionScreen({route, navigation}: any) {
  const {hireId, memberName, memberId} = route.params;
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [hire, setHire] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState<number | null>(null);
  const [activeCode, setActiveCode] = useState<{
    code: string;
    sessionId: number;
  } | null>(null);
  const [noteModal, setNoteModal] = useState<{
    sessionId: number;
    current: string;
  } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get(`/sessions/hire/${hireId}`);
      setSessions(res.data.sessions || []);
      setStats(res.data.stats);
      setHire(res.data.hire || null);
    } catch (e) {
      console.error('TrainerSession fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hireId]);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({title: `Sessions — ${memberName}`});
      load();
    }, [load, memberName, navigation]),
  );

  const handleStart = async (session: any) => {
    setStarting(session.id);
    try {
      const res = await apiClient.post(`/sessions/${session.id}/start`);
      setActiveCode({code: res.data.code, sessionId: session.id});
      load();
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.error || 'Failed to start session.',
      );
    } finally {
      setStarting(null);
    }
  };

  const confirmStart = (session: any) => {
    Alert.alert(
      'Start Session?',
      'Starting the session will generate a confirmation code that is only valid for 30 minutes. If the member does not enter the code before it expires, the session will be treated as missed and will not reset automatically.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Start Session',
          onPress: () => handleStart(session),
        },
      ],
    );
  };

  const openNoteModal = (session: any) => {
    setNoteModal({sessionId: session.id, current: session.trainer_note || ''});
    setNoteText(session.trainer_note || '');
  };

  const handleSaveNote = async () => {
    if (!noteModal) {
      return;
    }
    setSavingNote(true);
    try {
      await apiClient.put(`/sessions/${noteModal.sessionId}/note`, {
        note: noteText.trim() || null,
      });
      setSessions(prev =>
        prev.map(s =>
          s.id === noteModal.sessionId
            ? {...s, trainer_note: noteText.trim() || null}
            : s,
        ),
      );
      setNoteModal(null);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to save note.');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  const isHistoryMode = PAST_HIRE_STATUSES.includes(hire?.status);
  const displaySessions = sortSessionsBySchedule(sessions, isHistoryMode);

  return (
    <View style={styles.container}>
      {stats && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValueGreen}>{stats.confirmed}</Text>
            <Text style={styles.statLabel}>Confirmed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValueRed}>{stats.missed}</Text>
            <Text style={styles.statLabel}>Missed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValueOrange}>{stats.upcoming}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
        </View>
      )}

      {activeCode && (
        <View style={styles.codeBanner}>
          <Text style={styles.codeBannerLabel}>
            Share this code with {memberName}:
          </Text>
          <Text style={styles.codeText}>{activeCode.code}</Text>
          <Text style={styles.codeExpiry}>Valid for 30 minutes</Text>
          <TouchableOpacity
            onPress={() => setActiveCode(null)}
            style={styles.codeDismiss}>
            <Text style={styles.codeDismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={displaySessions}
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
        ListEmptyComponent={
          <Text style={styles.empty}>
            {isHistoryMode
              ? 'No session history available.'
              : 'No sessions scheduled yet.'}
          </Text>
        }
        ListHeaderComponent={
          isHistoryMode && displaySessions.length > 0 ? (
            <View style={styles.historyBanner}>
              <Icon name="time-outline" size={15} color="#666" />
              <Text style={styles.historyBannerText}>Session history</Text>
            </View>
          ) : null
        }
        renderItem={({item}) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <Icon
                name={STATUS_ICON[item.status]}
                size={22}
                color={STATUS_COLOR[item.status]}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.cardDay}>{item.scheduled_day}</Text>
                <Text style={styles.cardTime}>{item.scheduled_start}</Text>
                <Text style={styles.cardDate}>
                  {parseDateOnly(item.scheduled_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
                {!!item.trainer_note && (
                  <Text style={styles.notePreview} numberOfLines={2}>
                    {item.trainer_note}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.noteBtn}
                onPress={() => openNoteModal(item)}>
                <Icon
                  name={
                    item.trainer_note
                      ? 'document-text'
                      : 'document-text-outline'
                  }
                  size={18}
                  color={item.trainer_note ? '#FF6B35' : '#aaa'}
                />
              </TouchableOpacity>
              {memberId && ['upcoming', 'started'].includes(item.status) && (
                <TouchableOpacity
                  style={styles.planBtn}
                  onPress={() =>
                    navigation.navigate('CreateWorkoutPlan', {
                      memberId,
                      memberName,
                      sessionId: item.id,
                      sessionDay: item.scheduled_day,
                      sessionDate: item.scheduled_date,
                      sessionPlan: item.session_plan,
                    })
                  }>
                  <Icon name="barbell-outline" size={16} color="#007AFF" />
                  <Text style={styles.planBtnText}>
                    {item.session_plan ? 'Edit Plan' : 'Plan'}
                  </Text>
                </TouchableOpacity>
              )}
              {item.status === 'upcoming' && (
                <TouchableOpacity
                  style={styles.startBtn}
                  onPress={() => confirmStart(item)}
                  disabled={starting === item.id}>
                  {starting === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.startBtnText}>Start</Text>
                  )}
                </TouchableOpacity>
              )}
              {item.status === 'started' && (
                <View style={styles.waitingBadge}>
                  <Text style={styles.waitingText}>Waiting...</Text>
                </View>
              )}
            </View>
          </View>
        )}
      />

      {/* Note Modal */}
      <Modal
        visible={!!noteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setNoteModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Session Agenda</Text>
            <Text style={styles.modalSubtitle}>
              What will the member be doing this session?
            </Text>
            <TextInput
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="e.g. Upper body strength training: bench press 4x8, shoulder press 3x10, pull-ups 3x8..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setNoteModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, savingNote && {opacity: 0.6}]}
                onPress={handleSaveNote}
                disabled={savingNote}>
                {savingNote ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
