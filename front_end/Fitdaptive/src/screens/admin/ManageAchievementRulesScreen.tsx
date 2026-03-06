import React from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';

const RULES = [
  {id: '1', achievement: 'First Workout', condition: 'Complete 1 workout', points: 10},
  {id: '2', achievement: '7 Day Streak', condition: 'Workout 7 days in a row', points: 50},
  {id: '3', achievement: '100 Push-ups', condition: 'Complete 100 push-ups total', points: 30},
];

export default function ManageAchievementRulesScreen() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addText}>+ Add New Rule</Text>
      </TouchableOpacity>
      <FlatList
        data={RULES}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.item}>
            <View style={styles.info}>
              <Text style={styles.achievement}>{item.achievement}</Text>
              <Text style={styles.condition}>{item.condition}</Text>
              <Text style={styles.points}>{item.points} points</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  addButton: {backgroundColor: '#007AFF', padding: 15, margin: 15, borderRadius: 8},
  addText: {color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600'},
  item: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee'},
  info: {flex: 1},
  achievement: {fontSize: 16, fontWeight: '600', marginBottom: 4},
  condition: {fontSize: 14, color: '#666', marginBottom: 4},
  points: {fontSize: 14, color: '#007AFF', fontWeight: '600'},
  editButton: {backgroundColor: '#f0f0f0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8},
  editText: {fontSize: 14, fontWeight: '600'},
});
