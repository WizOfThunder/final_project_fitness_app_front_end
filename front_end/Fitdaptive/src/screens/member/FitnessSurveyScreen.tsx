import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, TextInput, Alert} from 'react-native';

const QUESTIONS = [
  {
    id: 1,
    question: 'What is your fitness goal?',
    type: 'single',
    options: ['Lose Weight', 'Build Muscle', 'Improve Endurance', 'Stay Healthy'],
  },
  {
    id: 2,
    question: 'How many days per week can you workout?',
    type: 'single',
    options: ['1-2 days', '3-4 days', '5-6 days', 'Every day'],
  },
  {
    id: 3,
    question: 'What types of exercise do you prefer? (Select all that apply)',
    type: 'multiple',
    options: ['Cardio', 'Strength Training', 'Yoga', 'Sports'],
  },
  {
    id: 4,
    question: 'What is your current weight (kg)?',
    type: 'text',
  },
  {
    id: 5,
    question: 'Do you have any health conditions or injuries?',
    type: 'text',
  },
];

export default function FitnessSurveyScreen({navigation}: any) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<any>({});

  const question = QUESTIONS[current];
  const isLast = current === QUESTIONS.length - 1;

  const handleSingle = (option: string) => {
    setAnswers({...answers, [question.id]: option});
  };

  const handleMultiple = (option: string) => {
    const selected = answers[question.id] || [];
    const updated = selected.includes(option)
      ? selected.filter((o: string) => o !== option)
      : [...selected, option];
    setAnswers({...answers, [question.id]: updated});
  };

  const handleText = (text: string) => {
    setAnswers({...answers, [question.id]: text});
  };

  const handleNext = () => {
    if (current < QUESTIONS.length - 1) setCurrent(current + 1);
  };

  const handlePrev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const handleSubmit = () => {
    Alert.alert('Submit Survey', 'Are you sure you want to submit?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Submit',
        onPress: () => {
          alert('Survey submitted!');
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>Question {current + 1} of {QUESTIONS.length}</Text>
      <Text style={styles.question}>{question.question}</Text>

      {question.type === 'single' && (
        <View style={styles.options}>
          {question.options?.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.option, answers[question.id] === opt && styles.optionSelected]}
              onPress={() => handleSingle(opt)}>
              <Text style={[styles.optionText, answers[question.id] === opt && styles.optionTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {question.type === 'multiple' && (
        <View style={styles.options}>
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
        </View>
      )}

      {question.type === 'text' && (
        <TextInput
          style={styles.input}
          value={answers[question.id] || ''}
          onChangeText={handleText}
          placeholder="Type your answer..."
          multiline
        />
      )}

      <View style={styles.navigation}>
        <TouchableOpacity style={[styles.navButton, current === 0 && styles.navButtonDisabled]} onPress={handlePrev} disabled={current === 0}>
          <Text style={styles.navText}>← Previous</Text>
        </TouchableOpacity>
        {!isLast ? (
          <TouchableOpacity style={styles.navButton} onPress={handleNext}>
            <Text style={styles.navText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 20},
  progress: {fontSize: 14, color: '#999', marginBottom: 10},
  question: {fontSize: 22, fontWeight: 'bold', marginBottom: 30},
  options: {flex: 1},
  option: {padding: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 10},
  optionSelected: {backgroundColor: '#007AFF', borderColor: '#007AFF'},
  optionText: {fontSize: 16, color: '#333'},
  optionTextSelected: {color: '#fff', fontWeight: '600'},
  input: {flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, fontSize: 16, textAlignVertical: 'top'},
  navigation: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 20},
  navButton: {padding: 15, borderRadius: 8, backgroundColor: '#f0f0f0', flex: 1, marginHorizontal: 5},
  navButtonDisabled: {opacity: 0.3},
  navText: {textAlign: 'center', fontSize: 16, fontWeight: '600'},
  submitButton: {padding: 15, borderRadius: 8, backgroundColor: '#007AFF', flex: 1, marginHorizontal: 5},
  submitText: {textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#fff'},
});
