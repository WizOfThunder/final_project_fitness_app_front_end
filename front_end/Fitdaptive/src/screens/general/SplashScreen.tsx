import React, {useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function SplashScreen({navigation}: any) {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace('Login');
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fitdaptive</Text>
      <Text style={styles.subtitle}>Your Adaptive Fitness Companion</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#007AFF'},
  title: {fontSize: 48, fontWeight: 'bold', color: '#fff', marginBottom: 10},
  subtitle: {fontSize: 16, color: '#fff', opacity: 0.9},
});
