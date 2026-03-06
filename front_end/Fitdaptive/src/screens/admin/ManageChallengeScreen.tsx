import React from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';

const CHALLENGES = [
  {id: '1', title: '30 Day Push-up Challenge', status: 'Active', participants: 45},
  {id: '2', title: '7 Day Cardio Challenge', status: 'Active', participants: 32},
  {id: '3', title: 'January Weight Loss', status: 'Completed', participants: 78},
];

export default function ManageChallengeScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={CHALLENGES}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.item}>
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.participants}>{item.participants} participants</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  item: {padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee'},
  info: {marginBottom: 10},
  title: {fontSize: 18, fontWeight: '600', marginBottom: 4},
  participants: {fontSize: 14, color: '#666'},
  actions: {flexDirection: 'row'},
  editButton: {backgroundColor: '#007AFF', padding: 10, borderRadius: 8, flex: 1, marginRight: 5},
  closeButton: {backgroundColor: '#FF3B30', padding: 10, borderRadius: 8, flex: 1, marginLeft: 5},
  buttonText: {color: '#fff', textAlign: 'center', fontWeight: '600'},
});
