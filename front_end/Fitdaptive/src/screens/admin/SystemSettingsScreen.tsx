import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function SystemSettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>System Settings Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'},
  text: {fontSize: 24, fontWeight: '600'},
});
