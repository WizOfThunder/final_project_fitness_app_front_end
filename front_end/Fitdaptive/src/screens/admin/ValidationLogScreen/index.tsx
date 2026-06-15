import React from 'react';
import {View, Text, FlatList} from 'react-native';
import {styles} from './styles';

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
