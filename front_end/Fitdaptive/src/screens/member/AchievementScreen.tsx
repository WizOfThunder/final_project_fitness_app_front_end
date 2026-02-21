import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function AchievementScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Achievement Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'},
  text: {fontSize: 24, fontWeight: '600'},
});
