import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {useFocusEffect} from '@react-navigation/native';
import {styles as s} from './styles';

const MEAL_LABELS: Record<string, {label: string; icon: string}> = {
  breakfast: {label: 'Breakfast', icon: 'sunny-outline'},
  lunch: {label: 'Lunch', icon: 'partly-sunny-outline'},
  dinner: {label: 'Dinner', icon: 'moon-outline'},
  snack: {label: 'Snack', icon: 'cafe-outline'},
  morning_snack: {label: 'Morning Snack', icon: 'cafe-outline'},
  afternoon_snack: {label: 'Afternoon Snack', icon: 'cafe-outline'},
};

const DAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
const POLL_INTERVAL_MS = 5000;

const REGEN_REASONS = [
  {value: 'wrong_goal', label: 'Does not match my goal'},
  {value: 'repetitive', label: 'Too repetitive'},
  {value: 'dislike_items', label: 'I dislike some meals'},
  {value: 'allergy_issue', label: 'Allergy or restriction issue'},
  {value: 'prep_time_issue', label: "Prep time doesn't fit"},
  {value: 'other', label: 'Other'},
];

const CHEAT_DAY_MAP: Record<string, string[]> = {
  '1 cheat day per week': ['Saturday'],
  '2 cheat days per week': ['Saturday', 'Sunday'],
};

const getPlanDays = (surveyInput: any) => {
  if (Array.isArray(surveyInput?.planDays) && surveyInput.planDays.length > 0) {
    return DAY_ORDER.filter(day => surveyInput.planDays.includes(day));
  }

  const legacyCheatDays = Array.isArray(surveyInput?.cheatDays)
    ? surveyInput.cheatDays
    : CHEAT_DAY_MAP[surveyInput?.flexibleMealPreference] || [];
  const legacyCheatDaySet = new Set(legacyCheatDays);

  return DAY_ORDER.filter(day => !legacyCheatDaySet.has(day));
};

export default function AIDietPlanScreen({navigation}: any) {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
      .get('/ai/my-diet')
      .then(res => setPlan(res.data?.length ? res.data[0] : null))
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
    Alert.alert('Success', 'A new diet plan has been generated.');
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
          nextJob.error || 'Failed to regenerate diet plan.',
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
    navigation.navigate('Main', {screen: 'DietSurvey'});
  };

  const submitRegenerate = async () => {
    if (!selectedReason) {
      Alert.alert('Required', 'Please choose why you want to regenerate.');
      return;
    }

    setRegenerating(true);
    try {
      const response = await apiClient.post('/ai/regenerate-diet', {
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

  if (loading) {
    return <ActivityIndicator style={{flex: 1}} size="large" color="#FF6B35" />;
  }

  if (!plan) {
    return (
      <View style={s.emptyContainer}>
        <Icon name="restaurant-outline" size={60} color="#ccc" />
        <Text style={s.emptyTitle}>No Diet Plan Yet</Text>
        <Text style={s.emptySubtitle}>
          Complete the Diet Survey to generate your AI diet plan.
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

  const sortedDays = DAY_ORDER.filter(d => byDay[d]);
  const createdDate = new Date(plan.created_at).toLocaleDateString();
  const queueActive =
    queueJob && ['queued', 'processing'].includes(queueJob.status);
  const planDays = getPlanDays(plan.survey_input);
  const showPlanDaysNote = planDays.length < DAY_ORDER.length;

  const dayTotals = (items: any[]) =>
    items.reduce(
      (acc, item) => ({
        calories: acc.calories + Math.round(item.calories || 0),
        protein: acc.protein + Math.round(item.protein || 0),
        carbs: acc.carbs + Math.round(item.carbs || 0),
        fat: acc.fat + Math.round(item.fat || 0),
      }),
      {calories: 0, protein: 0, carbs: 0, fat: 0},
    );

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
        <Text style={s.planName}>Your Diet Plan</Text>
        <Text style={s.generatedAt}>{'Generated on ' + createdDate}</Text>
        {showPlanDaysNote ? (
          <View style={s.planDaysBanner}>
            <Icon name="calendar-outline" size={14} color="#FF6B35" />
            <Text style={s.planDaysText}>
              Meal plan days: {planDays.join(', ')}. Other days are
              intentionally left open.
            </Text>
          </View>
        ) : null}
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
          Start a fresh survey if you want a completely new diet plan.
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
        <Text style={s.sectionTitle}>Weekly Meal Schedule</Text>
        {sortedDays.map(day => {
          const items = byDay[day];
          const totals = dayTotals(items);
          return (
            <View key={day} style={s.dayCard}>
              <View style={s.dayCardHeader}>
                <View style={s.dayHeader}>
                  <View style={s.dayBadge}>
                    <Text style={s.dayBadgeText}>{day.charAt(0)}</Text>
                  </View>
                  <Text style={s.dayName}>{day}</Text>
                  <View style={s.dayCaloriesBadge}>
                    <Text style={s.dayCaloriesText}>{totals.calories} cal</Text>
                  </View>
                </View>
                <View style={s.dayMacros}>
                  <View style={s.dayMacroItem}>
                    <Text style={s.dayMacroValue}>{totals.protein}g</Text>
                    <Text style={s.dayMacroLabel}>Protein</Text>
                  </View>
                  <View style={s.dayMacroDivider} />
                  <View style={s.dayMacroItem}>
                    <Text style={s.dayMacroValue}>{totals.carbs}g</Text>
                    <Text style={s.dayMacroLabel}>Carbs</Text>
                  </View>
                  <View style={s.dayMacroDivider} />
                  <View style={s.dayMacroItem}>
                    <Text style={s.dayMacroValue}>{totals.fat}g</Text>
                    <Text style={s.dayMacroLabel}>Fat</Text>
                  </View>
                </View>
              </View>

              <View style={s.dayBody}>
                {items.map((item: any, idx: number) => {
                  const mealInfo = MEAL_LABELS[item.meal_type] || {
                    label: item.meal_type,
                    icon: 'restaurant-outline',
                  };
                  return (
                    <TouchableOpacity
                      key={item.id ?? idx}
                      style={[
                        s.recipeRow,
                        idx < items.length - 1 && s.recipeRowBorder,
                      ]}
                      onPress={() =>
                        navigation.navigate('RecipeDetail', {
                          recipeId: item.recipe_id,
                        })
                      }>
                      <View style={s.mealTypeTag}>
                        <Icon name={mealInfo.icon} size={13} color="#FF6B35" />
                        <Text style={s.mealTypeText}>{mealInfo.label}</Text>
                      </View>
                      <View style={s.recipeContent}>
                        {item.image ? (
                          <Image
                            source={{uri: item.image}}
                            style={s.recipeImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={s.recipeImagePlaceholder}>
                            <Icon name="restaurant" size={22} color="#ddd" />
                          </View>
                        )}
                        <View style={s.recipeInfo}>
                          <Text style={s.recipeName} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <View style={s.recipeMacrosRow}>
                            <View style={s.caloriesBadge}>
                              <Text style={s.caloriesBadgeText}>
                                {Math.round(item.calories)} cal
                              </Text>
                            </View>
                            <Text style={s.prepTime}>
                              ⏱ {item.ready_in_minutes}min
                            </Text>
                          </View>
                          <View style={s.macroTagsRow}>
                            <Text style={s.macroTag}>
                              P {Math.round(item.protein)}g
                            </Text>
                            <Text style={s.macroTag}>
                              C {Math.round(item.carbs)}g
                            </Text>
                            <Text style={s.macroTag}>
                              F {Math.round(item.fat)}g
                            </Text>
                          </View>
                        </View>
                        <Icon name="chevron-forward" size={16} color="#ccc" />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
              <Text style={s.modalTitle}>Regenerate Diet Plan</Text>
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
              placeholder="Example: use quicker meals, avoid spicy food, include more high-protein options"
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
    </ScrollView>
  );
}
