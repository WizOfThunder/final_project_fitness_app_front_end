import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import NotificationBell from '../components/NotificationBell';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import TransactionListScreen from '../screens/admin/TransactionListScreen';
import TransactionDetailScreen from '../screens/admin/TransactionDetailScreen';
import AIRecommendationValidationScreen from '../screens/admin/AIRecommendationValidationScreen';
import ValidationLogScreen from '../screens/admin/ValidationLogScreen';
import ManageContentScreen from '../screens/admin/ManageContentScreen';
import ManageChallengeScreen from '../screens/admin/ManageChallengeScreen';
import CreateChallengeScreen from '../screens/admin/CreateChallengeScreen';
import ManageAchievementRulesScreen from '../screens/admin/ManageAchievementRulesScreen';
import AdminTrainerPostsScreen from '../screens/admin/AdminTrainerPostsScreen';
import AdminDisputesScreen from '../screens/admin/AdminDisputesScreen';
import ChallengeDetailScreen from '../screens/member/ChallengeDetailScreen';

// General Screens
import ChangePasswordScreen from '../screens/general/ChangePasswordScreen';
import NotificationScreen from '../screens/general/NotificationScreen';
import ProfileViewScreen from '../screens/general/ProfileViewScreen';
import ExerciseDetailScreen from '../screens/general/ExerciseDetailScreen';
import RecipeDetailScreen from '../screens/general/RecipeDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ROOT_SCREENS: Record<string, string> = {
  Main: 'AdminDashboard',
  Content: 'ManageContent',
  Transactions: 'TransactionList',
  Validation: 'AIRecommendationValidation',
};

const resetNestedStackOnTabPress = ({navigation, route}: any) => ({
  tabPress: (e: any) => {
    const rootScreen = TAB_ROOT_SCREENS[route.name];
    const currentRoute = navigation
      .getState()
      .routes.find((stateRoute: any) => stateRoute.key === route.key);
    const nestedState = currentRoute?.state;
    const nestedIndex = nestedState?.index ?? 0;
    const activeRouteName = nestedState?.routes?.[nestedIndex]?.name;
    const firstRouteName = nestedState?.routes?.[0]?.name;

    if (
      rootScreen &&
      nestedState &&
      (activeRouteName !== rootScreen || firstRouteName !== rootScreen)
    ) {
      e.preventDefault();
      navigation.navigate(route.name, {
        screen: rootScreen,
        initial: false,
      });
    }
  },
});

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={({navigation}) => ({
      headerShown: true,
      headerLeft: () => <NotificationBell navigation={navigation} />,
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('ProfileView')} style={{marginRight: 15}}>
          <Icon name="settings-outline" size={24} color="#FF6B35" />
        </TouchableOpacity>
      ),
    })}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{title: 'Admin Dashboard'}} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{title: 'User Management'}} />
      <Stack.Screen name="TransactionList" component={TransactionListScreen} options={{title: 'Transactions'}} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{title: 'Transaction Details'}} />
      <Stack.Screen name="AIRecommendationValidation" component={AIRecommendationValidationScreen} options={{title: 'AI Validation'}} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{title: 'Exercise Details'}} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{title: 'Recipe Details'}} />
      <Stack.Screen name="ManageContent" component={ManageContentScreen} options={{title: 'Manage Content'}} />
      <Stack.Screen name="ManageChallenge" component={ManageChallengeScreen} options={{title: 'Manage Challenges'}} />
      <Stack.Screen name="CreateChallenge" component={CreateChallengeScreen} options={{title: 'Create Challenge'}} />
      <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} options={{title: 'Challenge Details'}} />
      <Stack.Screen name="ManageAchievementRules" component={ManageAchievementRulesScreen} options={{title: 'Manage Achievements'}} />
      <Stack.Screen name="AdminTrainerPosts" component={AdminTrainerPostsScreen} options={{title: 'Trainer Posts'}} />
      <Stack.Screen name="AdminDisputes" component={AdminDisputesScreen} options={{title: 'Hire Disputes'}} />
      <Stack.Screen name="Notification" component={NotificationScreen} options={{title: 'Notifications', headerLeft: () => null}} />
      <Stack.Screen name="ProfileView" component={ProfileViewScreen} options={{title: 'Profile', headerLeft: () => null}} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{title: 'Change Password'}} />
    </Stack.Navigator>
  );
}

function TransactionsStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: true}}>
      <Stack.Screen name="TransactionList" component={TransactionListScreen} options={{title: 'Transactions'}} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{title: 'Transaction Details'}} />
    </Stack.Navigator>
  );
}

function ContentStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: true}}>
      <Stack.Screen name="ManageContent" component={ManageContentScreen} options={{title: 'Manage Content'}} />
      <Stack.Screen name="ManageChallenge" component={ManageChallengeScreen} options={{title: 'Manage Challenges'}} />
      <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} options={{title: 'Challenge Details'}} />
      <Stack.Screen name="CreateChallenge" component={CreateChallengeScreen} options={{title: 'Create Challenge'}} />
      <Stack.Screen name="ManageAchievementRules" component={ManageAchievementRulesScreen} options={{title: 'Achievement Rules'}} />
      <Stack.Screen name="AdminTrainerPosts" component={AdminTrainerPostsScreen} options={{title: 'Trainer Posts'}} />
      <Stack.Screen name="AdminDisputes" component={AdminDisputesScreen} options={{title: 'Hire Disputes'}} />
      <Stack.Screen name="AIRecommendationValidation" component={AIRecommendationValidationScreen} options={{title: 'AI Validation'}} />
      <Stack.Screen name="ValidationLog" component={ValidationLogScreen} options={{title: 'Validation Logs'}} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{title: 'Exercise Details'}} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{title: 'Recipe Details'}} />
    </Stack.Navigator>
  );
}

function ValidationStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: true}}>
      <Stack.Screen name="AIRecommendationValidation" component={AIRecommendationValidationScreen} options={{title: 'AI Validation'}} />
      <Stack.Screen name="ValidationLog" component={ValidationLogScreen} options={{title: 'Validation Logs'}} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{title: 'Exercise Details'}} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{title: 'Recipe Details'}} />
    </Stack.Navigator>
  );
}

export default function AdminNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenListeners={resetNestedStackOnTabPress}
      screenOptions={{
        headerShown: false,
        popToTopOnBlur: true,
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: -2},
          shadowOpacity: 0.1,
          shadowRadius: 8,
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom + 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}>
      <Tab.Screen
        name="Main"
        component={DashboardStack}
        options={{
          tabBarIcon: ({color, size}) => <Icon name="speedometer" size={26} color={color} />,
        }}
      />
      <Tab.Screen
        name="Users"
        component={UserManagementScreen}
        options={{
          tabBarIcon: ({color, size}) => <Icon name="people" size={26} color={color} />,
          headerShown: true,
          title: 'User Management',
        }}
      />
      <Tab.Screen
        name="Content"
        component={ContentStack}
        options={{
          tabBarIcon: ({color, size}) => <Icon name="grid" size={26} color={color} />,
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsStack}
        options={{
          tabBarIcon: ({color, size}) => <Icon name="card" size={26} color={color} />,
        }}
      />
      <Tab.Screen
        name="Validation"
        component={ValidationStack}
        options={{
          tabBarIcon: ({color, size}) => <Icon name="checkmark-circle" size={26} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
