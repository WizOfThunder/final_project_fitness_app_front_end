import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {useAuth} from '../../../store/AuthContext';
import {formatMuscleLabel} from '../../../utils/formatMuscleLabel';
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
const DISPUTE_REASONS = [
  {value: 'trainer_no_show', label: 'Trainer did not show up'},
  {value: 'wrong_content', label: 'Content was not as described'},
  {value: 'technical_issues', label: 'Technical issues (online session)'},
  {value: 'other', label: 'Other'},
];

const DISPUTE_BANNER_BG: Record<string, string> = {
  resolved: '#E8F5E9',
  rejected: '#FFEBEE',
  open: '#FFF3E0',
};
const DISPUTE_ICON: Record<string, string> = {
  resolved: 'checkmark-circle',
  rejected: 'close-circle',
  open: 'warning',
};
const DISPUTE_ICON_COLOR: Record<string, string> = {
  resolved: '#34C759',
  rejected: '#FF3B30',
  open: '#FF9500',
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

export default function MemberSessionScreen({route, navigation}: any) {
  const {hireId, trainerName} = route.params;
  const {notifRefreshKey} = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [hire, setHire] = useState<any>(
    route.params?.hireStatus ? {status: route.params.hireStatus} : null,
  );
  const [dispute, setDispute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [code, setCode] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('trainer_no_show');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sessRes, dispRes] = await Promise.all([
        apiClient.get(`/sessions/hire/${hireId}`),
        apiClient.get(`/sessions/hire/${hireId}/dispute`),
      ]);
      setSessions(sessRes.data.sessions || []);
      setStats(sessRes.data.stats);
      setHire(sessRes.data.hire || null);
      setDispute(dispRes.data);
    } catch (e) {
      console.error('MemberSession fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hireId]);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({title: `Sessions — ${trainerName}`});
      load();
    }, [load, navigation, trainerName]),
  );

  useEffect(() => {
    if (notifRefreshKey > 0) {
      load();
    }
  }, [load, notifRefreshKey]);

  const openConfirmation = useCallback((session: any) => {
    setConfirmingId(session.id);
    setCode(session.confirm_code || '');
  }, []);

  const confirmSession = useCallback(
    async (sessionId?: number | null, sessionCode?: string) => {
      const normalizedCode = String(sessionCode || '').trim();
      if (!normalizedCode || !sessionId) {
        return;
      }

      setConfirming(true);
      try {
        await apiClient.post(`/sessions/${sessionId}/confirm`, {
          code: normalizedCode,
        });
        Alert.alert('Confirmed!', 'Your attendance has been recorded.');
        setConfirmingId(null);
        setCode('');
        await load();
      } catch (e: any) {
        Alert.alert('Error', e?.response?.data?.error || 'Failed to confirm.');
      } finally {
        setConfirming(false);
      }
    },
    [load],
  );

  const handleConfirm = async () => {
    if (!code.trim() || !confirmingId) {
      return;
    }

    await confirmSession(confirmingId, code);
  };

  const handleDispute = async () => {
    setSubmittingDispute(true);
    try {
      await apiClient.post(`/sessions/hire/${hireId}/dispute`, {
        reason: disputeReason,
        description: disputeDesc || null,
      });
      Alert.alert(
        'Dispute Submitted',
        'An admin will review your dispute and get back to you.',
      );
      setShowDispute(false);
      load();
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.error || 'Failed to submit dispute.',
      );
    } finally {
      setSubmittingDispute(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const hasReachedFirstSession = sessions.some((session: any) => {
    const sessionDate = parseDateOnly(session.scheduled_date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate <= today;
  });
  const canDispute =
    hire?.status === 'active' &&
    hasReachedFirstSession &&
    (!dispute || dispute.status !== 'open');
  const disputeStatus = dispute?.status || 'open';
  const isHistoryMode = PAST_HIRE_STATUSES.includes(hire?.status);
  const displaySessions = sortSessionsBySchedule(sessions, isHistoryMode);
  const activeStartedSession = displaySessions.find(
    (session: any) => session.status === 'started' && session.confirm_code,
  );

  useEffect(() => {
    if (!route.params?.openDispute || loading) {
      return;
    }

    if (canDispute) {
      setShowDispute(true);
    } else {
      const message =
        dispute?.status === 'open'
          ? 'A dispute for this subscription is already under review.'
          : 'You can report an issue after your first active session.';
      Alert.alert('Unavailable', message);
    }

    navigation.setParams({openDispute: false});
  }, [
    canDispute,
    dispute?.status,
    loading,
    navigation,
    route.params?.openDispute,
  ]);

  useEffect(() => {
    const targetSessionId = Number(route.params?.focusSessionId);
    if (!Number.isFinite(targetSessionId) || loading) {
      return;
    }

    const targetSession = sessions.find(
      (session: any) => session.id === targetSessionId,
    );
    if (targetSession?.status === 'started') {
      openConfirmation(targetSession);
    }

    navigation.setParams({focusSessionId: undefined});
  }, [
    loading,
    navigation,
    openConfirmation,
    route.params?.focusSessionId,
    sessions,
  ]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

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
            <Text style={styles.statLabel}>Attended</Text>
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

      {activeStartedSession && (
        <View style={styles.codeBanner}>
          <Text style={styles.codeBannerLabel}>
            {trainerName} started the session. Use this code to confirm
            attendance:
          </Text>
          <Text style={styles.codeText}>
            {activeStartedSession.confirm_code}
          </Text>
          <Text style={styles.codeExpiry}>Valid for 30 minutes</Text>
          <TouchableOpacity
            style={[styles.codeAction, confirming && styles.confirmBtnDisabled]}
            onPress={() =>
              confirmSession(
                activeStartedSession.id,
                activeStartedSession.confirm_code,
              )
            }
            disabled={confirming}>
            {confirming ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.codeActionText}>Confirm Now</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {dispute && (
        <View
          style={[
            styles.disputeBanner,
            {backgroundColor: DISPUTE_BANNER_BG[disputeStatus]},
          ]}>
          <Icon
            name={DISPUTE_ICON[disputeStatus]}
            size={16}
            color={DISPUTE_ICON_COLOR[disputeStatus]}
          />
          <Text style={styles.disputeBannerText}>
            {disputeStatus === 'open'
              ? 'Dispute under review by admin'
              : disputeStatus === 'resolved'
              ? `Dispute resolved${
                  dispute.admin_note ? ': ' + dispute.admin_note : ''
                }`
              : `Dispute rejected${
                  dispute.admin_note ? ': ' + dispute.admin_note : ''
                }`}
          </Text>
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
            colors={['#007AFF']}
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
            <View style={styles.cardTop}>
              <Icon
                name={STATUS_ICON[item.status]}
                size={22}
                color={STATUS_COLOR[item.status]}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.cardDay}>{item.scheduled_day}</Text>
                <Text style={styles.cardTime}>{item.scheduled_start}</Text>
                <Text style={styles.cardDate}>
                  {parseDateOnly(item.scheduled_date).toLocaleDateString(
                    'en-GB',
                    {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    },
                  )}
                </Text>
                {!!item.trainer_note && (
                  <View style={styles.noteBox}>
                    <Icon
                      name="document-text-outline"
                      size={13}
                      color="#FF6B35"
                    />
                    <Text style={styles.noteText}> {item.trainer_note}</Text>
                  </View>
                )}
              </View>
              {item.status === 'started' && confirmingId !== item.id && (
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => openConfirmation(item)}>
                  <Text style={styles.confirmBtnText}>Enter Code</Text>
                </TouchableOpacity>
              )}
            </View>
            {!!item.session_plan?.items?.length && (
              <View style={styles.planBox}>
                <View style={styles.planHeader}>
                  <Icon name="barbell-outline" size={14} color="#007AFF" />
                  <Text style={styles.planTitle}>Session Plan</Text>
                </View>
                {item.session_plan.items.map((exercise: any) => {
                  const detail = [
                    exercise.sets && `${exercise.sets} sets`,
                    exercise.reps
                      ? `${exercise.reps} reps`
                      : exercise.duration
                      ? `${exercise.duration}s`
                      : null,
                    formatMuscleLabel(exercise.muscle),
                  ]
                    .filter(Boolean)
                    .join(' · ');

                  return (
                    <View key={exercise.id} style={styles.planItem}>
                      <Icon name="ellipse" size={8} color="#007AFF" />
                      <View style={styles.planItemContent}>
                        <Text style={styles.planItemName}>{exercise.name}</Text>
                        {!!detail && (
                          <Text style={styles.planItemDetail}>{detail}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
            {item.status === 'started' && confirmingId === item.id && (
              <View style={styles.codeRow}>
                <TextInput
                  style={styles.codeInput}
                  value={code}
                  onChangeText={setCode}
                  placeholder="6-digit code"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                  maxLength={6}
                  autoFocus
                />
                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    (confirming || code.length !== 6) &&
                      styles.confirmBtnDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={confirming || code.length !== 6}>
                  {confirming ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Confirm</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      <Modal
        visible={showDispute}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDispute(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Report an Issue</Text>
            <Text style={styles.modalSubtitle}>
              Select the reason for your dispute:
            </Text>
            {DISPUTE_REASONS.map(r => (
              <TouchableOpacity
                key={r.value}
                style={[
                  styles.reasonRow,
                  disputeReason === r.value && styles.reasonRowActive,
                ]}
                onPress={() => setDisputeReason(r.value)}>
                <Icon
                  name={
                    disputeReason === r.value
                      ? 'radio-button-on'
                      : 'radio-button-off'
                  }
                  size={18}
                  color={disputeReason === r.value ? '#007AFF' : '#888'}
                />
                <Text
                  style={
                    disputeReason === r.value
                      ? styles.reasonTextActive
                      : styles.reasonText
                  }>
                  {' '}
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={styles.descInput}
              value={disputeDesc}
              onChangeText={setDisputeDesc}
              placeholder="Additional details (optional)..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDispute(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  submittingDispute && styles.submitBtnDisabled,
                ]}
                onPress={handleDispute}
                disabled={submittingDispute}>
                {submittingDispute ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
