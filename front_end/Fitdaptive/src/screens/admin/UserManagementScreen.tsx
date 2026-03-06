import React from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';

const USERS = [
  {id: '1', name: 'John Doe', email: 'john@test.com', role: 'Member', status: 'Active'},
  {id: '2', name: 'Jane Smith', email: 'jane@test.com', role: 'Trainer', status: 'Active'},
  {id: '3', name: 'Mike Johnson', email: 'mike@test.com', role: 'Member', status: 'Inactive'},
];

export default function UserManagementScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={USERS}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.item}>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <View style={styles.tags}>
                <Text style={styles.role}>{item.role}</Text>
                <Text style={[styles.status, item.status === 'Active' ? styles.active : styles.inactive]}>{item.status}</Text>
              </View>
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
  item: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee'},
  info: {flex: 1},
  name: {fontSize: 16, fontWeight: '600', marginBottom: 4},
  email: {fontSize: 14, color: '#666', marginBottom: 8},
  tags: {flexDirection: 'row'},
  role: {fontSize: 12, backgroundColor: '#E3F2FD', color: '#1976D2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 8},
  status: {fontSize: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4},
  active: {backgroundColor: '#E8F5E9', color: '#388E3C'},
  inactive: {backgroundColor: '#FFEBEE', color: '#D32F2F'},
  editButton: {backgroundColor: '#f0f0f0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8},
  editText: {fontSize: 14, fontWeight: '600'},
});
