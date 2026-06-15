import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {apiClient} from '../../../services/api';
import {formatMuscleLabel} from '../../../utils/formatMuscleLabel';
import {styles} from './styles';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const formatSessionDate = (value?: string) => {
  if (!value) {
    return null;
  }
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function CreateWorkoutPlanScreen({route, navigation}: any) {
  const {
    memberId,
    memberName,
    sessionId,
    sessionDay,
    sessionDate,
    sessionPlan,
  } = route.params || {};
  const isSessionPlan = !!sessionId && !!sessionDay;
  const planDays = isSessionPlan ? [sessionDay] : DAYS;

  const [exercises, setExercises] = useState<any[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDay, setPickerDay] = useState(sessionDay || 'Monday');
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const reopenPickerOnFocus = useRef(false);

  useEffect(() => {
    navigation.setOptions({
      title: memberName ? `Plan for ${memberName}` : 'Create Workout Plan',
    });
    setLoadingExercises(true);
    apiClient
      .get('/exercises')
      .then(res => setExercises(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingExercises(false));
  }, [memberName, navigation]);

  useEffect(() => {
    if (sessionDay) {
      setPickerDay(sessionDay);
    }
  }, [sessionDay]);

  useFocusEffect(
    React.useCallback(() => {
      if (reopenPickerOnFocus.current) {
        reopenPickerOnFocus.current = false;
        setShowPicker(true);
      }
    }, []),
  );

  useEffect(() => {
    if (sessionPlan?.items?.length) {
      setItems(
        sessionPlan.items.map((item: any) => ({
          day: item.day,
          exercise_id: item.exercise_id,
          exercise_name: item.name,
          muscle: item.muscle,
          sets: item.sets != null ? String(item.sets) : '',
          reps: item.reps != null ? String(item.reps) : '',
          duration: item.duration != null ? String(item.duration) : '',
        })),
      );
      return;
    }

    setItems([]);
  }, [sessionId, sessionPlan]);

  const openPicker = (day: string) => {
    setPickerDay(day);
    setExerciseSearch('');
    setShowPicker(true);
  };

  const addExercise = (ex: any) => {
    setItems(prev => [
      ...prev,
      {
        day: pickerDay,
        exercise_id: ex.id,
        exercise_name: ex.name,
        muscle: ex.muscle,
        sets: '3',
        reps: '12',
        duration: '',
      },
    ]);
    setShowPicker(false);
  };

  const removeItem = (idx: number) =>
    setItems(prev => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: string, value: string) =>
    setItems(prev =>
      prev.map((item, i) => (i === idx ? {...item, [field]: value} : item)),
    );

  const openExerciseDetail = (exercise: any) => {
    if (showPicker) {
      reopenPickerOnFocus.current = true;
      setShowPicker(false);
      setTimeout(() => {
        navigation.navigate('ExerciseDetail', {exercise});
      }, 200);
      return;
    }

    navigation.navigate('ExerciseDetail', {exercise});
  };

  const handleSave = async () => {
    if (!memberId) {
      return Alert.alert('Error', 'No member selected.');
    }
    if (items.length === 0) {
      return Alert.alert('Error', 'Add at least one exercise.');
    }
    setSaving(true);
    try {
      await apiClient.post('/workout/trainer/assign', {
        member_id: memberId,
        ...(isSessionPlan ? {session_id: sessionId} : {}),
        items: items.map(item => ({
          ...(isSessionPlan ? {} : {day: item.day}),
          exercise_id: item.exercise_id,
          sets: item.sets ? Number(item.sets) : null,
          reps: item.reps ? Number(item.reps) : null,
          duration: item.duration ? Number(item.duration) : null,
        })),
      });
      Alert.alert(
        'Success',
        `Workout plan assigned to ${memberName || 'the member'}.`,
        [{text: 'OK', onPress: () => navigation.goBack()}],
      );
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.error || 'Failed to assign plan.',
      );
    } finally {
      setSaving(false);
    }
  };

  const filtered = exercises.filter(
    ex =>
      ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      (ex.muscle || '').toLowerCase().includes(exerciseSearch.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{padding: 16, paddingBottom: 100}}>
        {isSessionPlan && (
          <View style={styles.sessionContextCard}>
            <View style={styles.sessionContextHeader}>
              <Icon name="calendar-outline" size={18} color="#007AFF" />
              <Text style={styles.sessionContextTitle}>Session-based plan</Text>
            </View>
            <Text style={styles.sessionContextText}>
              Exercises added here will be assigned to {sessionDay}{' '}
              automatically.
            </Text>
            {!!sessionDate && (
              <Text style={styles.sessionContextDate}>
                Linked session: {sessionDay} • {formatSessionDate(sessionDate)}
              </Text>
            )}
            {!!sessionPlan?.items?.length && (
              <Text style={styles.sessionContextMeta}>
                Existing plan loaded: {sessionPlan.items.length} exercise
                {sessionPlan.items.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        )}

        {planDays.map(day => {
          const dayItems = items
            .map((item, idx) => ({...item, idx}))
            .filter(i => i.day === day);
          return (
            <View key={day} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {isSessionPlan ? `${day} Session Plan` : day}
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => openPicker(day)}>
                  <Icon name="add-circle" size={20} color="#FF6B35" />
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {dayItems.length === 0 && (
                <Text style={styles.emptySubtext}>
                  {isSessionPlan ? 'No exercises added yet' : 'Rest day'}
                </Text>
              )}

              {dayItems.map(item => (
                <View key={item.idx} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <TouchableOpacity
                      style={styles.exerciseInfoButton}
                      onPress={() => openExerciseDetail(item)}>
                      <View style={styles.exerciseInfoContent}>
                        <Text style={styles.exerciseNumber}>
                          {item.exercise_name}
                        </Text>
                        {!!item.muscle && (
                          <Text style={styles.smallLabel}>{formatMuscleLabel(item.muscle)}</Text>
                        )}
                        <Text style={styles.viewDetailsText}>
                          Tap to view details
                        </Text>
                      </View>
                      <Icon name="chevron-forward" size={18} color="#bbb" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteExerciseButton}
                      onPress={() => removeItem(item.idx)}>
                      <Icon name="trash" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.row}>
                    <View style={styles.halfInput}>
                      <Text style={styles.smallLabel}>Sets</Text>
                      <TextInput
                        style={styles.input}
                        value={item.sets}
                        onChangeText={v => updateItem(item.idx, 'sets', v)}
                        keyboardType="numeric"
                        placeholder="3"
                        placeholderTextColor="#aaa"
                      />
                    </View>
                    <View style={styles.halfInput}>
                      <Text style={styles.smallLabel}>Reps</Text>
                      <TextInput
                        style={styles.input}
                        value={item.reps}
                        onChangeText={v => updateItem(item.idx, 'reps', v)}
                        keyboardType="numeric"
                        placeholder="12"
                        placeholderTextColor="#aaa"
                      />
                    </View>
                    <View style={styles.halfInput}>
                      <Text style={styles.smallLabel}>Duration (s)</Text>
                      <TextInput
                        style={styles.input}
                        value={item.duration}
                        onChangeText={v => updateItem(item.idx, 'duration', v)}
                        keyboardType="numeric"
                        placeholder="—"
                        placeholderTextColor="#aaa"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.createButton,
            (saving || items.length === 0) && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving || items.length === 0}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>
              {isSessionPlan
                ? 'Assign Plan for This Session'
                : memberName
                ? `Assign Plan to ${memberName}`
                : 'Assign Plan'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showPicker}
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}>
        <View style={{flex: 1, backgroundColor: '#fff'}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#eee',
              gap: 12,
            }}>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={{fontSize: 17, fontWeight: '700', flex: 1}}>
              Add Exercise — {pickerDay}
            </Text>
          </View>
          <View style={{padding: 12}}>
            <TextInput
              style={[styles.input, {marginBottom: 0}]}
              value={exerciseSearch}
              onChangeText={setExerciseSearch}
              placeholder="Search by name or muscle..."
              placeholderTextColor="#aaa"
            />
          </View>
          {loadingExercises ? (
            <ActivityIndicator style={{flex: 1}} size="large" color="#FF6B35" />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => String(item.id)}
              contentContainerStyle={{padding: 12}}
              renderItem={({item}) => (
                <View style={styles.pickerItem}>
                  <TouchableOpacity
                    style={styles.pickerInfoArea}
                    onPress={() => openExerciseDetail(item)}>
                    <Text style={styles.pickerItemTitle}>{item.name}</Text>
                    {!!item.muscle && (
                      <Text style={styles.pickerItemMeta}>
                        {formatMuscleLabel(item.muscle)} · {item.difficulty}
                      </Text>
                    )}
                    <Text style={styles.pickerHint}>Tap to view details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pickerAddButton}
                    onPress={() => addExercise(item)}>
                    <Icon name="add-circle" size={22} color="#FF6B35" />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
