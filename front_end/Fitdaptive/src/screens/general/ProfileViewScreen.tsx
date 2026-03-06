import React from 'react';
import {View, Text, StyleSheet, ScrollView, Image} from 'react-native';

export default function ProfileViewScreen({route}: any) {
  const user = route?.params?.user || {name: 'John Doe', email: 'john@test.com', role: 'Member'};

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name[0]}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.role}>{user.role}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user.email}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  header: {alignItems: 'center', padding: 30, borderBottomWidth: 1, borderBottomColor: '#eee'},
  avatar: {width: 80, height: 80, borderRadius: 40, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginBottom: 15},
  avatarText: {fontSize: 32, color: '#fff', fontWeight: 'bold'},
  name: {fontSize: 24, fontWeight: 'bold', marginBottom: 5},
  role: {fontSize: 16, color: '#666'},
  section: {padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee'},
  label: {fontSize: 14, color: '#666', marginBottom: 5},
  value: {fontSize: 16, fontWeight: '500'},
});
