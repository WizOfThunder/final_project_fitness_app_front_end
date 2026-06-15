import React, {useState, useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, Modal} from 'react-native';
import {useAuth} from '../../../store/AuthContext';
import {apiClient} from '../../../services/api';
import {getCurrentPosition} from '../../../utils/geolocation';
import {styles} from './styles';

const RECIPE_CUISINES = [
  'Any',
  'African',
  'Asian',
  'American',
  'British',
  'Cajun',
  'Caribbean',
  'Chinese',
  'Eastern European',
  'European',
  'French',
  'German',
  'Greek',
  'Indian',
  'Irish',
  'Italian',
  'Japanese',
  'Jewish',
  'Korean',
  'Latin American',
  'Mediterranean',
  'Mexican',
  'Middle Eastern',
  'Nordic',
  'Southern',
  'Spanish',
  'Thai',
  'Vietnamese',
];

const DIET_PLAN_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function buildInitialAnswers(profileGoal: string | null) {
  return {
    ...(profileGoal ? {1: profileGoal} : {}),
    3: ['Any'],
    7: [...DIET_PLAN_DAYS],
  };
}

const QUESTIONS = [
  {
    id: 1,
    question: '🎯 What is your diet goal?',
    type: 'single',
    options: ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Eat Healthier', 'Other'],
    hasTextInput: true,
  },
  {
    id: 2,
    question: '🍽 Preferred diet type?',
    type: 'single',
    options: ['No preference', 'Vegetarian', 'Vegan', 'Keto', 'Other'],
    hasTextInput: true,
  },
  {
    id: 3,
    question: '🌍 Which cuisines do you want included?',
    type: 'multiple',
    options: RECIPE_CUISINES,
    exclusiveOptions: ['Any'],
    defaultExclusiveOption: 'Any',
  },
  {
    id: 4,
    question: '⚠️ Any food allergies?',
    type: 'multiple',
    options: ['None', 'Nuts', 'Dairy', 'Gluten', 'Other'],
    hasTextInput: true,
    exclusiveOptions: ['None'],
  },
  {
    id: 5,
    question: '🍽 How many meals per day?',
    type: 'single',
    options: ['2', '3', '4', '5'],
  },
  {
    id: 6,
    question: '⏱ Time available to prepare meals?',
    type: 'single',
    options: ['10 - 30 minutes', '30 minutes - 1 hour', '1 hour to 2 hours', 'No time limit'],
  },
  {
    id: 7,
    question: '📅 Which days do you want in your meal plan?',
    type: 'multiple',
    options: DIET_PLAN_DAYS,
    minSelections: 1,
    maxSelections: 7,
  },
  {
    id: 8,
    question: '🥕 What ingredients do you have right now? (Optional)',
    type: 'text',
    optional: true,
    placeholder:
      'Example: eggs, spinach, rice. Leave blank for broader recommendations.',
  },
  {
    id: 9,
    question: '🍳 What cooking tools do you have right now? (Optional)',
    type: 'text',
    optional: true,
    placeholder:
      'Example: stove, microwave, blender. Leave blank for broader recommendations.',
  },
  {
    id: 10,
    question: '📝 Any additional note for the AI? (Optional)',
    type: 'text',
    optional: true,
    placeholder:
      'Add any extra preferences or requests for your diet plan...',
  },
];

const POLL_INTERVAL_MS = 5000;

export default function DietSurveyScreen({navigation}: any) {
  const {user} = useAuth();
  const profileGoal = user?.goal || null;
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<any>(() =>
    buildInitialAnswers(profileGoal),
  );
  const [loading, setLoading] = useState(false);
  const [queueJob, setQueueJob] = useState<any>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollInFlightRef = useRef(false);

  useEffect(() => {
    setAnswers((prev: any) => {
      const next = {...prev};
      let changed = false;

      if (profileGoal && !next[1]) {
        next[1] = profileGoal;
        changed = true;
      }

      if (!Array.isArray(next[3]) || next[3].length === 0) {
        next[3] = ['Any'];
        changed = true;
      }

      if (!Array.isArray(next[7]) || next[7].length === 0) {
        next[7] = [...DIET_PLAN_DAYS];
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [profileGoal]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  const question = QUESTIONS[current];
  const isLast = current === QUESTIONS.length - 1;

  const handleSingle = (option: string) => {
    setAnswers({...answers, [question.id]: option});
  };

  const handleMultiple = (option: string) => {
    const selected = Array.isArray(answers[question.id]) ? answers[question.id] : [];
    const exclusiveOptions = question.exclusiveOptions || [];
    const defaultExclusiveOption = question.defaultExclusiveOption || null;
    const minSelections = question.minSelections || 0;
    const maxSelections = question.maxSelections || Number.POSITIVE_INFINITY;

    if (exclusiveOptions.includes(option)) {
      setAnswers({...answers, [question.id]: [option]});
      return;
    }
    const filtered = selected.filter(
      (o: string) => !exclusiveOptions.includes(o),
    );
    if (filtered.includes(option) && filtered.length <= minSelections) {
      Alert.alert(
        'Selection required',
        `Please keep at least ${minSelections} day${minSelections > 1 ? 's' : ''} selected.`,
      );
      return;
    }
    if (!filtered.includes(option) && filtered.length >= maxSelections) {
      Alert.alert('Limit reached', `You can choose up to ${maxSelections} days.`);
      return;
    }

    let updated = filtered.includes(option)
      ? filtered.filter((o: string) => o !== option)
      : [...filtered, option];

    if (updated.length === 0 && defaultExclusiveOption) {
      updated = [defaultExclusiveOption];
    }

    setAnswers({...answers, [question.id]: updated});
  };

  const handleOtherText = (text: string) => {
    setAnswers({...answers, [`${question.id}_other`]: text});
  };

  const handleText = (text: string) => {
    setAnswers({...answers, [question.id]: text});
  };

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
    Alert.alert('Success', 'Diet plan generated!', [
      {
        text: 'View Plan',
        onPress: () => navigation.navigate('AIDietPlan'),
      },
    ]);
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
        Alert.alert('Error', nextJob.error || 'Failed to generate diet plan.');
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

  const isAnswered = () => {
    if (question.optional) return true;
    const ans = answers[question.id];
    if (question.type === 'multiple') return Array.isArray(ans) && ans.length > 0;
    return ans !== undefined && String(ans).trim() !== '';
  };

  const handleNext = () => {
    if (!isAnswered()) {
      Alert.alert('Required', 'Please answer this question before continuing.');
      return;
    }
    if (current < QUESTIONS.length - 1) setCurrent(current + 1);
  };

  const handlePrev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const handleSubmit = () => {
    if (!isAnswered()) {
      Alert.alert('Required', 'Please answer this question before continuing.');
      return;
    }
    const surveyData = {
      goal: answers[1] === 'Other' ? answers['1_other'] : answers[1],
      dietType: answers[2] === 'Other' ? answers['2_other'] : answers[2],
      preferredCuisines: answers[3] || ['Any'],
      allergies: (answers[4] || []).filter((a: string) => a !== 'None'),
      allergiesOther: answers['4_other'],
      mealsPerDay: answers[5],
      prepTime: answers[6],
      planDays: answers[7] || [...DIET_PLAN_DAYS],
      availableIngredients: (answers[8] || '').trim(),
      availableTools: (answers[9] || '').trim(),
      flexibleMealPreference: '',
      flexibleMealDetails: '',
      additionalNote: (answers[10] || '').trim(),
    };

    Alert.alert('Submit Survey', 'Generate your AI diet plan?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Generate',
        onPress: async () => {
          setLoading(true);
          try {
            const coords = await new Promise<{latitude: number; longitude: number} | null>(resolve => {
              getCurrentPosition(
                (pos: any) => resolve({latitude: pos.coords.latitude, longitude: pos.coords.longitude}),
                () => resolve(null),
              );
            });
            const response = await apiClient.post('/ai/generate-diet', {
              ...surveyData,
              ...(coords ?? {}),
            });
            setQueueJob(response.data);
            await pollJobStatus(response.data.jobId);
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error || err.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const singleTextInputTriggers = question.textInputTriggerOptions || ['Other'];
  const showSingleTextInput =
    question.hasTextInput && singleTextInputTriggers.includes(answers[question.id]);
  const multipleTextInputTriggers = question.textInputTriggerOptions || ['Other'];
  const showMultipleTextInput =
    question.hasTextInput &&
    Array.isArray(answers[question.id]) &&
    multipleTextInputTriggers.some((opt: string) =>
      answers[question.id].includes(opt),
    );

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>Question {current + 1} of {QUESTIONS.length}</Text>
      <Text style={styles.question}>{question.question}</Text>

      {question.type === 'single' && (
        <ScrollView style={styles.options} keyboardShouldPersistTaps="handled">
          {question.id === 1 && profileGoal && (
            <TouchableOpacity
              key="__profile_goal__"
              style={[styles.option, styles.profileGoalOption, answers[question.id] === profileGoal && styles.optionSelected]}
              onPress={() => handleSingle(profileGoal)}>
              <View style={styles.profileGoalRow}>
                <Text style={[styles.optionText, answers[question.id] === profileGoal && styles.optionTextSelected]}>{profileGoal}</Text>
                <View style={[styles.profileBadge, answers[question.id] === profileGoal && styles.profileBadgeSelected]}>
                  <Text style={styles.profileBadgeText}>👤 My Goal</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          {question.options?.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.option, answers[question.id] === opt && styles.optionSelected]}
              onPress={() => handleSingle(opt)}>
              <Text style={[styles.optionText, answers[question.id] === opt && styles.optionTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          ))}
          {showSingleTextInput && (
            <TextInput
              style={styles.input}
              value={answers[`${question.id}_other`] || ''}
              onChangeText={handleOtherText}
              placeholder="Please specify..."
              placeholderTextColor="#aaa"
              color="#333"
            />
          )}
        </ScrollView>
      )}

      {question.type === 'multiple' && (
        <ScrollView style={styles.options} keyboardShouldPersistTaps="handled">
          {question.options?.map(opt => {
            const selected = (answers[question.id] || []).includes(opt);
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => handleMultiple(opt)}>
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
          {showMultipleTextInput && (
            <TextInput
              style={styles.input}
              value={answers[`${question.id}_other`] || ''}
              onChangeText={handleOtherText}
              placeholder="Please specify..."
              placeholderTextColor="#aaa"
              color="#333"
            />
          )}
        </ScrollView>
      )}

      {question.type === 'text' && (
        <TextInput
          style={[styles.input, {minHeight: 140}]}
          value={answers[question.id] || ''}
          onChangeText={handleText}
          placeholder={question.placeholder || 'Type your answer...'}
          placeholderTextColor="#aaa"
          color="#333"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      )}

      <View style={styles.navigation}>
        <TouchableOpacity style={[styles.navButton, current === 0 && styles.navButtonDisabled]} onPress={handlePrev} disabled={current === 0}>
          <Text style={[styles.navText, current === 0 && styles.navTextDisabled]}>← Previous</Text>
        </TouchableOpacity>
        {!isLast ? (
          <TouchableOpacity style={[styles.navButton, !isAnswered() && styles.navButtonDisabled]} onPress={handleNext} disabled={!isAnswered()}>
            <Text style={[styles.navText, !isAnswered() && styles.navTextDisabled]}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.submitButton, (!isAnswered() || loading || !!queueJob) && {opacity: 0.5}]} onPress={handleSubmit} disabled={!isAnswered() || loading || !!queueJob}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Generate Plan</Text>}
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={!!queueJob} transparent animationType="fade" onRequestClose={() => null}>
        <View style={styles.queueOverlay}>
          <View style={styles.queueCard}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.queueTitle}>
              {queueJob?.status === 'processing'
                ? 'Generating Your Diet Plan'
                : 'Queued for AI Generation'}
            </Text>
            <Text style={styles.queueText}>
              {queueJob?.status === 'processing'
                ? 'Your diet plan is being generated now.'
                : queueJob?.peopleAhead > 0
                  ? `${queueJob.peopleAhead} ${queueJob.peopleAhead === 1 ? 'person is' : 'people are'} queued before you.`
                  : 'No one is queued before you. Your request will start soon.'}
            </Text>
            <Text style={styles.queueSubtext}>
              Keep this screen open while we prepare your plan.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
