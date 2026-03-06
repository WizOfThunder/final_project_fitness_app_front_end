import React from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';

const STATS = [
  {id: '1', label: 'Total Users', value: '1,234'},
  {id: '2', label: 'Active Members', value: '987'},
  {id: '3', label: 'Trainers', value: '45'},
  {id: '4', label: 'Pending Validations', value: '23'},
];

export default function AdminDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <FlatList
        data={STATS}
        numColumns={2}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.card}>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 20},
  title: {fontSize: 28, fontWeight: 'bold', marginBottom: 20},
  card: {flex: 1, backgroundColor: '#f5f5f5', padding: 20, margin: 5, borderRadius: 8, alignItems: 'center'},
  value: {fontSize: 32, fontWeight: 'bold', color: '#007AFF', marginBottom: 5},
  label: {fontSize: 14, color: '#666', textAlign: 'center'},
});
