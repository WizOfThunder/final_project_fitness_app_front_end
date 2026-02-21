import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function ValidationLogScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Validation Log Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'},
  text: {fontSize: 24, fontWeight: '600'},
});
