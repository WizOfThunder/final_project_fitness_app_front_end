import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {formatMuscleLabel} from '../../../utils/formatMuscleLabel';
import {useFocusEffect} from '@react-navigation/native';
import {styles as s} from './styles';

const POLL_INTERVAL_MS = 5000;

const REGEN_REASONS = [
  {value: 'too_hard', label: 'Too hard'},
  {value: 'too_easy', label: 'Too easy'},
  {value: 'wrong_focus', label: 'Wrong focus area'},
  {value: 'repetitive', label: 'Too repetitive'},
  {value: 'equipment_mismatch', label: "Doesn't match my equipment"},
  {value: 'dislike_items', label: 'I dislike some exercises'},
  {value: 'other', label: 'Other'},
];

function formatLocalDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(value.getDate()).padStart(2, '0')}`;
}

export default function AIWorkoutPlanScreen({navigation}: any) {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [feedbackNote, setFeedbackNote] = useState('');
  const [queueJob, setQueueJob] = useState<any>(null);
  const [regenerating, setRegenerating] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollInFlightRef = useRef(false);

  const fetchPlan = useCallback(() => {
    setLoading(true);
    apiClient
      .get('/ai/my-workout')
      .then(res => {
        const plans = (res.data || [])
          .filter((item: any) => item.generated_by === 'ai')
          .sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
        setPlan(plans.length ? plans[0] : null);
      })
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPlan();
    }, [fetchPlan]),
  );

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  const clearPollTimer = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const stopQueueTracking = () => {
    clearPollTimer();
    pollInFlightRef.current = false;
    setQueueJob(null);
  };

  const handleGenerationSuccess = () => {
    stopQueueTracking();
    fetchPlan();
    Alert.alert('Success', 'A new workout plan has been generated.');
  };

  const pollJobStatus = async (jobId: string) => {
    if (pollInFlightRef.current) {
      return;
    }

    pollInFlightRef.current = true;
    let shouldContinue = true;

    try {
      const response = await apiClient.get(`/ai/generation-status/${jobId}`);
      const nextJob = response.data;
      setQueueJob(nextJob);

      if (nextJob.status === 'completed') {
        shouldContinue = false;
        handleGenerationSuccess();
      } else if (nextJob.status === 'failed') {
        shouldContinue = false;
        stopQueueTracking();
        Alert.alert(
          'Error',
          nextJob.error || 'Failed to regenerate workout plan.',
        );
      }
    } catch (err: any) {
      shouldContinue = false;
      stopQueueTracking();
      Alert.alert('Error', err?.response?.data?.error || err.message);
    } finally {
      pollInFlightRef.current = false;
    }

    if (shouldContinue) {
      clearPollTimer();
      pollTimerRef.current = setTimeout(() => {
        pollJobStatus(jobId);
      }, POLL_INTERVAL_MS);
    }
  };

  const openRegenerateModal = () => {
    if (!plan?.survey_input) {
      Alert.alert('Unavailable', 'This plan cannot be regenerated right now.');
      return;
    }

    setSelectedReason('');
    setFeedbackNote('');
    setShowRegenerateModal(true);
  };

  const openGenerateNew = () => {
    navigation.navigate('Main', {screen: 'FitnessSurvey'});
  };

  const submitRegenerate = async () => {
    if (!selectedReason) {
      Alert.alert('Required', 'Please choose why you want to regenerate.');
      return;
    }

    setRegenerating(true);
    try {
      const response = await apiClient.post('/ai/regenerate-workout', {
        planId: plan.id,
        feedback: {
          reason: selectedReason,
          note: feedbackNote.trim(),
        },
      });
      setQueueJob(response.data);
      setShowRegenerateModal(false);
      await pollJobStatus(response.data.jobId);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const handleToggle = async (itemId: number) => {
    setToggling(itemId);
    try {
      const res = await apiClient.patch(`/workout/item/${itemId}/toggle`, {
        date: formatLocalDate(new Date()),
      });
      const newDone = res.data.is_done;
      const updatedPlan = {
        ...plan,
        items: plan.items.map((item: any) =>
          item.id === itemId ? {...item, is_done: newDone} : item,
        ),
      };
      setPlan(updatedPlan);

      // Check if all of today's items are now done
      const todayName = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
      });
      const todayItems = updatedPlan.items.filter(
        (i: any) => i.day === todayName,
      );
      if (todayItems.length > 0 && todayItems.every((i: any) => i.is_done)) {
        await apiClient
          .post('/activity/workout-complete', {
            date: formatLocalDate(new Date()),
          })
          .catch(() => {});
        setWorkoutComplete(true);
      }
    } catch {}
    setToggling(null);
  };

  if (loading) {
    return <ActivityIndicator style={{flex: 1}} size="large" color="#FF6B35" />;
  }

  if (!plan) {
    return (
      <View style={s.emptyContainer}>
        <Icon name="barbell-outline" size={60} color="#ccc" />
        <Text style={s.emptyTitle}>No Workout Plan Yet</Text>
        <Text style={s.emptySubtitle}>
          Complete the Fitness Survey to generate your AI workout plan.
        </Text>
        <TouchableOpacity
          style={s.emptyButton}
          onPress={openGenerateNew}>
          <Text style={s.emptyButtonText}>Take Survey</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusMap: Record<
    string,
    {color: string; icon: string; text: string; message: string}
  > = {
    draft: {
      color: '#FF9500',
      icon: 'time-outline',
      text: 'Pending Approval',
      message: 'Your plan is pending admin review.',
    },
    verified: {
      color: '#34C759',
      icon: 'checkmark-circle',
      text: 'Approved',
      message: 'Your plan has been reviewed and approved.',
    },
    denied: {
      color: '#FF3B30',
      icon: 'close-circle',
      text: 'Denied',
      message: 'This plan was not approved. Please generate a new one.',
    },
  };
  const statusInfo = statusMap[plan.status] || {
    color: '#999',
    icon: 'help-circle',
    text: plan.status,
    message: '',
  };

  const byDay: Record<string, any[]> = {};
  (plan.items || []).forEach((item: any) => {
    if (!byDay[item.day]) {
      byDay[item.day] = [];
    }
    byDay[item.day].push(item);
  });

  const createdDate = new Date(plan.created_at).toLocaleDateString();
  // Use local timezone to get today's day name
  const todayName = new Date().toLocaleDateString('en-US', {weekday: 'long'});
  const queueActive =
    queueJob && ['queued', 'processing'].includes(queueJob.status);

  return (
    <ScrollView style={s.container}>
      <View
        style={[s.statusBanner, {backgroundColor: statusInfo.color + '22'}]}>
        <View style={s.statusHeader}>
          <Icon name={statusInfo.icon} size={24} color={statusInfo.color} />
          <Text style={[s.statusTitle, {color: statusInfo.color}]}>
            {statusInfo.text}
          </Text>
        </View>
        <Text style={s.statusMessage}>{statusInfo.message}</Text>
        {!!plan.validation_note && (
          <View style={s.adminNote}>
            <Icon name="chatbox-outline" size={14} color={statusInfo.color} />
            <Text style={[s.adminNoteText, {color: statusInfo.color}]}>
              {plan.validation_note}
            </Text>
          </View>
        )}
      </View>

      <View style={s.planHeader}>
        <View style={s.aiTag}>
          <Icon name="sparkles" size={16} color="#FF6B35" />
          <Text style={s.aiTagText}>AI Generated</Text>
        </View>
        <Text style={s.planName}>Your Workout Plan</Text>
        <Text style={s.generatedAt}>{'Generated on ' + createdDate}</Text>
        <TouchableOpacity
          style={[
            s.primaryButton,
            queueActive && s.secondaryButtonDisabled,
          ]}
          onPress={openGenerateNew}
          disabled={queueActive || regenerating}>
          <Icon name="add-circle-outline" size={18} color="#fff" />
          <Text style={s.primaryButtonText}>Generate New</Text>
        </TouchableOpacity>
        <Text style={s.regenerateHint}>
          Start a fresh survey if you want a completely new workout plan.
        </Text>
        <TouchableOpacity
          style={[
            s.secondaryButton,
            queueActive && s.secondaryButtonDisabled,
          ]}
          onPress={openRegenerateModal}
          disabled={queueActive || regenerating}>
          {regenerating ? (
            <ActivityIndicator size="small" color="#FF6B35" />
          ) : (
            <Icon name="refresh-outline" size={16} color="#FF6B35" />
          )}
          <Text style={s.secondaryButtonText}>Regenerate with Feedback</Text>
        </TouchableOpacity>
        <Text style={s.regenerateHint}>
          Sends a new AI request. Use only if this plan still misses your
          needs.
        </Text>
        {queueActive ? (
          <View style={s.queueBanner}>
            <Icon name="time-outline" size={14} color="#FF9500" />
            <Text style={s.queueBannerText}>
              {queueJob.status === 'queued'
                ? `Regeneration queued${
                    queueJob.peopleAhead > 0
                      ? ` • ${queueJob.peopleAhead} ahead`
                      : ''
                  }`
                : 'Regeneration in progress'}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Weekly Schedule</Text>
        {Object.entries(byDay).map(([day, exercises]) => {
          const doneCount = exercises.filter((e: any) => e.is_done).length;
          const total = exercises.length;
          const isToday = day === todayName;
          return (
            <View key={day} style={s.dayCard}>
              <View style={s.dayHeader}>
                <View style={[s.dayBadge, isToday && s.dayBadgeToday]}>
                  <Text style={s.dayBadgeText}>{day.charAt(0)}</Text>
                </View>
                <Text style={s.dayName}>
                  {day}
                  {isToday ? '  📍 Today' : ''}
                </Text>
                <Text style={s.doneCount}>{doneCount + '/' + total}</Text>
              </View>
              {exercises.map((ex: any) => {
                const isDone: boolean = !!ex.is_done;
                const isToggling: boolean = toggling === ex.id;
                const isLocked = !isToday;
                const detail =
                  ex.sets +
                  ' sets × ' +
                  (ex.reps ? ex.reps + ' reps' : ex.duration + 's') +
                  ' • ' +
                  formatMuscleLabel(ex.muscle);
                return (
                  <View
                    key={ex.id}
                    style={[s.exerciseRow, isToggling && s.exerciseRowFaded]}>
                    <TouchableOpacity
                      style={[
                        s.checkbox,
                        isDone && s.checkboxDone,
                        isLocked && s.checkboxLocked,
                      ]}
                      onPress={() => handleToggle(ex.id)}
                      disabled={isToggling || isLocked}>
                      {isDone ? (
                        <Icon name="checkmark" size={16} color="#fff" />
                      ) : isLocked ? (
                        <Icon name="lock-closed" size={12} color="#ccc" />
                      ) : null}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.exerciseInfo}
                      onPress={() =>
                        navigation.navigate('ExerciseDetail', {exercise: ex})
                      }>
                      <Text
                        style={[s.exerciseName, isDone && s.exerciseNameDone]}>
                        {ex.name}
                      </Text>
                      <Text style={s.exerciseDetail}>{detail}</Text>
                    </TouchableOpacity>
                    <Icon name="chevron-forward" size={16} color="#ccc" />
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
      <View style={{height: 30}} />

      <Modal
        visible={showRegenerateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRegenerateModal(false)}>
        <TouchableOpacity
          activeOpacity={1}
          style={s.modalOverlay}
          onPress={() => !regenerating && setShowRegenerateModal(false)}>
          <TouchableOpacity activeOpacity={1} style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Regenerate Workout Plan</Text>
              <TouchableOpacity
                onPress={() => setShowRegenerateModal(false)}
                disabled={regenerating}>
                <Icon name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={s.modalDescription}>
              Tell the AI what was wrong so it does not keep making the same
              mistake.
            </Text>
            <Text style={s.modalSectionTitle}>Main reason</Text>
            <View style={s.reasonChips}>
              {REGEN_REASONS.map(reason => {
                const isActive = selectedReason === reason.value;
                return (
                  <TouchableOpacity
                    key={reason.value}
                    style={[s.reasonChip, isActive && s.reasonChipActive]}
                    onPress={() => setSelectedReason(reason.value)}>
                    <Text
                      style={[
                        s.reasonChipText,
                        isActive && s.reasonChipTextActive,
                      ]}>
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={s.modalSectionTitle}>Extra feedback (optional)</Text>
            <TextInput
              style={s.feedbackInput}
              value={feedbackNote}
              onChangeText={setFeedbackNote}
              placeholder="Example: avoid too many lunges, use more dumbbell exercises, make it easier on my knees"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!regenerating}
            />
            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalCancelButton}
                onPress={() => setShowRegenerateModal(false)}
                disabled={regenerating}>
                <Text style={s.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalSubmitButton}
                onPress={submitRegenerate}
                disabled={regenerating}>
                {regenerating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.modalSubmitButtonText}>Send Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={workoutComplete}
        transparent
        animationType="fade"
        onRequestClose={() => setWorkoutComplete(false)}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setWorkoutComplete(false)}>
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              padding: 32,
              alignItems: 'center',
              marginHorizontal: 40,
            }}>
            <Text style={{fontSize: 48}}>🎉</Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#333',
                marginTop: 12,
              }}>
              Today's workout complete!
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#888',
                marginTop: 8,
                textAlign: 'center',
              }}>
              Great job! Your streak has been updated.
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 20,
                backgroundColor: '#FF6B35',
                paddingHorizontal: 32,
                paddingVertical: 12,
                borderRadius: 12,
              }}
              onPress={() => setWorkoutComplete(false)}>
              <Text style={{color: '#fff', fontWeight: '700', fontSize: 15}}>
                Keep it up!
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}
