import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';

export default function ChallengeDetailScreen({route}: any) {
  const challenge = route?.params?.challenge || {
    title: '30 Day Push-up Challenge',
    duration: '30 days',
    participants: 45,
    description: 'Complete push-ups every day for 30 days to build upper body strength.',
    target: '100 push-ups per day',
    progress: 15,
    total: 30,
  };

  const progressPercent = (challenge.progress / challenge.total) * 100;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{challenge.title}</Text>
      <Text style={styles.duration}>{challenge.duration} • {challenge.participants} participants</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{challenge.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Target</Text>
        <Text style={styles.target}>{challenge.target}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {width: `${progressPercent}%`}]} />
        </View>
        <Text style={styles.progressText}>{challenge.progress} / {challenge.total} days completed</Text>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Mark Today Complete</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 20},
  title: {fontSize: 28, fontWeight: 'bold', marginBottom: 8},
  duration: {fontSize: 16, color: '#666', marginBottom: 30},
  section: {marginBottom: 25},
  sectionTitle: {fontSize: 18, fontWeight: '600', marginBottom: 10},
  description: {fontSize: 16, lineHeight: 24, color: '#333'},
  target: {fontSize: 16, color: '#007AFF', fontWeight: '600'},
  progressBar: {height: 10, backgroundColor: '#E0E0E0', borderRadius: 5, overflow: 'hidden', marginBottom: 8},
  progressFill: {height: '100%', backgroundColor: '#34C759'},
  progressText: {fontSize: 14, color: '#666'},
  button: {backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginTop: 20},
  buttonText: {color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600'},
});
