import React, {useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView} from 'react-native';

const ACHIEVEMENTS = [
  {id: '1', title: 'First Workout', description: 'Complete your first workout session', date: '2024-01-15'},
  {id: '2', title: '7 Day Streak', description: 'Workout for 7 consecutive days', date: '2024-01-20'},
  {id: '3', title: '100 Push-ups', description: 'Complete 100 push-ups in total', date: '2024-01-25'},
  {id: '4', title: '30 Day Challenge', description: 'Complete a 30-day challenge', date: '2024-02-01'},
  {id: '5', title: 'Early Bird', description: 'Workout before 7 AM', date: '2024-02-05'},
];

export default function AchievementScreen() {
  const [selected, setSelected] = useState(null);

  return (
    <View style={styles.container}>
      <FlatList
        data={ACHIEVEMENTS}
        numColumns={3}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.item} onPress={() => setSelected(item)}>
            <View style={styles.box} />
            <Text style={styles.title}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
      
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalBox} />
            <Text style={styles.modalTitle}>{selected?.title}</Text>
            <Text style={styles.modalDescription}>{selected?.description}</Text>
            <Text style={styles.modalDate}>Earned: {selected?.date}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelected(null)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 10},
  item: {flex: 1, alignItems: 'center', margin: 5},
  box: {width: 80, height: 80, backgroundColor: '#FFD700', borderRadius: 8, marginBottom: 8},
  title: {fontSize: 12, textAlign: 'center'},
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'},
  modalContent: {backgroundColor: '#fff', padding: 30, borderRadius: 12, width: '80%', alignItems: 'center'},
  modalBox: {width: 100, height: 100, backgroundColor: '#FFD700', borderRadius: 8, marginBottom: 20},
  modalTitle: {fontSize: 24, fontWeight: 'bold', marginBottom: 10},
  modalDescription: {fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 10},
  modalDate: {fontSize: 14, color: '#999', marginBottom: 20},
  closeButton: {backgroundColor: '#007AFF', padding: 12, borderRadius: 8, width: '100%'},
  closeText: {color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600'},
});
