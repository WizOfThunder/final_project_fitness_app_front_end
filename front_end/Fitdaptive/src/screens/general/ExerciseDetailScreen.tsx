import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';

export default function ExerciseDetailScreen({route}: any) {
  const {exercise} = route.params;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{exercise.name}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Type:</Text>
        <Text style={styles.value}>{exercise.type}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Difficulty:</Text>
        <Text style={styles.value}>{exercise.difficulty}</Text>
      </View>
      <Text style={styles.sectionTitle}>Description</Text>
      <Text style={styles.description}>This is a placeholder description for {exercise.name}.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 20},
  title: {fontSize: 28, fontWeight: 'bold', marginBottom: 20},
  row: {flexDirection: 'row', marginBottom: 10},
  label: {fontSize: 16, fontWeight: '600', width: 100},
  value: {fontSize: 16, color: '#666'},
  sectionTitle: {fontSize: 20, fontWeight: '600', marginTop: 20, marginBottom: 10},
  description: {fontSize: 16, lineHeight: 24, color: '#333'},
});
