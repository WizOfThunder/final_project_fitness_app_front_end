import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';

const ACHIEVEMENTS = [
  {id: '1', title: 'First Workout'},
  {id: '2', title: '7 Day Streak'},
  {id: '3', title: '100 Push-ups'},
];

export default function ProfileScreen({navigation}: any) {
  const handleLogout = () => {
    navigation.replace('Login');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>user@test.com</Text>
      </View>
      
      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.achievementRow}>
        {ACHIEVEMENTS.map(a => (
          <View key={a.id} style={styles.achievementItem}>
            <View style={styles.achievementBox} />
            <Text style={styles.achievementTitle}>{a.title}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Achievement')}>
        <Text style={styles.seeMore}>See More</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  infoContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 15,
  },
  achievementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  achievementItem: {
    alignItems: 'center',
    flex: 1,
  },
  achievementBox: {
    width: 80,
    height: 80,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  seeMore: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
  },
  logoutText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
