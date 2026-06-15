import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import AdminNavigator from './AdminNavigator';
import MemberNavigator from './MemberNavigator';
import TrainerNavigator from './TrainerNavigator';

const Stack = createNativeStackNavigator();

type RootNavigatorProps = {
  userRole: string | null;
};

export default function RootNavigator({userRole}: RootNavigatorProps) {
  if (!userRole) {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }

  if (userRole === 'admin') {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="AdminStack" component={AdminNavigator} />
      </Stack.Navigator>
    );
  }

  if (userRole === 'trainer') {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="TrainerStack" component={TrainerNavigator} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="MemberStack" component={MemberNavigator} />
    </Stack.Navigator>
  );
}
