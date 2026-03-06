import React from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';

const CHALLENGES = [
  {id: '1', title: '30 Day Push-up Challenge', duration: '30 days', participants: 45, status: 'Active'},
  {id: '2', title: '7 Day Cardio Challenge', duration: '7 days', participants: 32, status: 'Active'},
  {id: '3', title: 'January Weight Loss', duration: '31 days', participants: 78, status: 'Completed'},
];

export default function ChallengeListScreen({navigation}: any) {
  return (
    <View style={styles.container}>
      <FlatList
        data={CHALLENGES}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('ChallengeDetail', {challenge: item})}>
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.duration}>{item.duration} • {item.participants} participants</Text>
            </View>
            <View style={[styles.badge, item.status === 'Active' ? styles.active : styles.completed]}>
              <Text style={styles.badgeText}>{item.status}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  item: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee'},
  info: {flex: 1},
  title: {fontSize: 18, fontWeight: '600', marginBottom: 4},
  duration: {fontSize: 14, color: '#666'},
  badge: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12},
  active: {backgroundColor: '#E8F5E9'},
  completed: {backgroundColor: '#E3F2FD'},
  badgeText: {fontSize: 12, fontWeight: '600'},
});
