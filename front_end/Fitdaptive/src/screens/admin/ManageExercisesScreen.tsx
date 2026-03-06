import React from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';

const EXERCISES = [
  {id: '1', name: 'Push-ups', category: 'Strength', synced: true},
  {id: '2', name: 'Squats', category: 'Strength', synced: true},
  {id: '3', name: 'Burpees', category: 'Cardio', synced: false},
];

export default function ManageExercisesScreen() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.syncButton}>
        <Text style={styles.syncText}>Sync with API Ninjas</Text>
      </TouchableOpacity>
      <FlatList
        data={EXERCISES}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.item}>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.category}>{item.category}</Text>
            </View>
            <View style={[styles.badge, item.synced ? styles.synced : styles.notSynced]}>
              <Text style={styles.badgeText}>{item.synced ? 'Synced' : 'Not Synced'}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  syncButton: {backgroundColor: '#007AFF', padding: 15, margin: 15, borderRadius: 8},
  syncText: {color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600'},
  item: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee'},
  info: {flex: 1},
  name: {fontSize: 16, fontWeight: '600', marginBottom: 4},
  category: {fontSize: 14, color: '#666'},
  badge: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12},
  synced: {backgroundColor: '#E8F5E9'},
  notSynced: {backgroundColor: '#FFEBEE'},
  badgeText: {fontSize: 12, fontWeight: '600'},
});
