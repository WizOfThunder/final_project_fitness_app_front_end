import React from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';

const LOGS = [
  {id: '1', user: 'John Doe', action: 'Approved', type: 'Workout Plan', date: '2024-01-15 10:30'},
  {id: '2', user: 'Jane Smith', action: 'Denied', type: 'Diet Plan', date: '2024-01-15 09:15'},
  {id: '3', user: 'Mike Johnson', action: 'Modified', type: 'Workout Plan', date: '2024-01-14 16:45'},
];

export default function ValidationLogScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={LOGS}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.item}>
            <View style={styles.header}>
              <Text style={styles.user}>{item.user}</Text>
              <Text style={[styles.action, item.action === 'Approved' && styles.approved, item.action === 'Denied' && styles.denied]}>
                {item.action}
              </Text>
            </View>
            <Text style={styles.type}>{item.type}</Text>
            <Text style={styles.date}>{item.date}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  item: {padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee'},
  header: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5},
  user: {fontSize: 16, fontWeight: '600'},
  action: {fontSize: 14, fontWeight: '600'},
  approved: {color: '#34C759'},
  denied: {color: '#FF3B30'},
  type: {fontSize: 14, color: '#666', marginBottom: 4},
  date: {fontSize: 12, color: '#999'},
});
