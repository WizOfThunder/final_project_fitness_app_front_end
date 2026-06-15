import React, {useState, useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, Modal} from 'react-native';
import {useAuth} from '../../../store/AuthContext';
import {apiClient} from '../../../services/api';
import {styles} from './styles';

const QUESTIONS = [
  {
    id: 1,
    question: '🎯 What is your fitness goal?',
    type: 'single',
    options: ['Weight Loss', 'Muscle Gain', 'Improve Endurance', 'Stay Active', 'Recovery', 'Other'],
    hasTextInput: true,
  },
  {
    id: 2,
    question: '💪 What is your fitness level?',
    type: 'single',
    options: ['Beginner', 'Intermediate', 'Advanced'],
  },
  {
    id: 3,
    question: '🏃 What is your prior training experience?',
    type: 'single',
    options: [
      'None',
      'Less than 3 months',
      '3 - 12 months',
      '1 - 3 years',
      '3+ years',
      'Used to train but stopped',
    ],
  },
  {
    id: 4,
    question: '🏋️ What equipment do you have?',
    type: 'multiple',
    options: ['None', 'Dumbbells', 'Resistance bands', 'Full gym', 'Other'],
    hasTextInput: true,
    exclusiveOptions: ['None'],
  },
  {
    id: 5,
    question: '📅 Which days do you want to work out?',
    type: 'multiple',
    options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  {
    id: 6,
    question: '⏱ How long per session?',
    type: 'single',
    options: ['15 min', '30 min', '45 min', '60 min'],
  },
  {
    id: 7,
    question: '⚠️ Any injuries or conditions?',
    type: 'multiple',
    options: ['None', 'Back pain', 'Knee issues', 'Other'],
    hasTextInput: true,
    exclusiveOptions: ['None'],
  },
  {
    id: 8,
    question:
      '💊 Any medication or substances that may affect training, recovery, appetite, heart rate, or hydration?',
    type: 'multiple',
    optional: true,
    options: [
      'No',
      'Weight-loss medication',
      'Hormonal / TRT / anabolic',
      'Stimulant medication',
      'Diabetes medication',
      'Blood pressure / heart medication',
      'Prefer not to say',
      'Other',
    ],
    hasTextInput: true,
    exclusiveOptions: ['No', 'Prefer not to say'],
  },
  {
    id: 9,
    question: '🎯 Which muscles do you want to focus on?',
    type: 'multiple',
    options: ['Full body', 'Upper body', 'Lower body', 'Core', 'Unsure'],
    exclusiveOptions: ['Full body', 'Unsure'],
  },
  {
    id: 10,
    question: '📝 Any additional note for the AI? (Optional)',
    type: 'text',
    optional: true,
    placeholder: 'Add any preferences, limitations, or requests for your workout plan...',
  },
];

const POLL_INTERVAL_MS = 5000;

export default function FitnessSurveyScreen({navigation}: any) {
  const {user} = useAuth();
  const profileGoal = user?.goal || null;
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<any>(profileGoal ? {1: profileGoal} : {});
  const [loading, setLoading] = useState(false);
  const [queueJob, setQueueJob] = useState<any>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollInFlightRef = useRef(false);

  useEffect(() => {
    setAnswers((prev: any) =>
      Object.keys(prev).length === 0 && profileGoal ? {1: profileGoal} : prev
    );
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

    if (exclusiveOptions.includes(option)) {
      setAnswers({...answers, [question.id]: [option]});
      return;
    }

    const filtered = selected.filter(
      (o: string) => !exclusiveOptions.includes(o),
    );
    const updated = filtered.includes(option)
      ? filtered.filter((o: string) => o !== option)
      : [...filtered, option];

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
    Alert.alert('Success', 'Workout plan generated!', [
      {
        text: 'View Plan',
        onPress: () => navigation.navigate('Workouts', {screen: 'AIWorkoutPlan'}),
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
        Alert.alert('Error', nextJob.error || 'Failed to generate workout plan.');
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
      fitnessLevel: answers[2],
      trainingExperience: answers[3],
      equipment: answers[4] || [],
      equipmentOther: answers['4_other'],
      days: answers[5] || [],
      duration: answers[6],
      healthConditions: answers[7] || [],
      healthConditionsOther: answers['7_other'],
      medicationFactors: answers[8] || [],
      medicationFactorsOther: answers['8_other'],
      focusAreas: answers[9] || [],
      additionalNote: (answers[10] || '').trim(),
    };

    Alert.alert('Submit Survey', 'Generate your AI workout plan?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Generate',
        onPress: async () => {
          setLoading(true);
          try {
            const response = await apiClient.post('/ai/generate-workout', surveyData);
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
                <View style={styles.profileBadge}>
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
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.queueTitle}>
              {queueJob?.status === 'processing'
                ? 'Generating Your Workout Plan'
                : 'Queued for AI Generation'}
            </Text>
            <Text style={styles.queueText}>
              {queueJob?.status === 'processing'
                ? 'Your workout plan is being generated now.'
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
