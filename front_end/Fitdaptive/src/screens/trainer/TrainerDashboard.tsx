import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function TrainerDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Trainer Dashboard</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'},
  text: {fontSize: 24, fontWeight: '600'},
});
