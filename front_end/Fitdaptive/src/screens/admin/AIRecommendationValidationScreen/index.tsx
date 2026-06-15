import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, FlatList, TouchableOpacity, Modal, TextInput, Alert, ScrollView, ActivityIndicator, RefreshControl} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {formatMuscleLabel} from '../../../utils/formatMuscleLabel';
import {styles} from './styles';

const STATUS_COLOR: Record<string, string> = {
  draft:    '#FF9500',
  verified: '#34C759',
  denied:   '#FF3B30',
};

const DIET_DAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function calcAge(dob: string | null) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const NONE_LABEL = 'None';

function normalizeString(value: any) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function normalizeList(values: any, excluded: string[] = []) {
  const excludedSet = new Set(excluded.map(value => value.toLowerCase()));

  return Array.isArray(values)
    ? values
        .map(normalizeString)
        .filter(
          value => value && !excludedSet.has(value.toLowerCase()),
        )
    : [];
}

function formatTextValue(value: any) {
  const text = normalizeString(value);
  return text || NONE_LABEL;
}

function formatListValue(values: any, emptyLabel = NONE_LABEL) {
  const list = normalizeList(values);
  return list.length ? list.join(', ') : emptyLabel;
}

function formatListWithOther(
  values: any,
  other: any,
  options: {excluded?: string[]; emptyLabel?: string} = {},
) {
  const list = normalizeList(values, options.excluded || []);
  const otherValue = normalizeString(other);
  const combined = otherValue ? [...list, otherValue] : list;
  return combined.length ? combined.join(', ') : options.emptyLabel || NONE_LABEL;
}

function formatLocationValue(location: any) {
  const city = normalizeString(location?.city);
  const country = normalizeString(location?.country);
  const parts = [city, country].filter(Boolean);
  return parts.length ? parts.join(', ') : NONE_LABEL;
}

function formatPlanDaysValue(survey: any) {
  const explicitPlanDays = normalizeList(survey?.planDays);
  if (explicitPlanDays.length) {
    return explicitPlanDays.join(', ');
  }

  const cheatDaySet = new Set(normalizeList(survey?.cheatDays));
  if (cheatDaySet.size > 0) {
    const legacyPlanDays = DIET_DAY_ORDER.filter(day => !cheatDaySet.has(day));
    return legacyPlanDays.length ? legacyPlanDays.join(', ') : NONE_LABEL;
  }

  return NONE_LABEL;
}

function SurveySection({label, survey, user}: {label: string; survey: any; user: any}) {
  if (!survey) return null;
  const rows: {key: string; value: string}[] = [];

  if (user) {
    rows.push({key: 'User', value: user.name});
    rows.push({key: 'Height / Weight', value: `${user.height ?? '?'} cm / ${user.weight ?? '?'} kg`});
    rows.push({key: 'Gender / Age', value: `${user.gender ?? '?'} / ${calcAge(user.dob) ?? '?'} yrs`});
  }

  if (label === 'Workout') {
    rows.push({key: 'Goal', value: formatTextValue(survey.goal)});
    rows.push({key: 'Fitness Level', value: formatTextValue(survey.fitnessLevel)});
    rows.push({key: 'Training Experience', value: formatTextValue(survey.trainingExperience)});
    rows.push({key: 'Equipment', value: formatListWithOther(survey.equipment, survey.equipmentOther)});
    rows.push({key: 'Days', value: formatListValue(survey.days)});
    rows.push({key: 'Duration', value: formatTextValue(survey.duration)});
    rows.push({key: 'Focus Areas', value: formatListValue(survey.focusAreas)});
    rows.push({
      key: 'Health Conditions',
      value: formatListWithOther(survey.healthConditions, survey.healthConditionsOther, {
        excluded: ['None'],
      }),
    });
    rows.push({
      key: 'Medication Factors',
      value: formatListWithOther(survey.medicationFactors, survey.medicationFactorsOther),
    });
    rows.push({key: 'AI Note', value: formatTextValue(survey.additionalNote)});
  } else {
    rows.push({key: 'Goal', value: formatTextValue(survey.goal)});
    rows.push({key: 'Diet Type', value: formatTextValue(survey.dietType)});
    rows.push({key: 'Preferred Cuisines', value: formatListValue(survey.preferredCuisines)});
    rows.push({
      key: 'Allergies',
      value: formatListWithOther(survey.allergies, survey.allergiesOther, {
        excluded: ['None'],
      }),
    });
    rows.push({key: 'Meals/Day', value: formatTextValue(survey.mealsPerDay)});
    rows.push({key: 'Prep Time', value: formatTextValue(survey.prepTime)});
    rows.push({
      key: 'Available Ingredients',
      value: formatListValue(survey.availableIngredients),
    });
    rows.push({
      key: 'Available Tools',
      value: formatListValue(survey.availableTools),
    });
    rows.push({
      key: 'Plan Days',
      value: formatPlanDaysValue(survey),
    });
    rows.push({key: 'Location', value: formatLocationValue(survey.location)});
    rows.push({
      key: 'Flexibility Preference',
      value: formatTextValue(survey.flexibleMealPreference),
    });
    rows.push({
      key: 'Flexibility Details',
      value: formatTextValue(survey.flexibleMealDetails),
    });
    rows.push({key: 'AI Note', value: formatTextValue(survey.additionalNote)});
  }

  return (
    <View style={s.surveyBox}>
      <Text style={s.surveyTitle}>📋 Survey Input</Text>
      {rows.map(r => (
        <View key={r.key} style={s.surveyRow}>
          <Text style={s.surveyKey}>{r.key}</Text>
          <Text style={s.surveyValue}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

function WorkoutItems({items, navigation}: {items: any[]; navigation: any}) {
  const byDay: Record<string, any[]> = {};
  (items || []).forEach((item: any) => {
    if (!byDay[item.day]) byDay[item.day] = [];
    byDay[item.day].push(item);
  });
  return (
    <View style={s.itemsBox}>
      <Text style={s.itemsTitle}>🏋️ Generated Plan</Text>
      {Object.entries(byDay).map(([day, exs]) => (
        <View key={day} style={s.dayBlock}>
          <Text style={s.dayLabel}>{day}</Text>
          {exs.map((ex: any, i: number) => {
            const canOpenDetail = !!(ex.exercise_id || ex.id);
            return (
              <TouchableOpacity
                key={i}
                style={[s.itemButton, !canOpenDetail && s.itemButtonDisabled]}
                disabled={!canOpenDetail}
                onPress={() =>
                  navigation.navigate('ExerciseDetail', {
                    exercise: ex,
                  })
                }>
                <View style={s.itemTextWrap}>
                  <Text style={s.itemRow}>
                    {ex.name} - {ex.sets} sets x {ex.reps ? `${ex.reps} reps` : `${ex.duration}s`} ({formatMuscleLabel(ex.muscle)})
                  </Text>
                  {canOpenDetail ? (
                    <Text style={s.itemHint}>Tap to view exercise details</Text>
                  ) : null}
                </View>
                {canOpenDetail ? (
                  <Icon name="chevron-forward" size={16} color="#FF6B35" />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function DietItems({items, navigation}: {items: any[]; navigation: any}) {
  const byDay: Record<string, any[]> = {};
  (items || []).forEach((item: any) => {
    if (!byDay[item.day]) byDay[item.day] = [];
    byDay[item.day].push(item);
  });
  return (
    <View style={s.itemsBox}>
      <Text style={s.itemsTitle}>🍽️ Generated Plan</Text>
      {Object.entries(byDay).map(([day, meals]) => (
        <View key={day} style={s.dayBlock}>
          <Text style={s.dayLabel}>{day}</Text>
          {meals.map((m: any, i: number) => {
            const canOpenDetail = !!m.recipe_id;
            return (
              <TouchableOpacity
                key={i}
                style={[s.itemButton, !canOpenDetail && s.itemButtonDisabled]}
                disabled={!canOpenDetail}
                onPress={() =>
                  navigation.navigate('RecipeDetail', {
                    recipeId: m.recipe_id,
                    recipe: {
                      ...m,
                      id: m.recipe_id,
                    },
                  })
                }>
                <View style={s.itemTextWrap}>
                  <Text style={s.itemRow}>
                    {m.meal_type.replace(/_/g, ' ')}: {m.title}
                  </Text>
                  <Text style={s.itemMeta}>{Math.round(m.calories)} cal</Text>
                  {canOpenDetail ? (
                    <Text style={s.itemHint}>Tap to view recipe details</Text>
                  ) : null}
                </View>
                {canOpenDetail ? (
                  <Icon name="chevron-forward" size={16} color="#FF6B35" />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default function AIRecommendationValidationScreen({navigation}: any) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'verified' | 'denied'>('verified');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'draft' | 'verified' | 'denied'>('draft');
  const [typeFilter, setTypeFilter] = useState<'all' | 'workout' | 'diet'>('all');

  const fetchPlans = useCallback(async () => {
    try {
      const res = await apiClient.get('/validation/pending');
      const workouts = (res.data.workouts || []).map((p: any) => ({...p, planType: 'workout'}));
      const diets = (res.data.diets || []).map((p: any) => ({...p, planType: 'diet'}));
      const all = [...workouts, ...diets].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPlans(all);
    } catch {
      Alert.alert('Error', 'Failed to load plans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const openModal = (plan: any, action: 'verified' | 'denied') => {
    setSelectedPlan(plan);
    setModalAction(action);
    setNote('');
    setShowModal(true);
  };

  const submitAction = async () => {
    if (modalAction === 'denied' && !note.trim()) {
      Alert.alert('Required', 'Please provide a reason for denial.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(`/validation/${selectedPlan.id}`, {action: modalAction, note, planType: selectedPlan.planType});
      setPlans(prev => prev.map(p => p.id === selectedPlan.id ? {...p, status: modalAction, validation_note: note} : p));
      setShowModal(false);
      Alert.alert('Done', modalAction === 'verified' ? 'Plan approved.' : 'Plan denied.');
    } catch {
      Alert.alert('Error', 'Failed to submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = plans.filter(p => {
    const statusOk = filter === 'all' || p.status === filter;
    const typeOk = typeFilter === 'all' || p.planType === typeFilter;
    return statusOk && typeOk;
  });

  if (loading) return <ActivityIndicator style={{flex: 1}} size="large" color="#FF6B35" />;

  return (
    <View style={styles.container}>
      {/* Status filter */}
      <View style={styles.filterContainer}>
        {(['all', 'draft', 'verified', 'denied'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.filterButton, filter === f && styles.filterButtonActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'draft' ? 'Pending' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type filter */}
      <View style={styles.typeFilterContainer}>
        {([['all', 'apps', 'All'], ['workout', 'barbell', 'Workout'], ['diet', 'restaurant', 'Diet']] as const).map(([val, icon, label]) => (
          <TouchableOpacity key={val} style={[styles.typeFilterButton, typeFilter === val && styles.typeFilterButtonActive]} onPress={() => setTypeFilter(val)}>
            <Icon name={icon} size={16} color={typeFilter === val ? '#fff' : '#FF6B35'} />
            <Text style={[styles.typeFilterText, typeFilter === val && styles.typeFilterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => `${item.planType}-${item.id}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPlans(); }} colors={['#FF6B35']} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="document-text-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No plans found</Text>
          </View>
        }
        renderItem={({item}) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <View style={styles.typeTag}>
                  <Icon name={item.planType === 'workout' ? 'barbell' : 'restaurant'} size={14} color="#FF6B35" />
                  <Text style={styles.typeTagText}>{item.planType === 'workout' ? 'Workout Plan' : 'Diet Plan'}</Text>
                </View>
                <Text style={styles.userName}>{item.user?.name ?? `User #${item.user_id}`}</Text>
                <Text style={styles.planName}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={[styles.statusBadge, {backgroundColor: STATUS_COLOR[item.status] ?? '#999'}]}>
                <Text style={styles.statusText}>{item.status === 'draft' ? 'PENDING' : item.status.toUpperCase()}</Text>
              </View>
            </View>

            <SurveySection label={item.planType === 'workout' ? 'Workout' : 'Diet'} survey={item.survey_input} user={item.user} />

            {item.planType === 'workout'
              ? <WorkoutItems items={item.items} navigation={navigation} />
              : <DietItems items={item.items} navigation={navigation} />
            }

            {item.validation_note ? (
              <View style={s.noteBox}>
                <Text style={s.noteLabel}>Admin Note:</Text>
                <Text style={s.noteText}>{item.validation_note}</Text>
              </View>
            ) : null}

            {item.status === 'draft' && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.approveButton} onPress={() => openModal(item, 'verified')}>
                  <Icon name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.denyButton} onPress={() => openModal(item, 'denied')}>
                  <Icon name="close-circle" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Deny</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalAction === 'verified' ? 'Approve Plan' : 'Deny Plan'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>{modalAction === 'denied' ? 'Reason for denial (required):' : 'Optional note for user:'}</Text>
            <TextInput
              style={styles.textArea}
              placeholder={modalAction === 'denied' ? 'Explain why this plan was denied...' : 'Add a note (optional)...'}
              placeholderTextColor="#999"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalAction === 'verified' ? styles.approveButton : styles.denyButton, submitting && {opacity: 0.6}]}
                onPress={submitAction}
                disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.submitButtonText}>{modalAction === 'verified' ? 'Approve' : 'Deny'}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = {
  surveyBox: {backgroundColor: '#FFF8F5', borderRadius: 10, padding: 12, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#FF6B35'},
  surveyTitle: {fontSize: 13, fontWeight: '700' as const, color: '#FF6B35', marginBottom: 8},
  surveyRow: {flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginBottom: 4},
  surveyKey: {fontSize: 12, color: '#666', flex: 1},
  surveyValue: {fontSize: 12, fontWeight: '600' as const, color: '#333', flex: 2, textAlign: 'right' as const},
  itemsBox: {backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginBottom: 10},
  itemsTitle: {fontSize: 13, fontWeight: '700' as const, color: '#333', marginBottom: 8},
  dayBlock: {marginBottom: 8},
  dayLabel: {fontSize: 12, fontWeight: '700' as const, color: '#FF6B35', marginBottom: 3},
  itemRow: {fontSize: 12, color: '#444', marginBottom: 2, paddingLeft: 4},
  itemButton: {flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6},
  itemButtonDisabled: {opacity: 0.7},
  itemTextWrap: {flex: 1, marginRight: 8},
  itemMeta: {fontSize: 11, color: '#666', paddingLeft: 4},
  itemHint: {fontSize: 11, fontWeight: '600' as const, color: '#FF6B35', paddingLeft: 4, marginTop: 2},
  noteBox: {backgroundColor: '#FFF3CD', borderRadius: 8, padding: 10, marginBottom: 10},
  noteLabel: {fontSize: 12, fontWeight: '700' as const, color: '#856404', marginBottom: 3},
  noteText: {fontSize: 12, color: '#533F03'},
};
