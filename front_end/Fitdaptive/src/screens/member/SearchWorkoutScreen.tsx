import React, {useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput} from 'react-native';

const EXERCISES = [
  {id: '1', name: 'Push-ups', type: 'Strength', difficulty: 'Beginner'},
  {id: '2', name: 'Squats', type: 'Strength', difficulty: 'Beginner'},
  {id: '3', name: 'Plank', type: 'Core', difficulty: 'Intermediate'},
  {id: '4', name: 'Burpees', type: 'Cardio', difficulty: 'Advanced'},
  {id: '5', name: 'Lunges', type: 'Strength', difficulty: 'Beginner'},
  {id: '6', name: 'Mountain Climbers', type: 'Cardio', difficulty: 'Intermediate'},
];

export default function SearchWorkoutScreen({navigation}: any) {
  const [search, setSearch] = useState('');
  const filtered = EXERCISES.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search exercises..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('ExerciseDetail', {exercise: item})}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.detail}>{item.type} • {item.difficulty}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 15},
  search: {borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 15},
  item: {padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee'},
  name: {fontSize: 18, fontWeight: '600', marginBottom: 4},
  detail: {fontSize: 14, color: '#666'},
});
