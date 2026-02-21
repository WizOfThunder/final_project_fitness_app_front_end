import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function UserManagementScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>User Management Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'},
  text: {fontSize: 24, fontWeight: '600'},
});
