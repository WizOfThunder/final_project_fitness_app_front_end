import React from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';

const RECOMMENDATIONS = [
  {id: '1', user: 'John Doe', type: 'Workout Plan', status: 'Pending'},
  {id: '2', user: 'Jane Smith', type: 'Diet Plan', status: 'Pending'},
  {id: '3', user: 'Mike Johnson', type: 'Workout Plan', status: 'Pending'},
];

export default function AIRecommendationValidationScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={RECOMMENDATIONS}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.item}>
            <View style={styles.info}>
              <Text style={styles.user}>{item.user}</Text>
              <Text style={styles.type}>{item.type}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.approveButton}>
                <Text style={styles.buttonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.denyButton}>
                <Text style={styles.buttonText}>Deny</Text>
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
  user: {fontSize: 18, fontWeight: '600', marginBottom: 4},
  type: {fontSize: 14, color: '#666'},
  actions: {flexDirection: 'row'},
  approveButton: {backgroundColor: '#34C759', padding: 10, borderRadius: 8, flex: 1, marginRight: 5},
  denyButton: {backgroundColor: '#FF3B30', padding: 10, borderRadius: 8, flex: 1, marginLeft: 5},
  buttonText: {color: '#fff', textAlign: 'center', fontWeight: '600'},
});
