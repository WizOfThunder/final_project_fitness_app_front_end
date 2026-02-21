import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, Text, StyleSheet} from 'react-native';
import ProfileScreen from './ProfileScreen';

const Tab = createBottomTabNavigator();

function HomeTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home</Text>
    </View>
  );
}

function WorkoutTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Workout</Text>
    </View>
  );
}

function ProgressTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Progress</Text>
    </View>
  );
}

function NutritionTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Nutrition</Text>
    </View>
  );
}

export default function MainScreen() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeTab} />
      <Tab.Screen name="Workout" component={WorkoutTab} />
      <Tab.Screen name="Progress" component={ProgressTab} />
      <Tab.Screen name="Nutrition" component={NutritionTab} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: '600',
  },
});
