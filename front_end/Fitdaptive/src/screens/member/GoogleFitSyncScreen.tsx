import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function GoogleFitSyncScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Google Fit Sync Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'},
  text: {fontSize: 24, fontWeight: '600'},
});
