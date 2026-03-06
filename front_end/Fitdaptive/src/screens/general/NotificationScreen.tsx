import React from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';

const NOTIFICATIONS = [
  {id: '1', title: 'Challenge Started', message: 'New 30-day challenge is live!', time: '2h ago'},
  {id: '2', title: 'AI Plan Ready', message: 'Your workout plan has been validated', time: '5h ago'},
  {id: '3', title: 'Achievement Unlocked', message: 'You earned a new badge!', time: '1d ago'},
];

export default function NotificationScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={NOTIFICATIONS}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.item}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  item: {padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee'},
  title: {fontSize: 16, fontWeight: '600', marginBottom: 4},
  message: {fontSize: 14, color: '#666', marginBottom: 4},
  time: {fontSize: 12, color: '#999'},
});
