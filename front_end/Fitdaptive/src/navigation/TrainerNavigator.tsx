import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import NotificationBell from '../components/NotificationBell';

// Trainer Screens
import TrainerDashboard from '../screens/trainer/TrainerDashboard';
import CreateWorkoutPlanScreen from '../screens/trainer/CreateWorkoutPlanScreen';
import ManageWorkoutPlanScreen from '../screens/trainer/ManageWorkoutPlanScreen';
import MemberMonitoringScreen from '../screens/trainer/MemberMonitoringScreen';
import TrainerContentManagementScreen from '../screens/trainer/TrainerContentManagementScreen';
import ManagePostsScreen from '../screens/trainer/ManagePostsScreen';
import CreateChallengeScreen from '../screens/admin/CreateChallengeScreen';
import ManageChallengeScreen from '../screens/admin/ManageChallengeScreen';
import TrainerHireManagementScreen from '../screens/trainer/TrainerHireManagementScreen';
import PostAnnouncementsScreen from '../screens/trainer/PostAnnouncementsScreen';
import TrainerSessionScreen from '../screens/trainer/SessionScreen';

// Member Screens (Trainers have access to all member features)
import AchievementScreen from '../screens/member/AchievementScreen';
import AIDietPlanScreen from '../screens/member/AIDietPlanScreen';
import AIWorkoutPlanScreen from '../screens/member/AIWorkoutPlanScreen';
import ChallengeDetailScreen from '../screens/member/ChallengeDetailScreen';
import ChallengeListScreen from '../screens/member/ChallengeListScreen';
import DietPlanCalendarScreen from '../screens/member/DietPlanCalendarScreen';
import FitnessSurveyScreen from '../screens/member/FitnessSurveyScreen';
import DietSurveyScreen from '../screens/member/DietSurveyScreen';
import GoogleFitSyncScreen from '../screens/member/GoogleFitSyncScreen';
import ProgressAnalyticsScreen from '../screens/member/ProgressAnalyticsScreen';
import RankingScreen from '../screens/member/RankingScreen';
import SearchWorkoutScreen from '../screens/member/SearchWorkoutScreen';
import SearchRecipeScreen from '../screens/member/SearchRecipeScreen';
import TrainerDetailScreen from '../screens/member/TrainerDetailScreen';
import TrainerListScreen from '../screens/member/TrainerListScreen';
import TrainerOfferScreen from '../screens/member/TrainerOfferScreen';
import RateTrainerScreen from '../screens/member/RateTrainerScreen';
import MemberAnnouncementsScreen from '../screens/member/MemberAnnouncementsScreen';
import MemberSessionScreen from '../screens/member/SessionScreen';
import WorkoutHistoryScreen from '../screens/member/WorkoutHistoryScreen';
import WorkoutPlanCalendarScreen from '../screens/member/WorkoutPlanCalendarScreen';
import UnifiedCalendarScreen from '../screens/member/UnifiedCalendarScreen';

// General Screens
import ChangePasswordScreen from '../screens/general/ChangePasswordScreen';
import ChatScreen from '../screens/general/ChatScreen';
import EditProfileScreen from '../screens/general/EditProfileScreen';
import ExerciseDetailScreen from '../screens/general/ExerciseDetailScreen';
import NotificationScreen from '../screens/general/NotificationScreen';
import ProfileViewScreen from '../screens/general/ProfileViewScreen';
import RecipeDetailScreen from '../screens/general/RecipeDetailScreen';
import VideoDetailScreen from '../screens/general/VideoDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ROOT_SCREENS: Record<string, string> = {
  Main: 'TrainerDashboard',
  Workouts: 'UnifiedCalendar',
  Trainers: 'TrainerList',
  Leaderboard: 'Ranking',
  Profile: 'ProfileView',
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
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={{marginRight: 15}}>
          <Icon name="settings-outline" size={24} color="#FF6B35" />
        </TouchableOpacity>
      ),
    })}>
      <Stack.Screen name="TrainerDashboard" component={TrainerDashboard} options={{title: 'Trainer Dashboard'}} />
      <Stack.Screen name="MemberMonitoring" component={MemberMonitoringScreen} options={{title: 'Monitor Members'}} />
      <Stack.Screen name="TrainerHireManagement" component={TrainerHireManagementScreen} options={{title: 'My Clients'}} />
      <Stack.Screen name="PostAnnouncements" component={PostAnnouncementsScreen} options={{title: 'Announcements'}} />
      <Stack.Screen name="TrainerSessions" component={TrainerSessionScreen} options={{title: 'Sessions'}} />
      <Stack.Screen name="TrainerList" component={TrainerListScreen} options={{title: 'Find Trainers'}} />
      <Stack.Screen name="TrainerDetail" component={TrainerDetailScreen} options={{headerShown: false}} />
      <Stack.Screen name="TrainerOffers" component={TrainerOfferScreen} options={{title: 'My Subscriptions'}} />
      <Stack.Screen name="RateTrainer" component={RateTrainerScreen} options={{title: 'Rate Trainer'}} />
      <Stack.Screen name="CreateChallenge" component={CreateChallengeScreen} options={{title: 'Create Challenge'}} />
      <Stack.Screen name="ManageChallenge" component={ManageChallengeScreen} options={{title: 'Manage Challenges'}} />
      <Stack.Screen name="ManagePosts" component={ManagePostsScreen} options={{title: 'Manage Posts'}} />
      <Stack.Screen name="CreateWorkoutPlan" component={CreateWorkoutPlanScreen} options={{title: 'Create Workout Plan'}} />
      <Stack.Screen name="ManageWorkoutPlan" component={ManageWorkoutPlanScreen} options={{title: 'Manage Workout Plans'}} />
      <Stack.Screen name="TrainerContentManagement" component={TrainerContentManagementScreen} options={{title: 'Content Management'}} />
      <Stack.Screen name="FitnessSurvey" component={FitnessSurveyScreen} options={{title: 'Fitness Survey'}} />
      <Stack.Screen name="DietSurvey" component={DietSurveyScreen} options={{title: 'Diet Survey'}} />
      <Stack.Screen name="AIWorkoutPlan" component={AIWorkoutPlanScreen} options={{title: 'AI Workout Plan'}} />
      <Stack.Screen name="AIDietPlan" component={AIDietPlanScreen} options={{title: 'AI Diet Plan'}} />
      <Stack.Screen name="SearchWorkout" component={SearchWorkoutScreen} options={{title: 'Browse Exercises'}} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{title: 'Exercise Details'}} />
      <Stack.Screen name="SearchRecipe" component={SearchRecipeScreen} options={{title: 'Browse Recipes'}} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{title: 'Recipe Details'}} />
      <Stack.Screen name="ChallengeList" component={ChallengeListScreen} options={{title: 'Challenges'}} />
      <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} options={{title: 'Challenge Details'}} />
      <Stack.Screen name="Achievement" component={AchievementScreen} options={{title: 'Achievements'}} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{title: 'Chat'}} />
      <Stack.Screen name="Notification" component={NotificationScreen} options={{title: 'Notifications', headerLeft: () => null}} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{title: 'Settings', headerLeft: () => null}} />
    </Stack.Navigator>
  );
}

function WorkoutStack() {
  return (
    <Stack.Navigator screenOptions={({navigation}) => ({
      headerShown: true,
      headerLeft: () => <NotificationBell navigation={navigation} />,
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={{marginRight: 15}}>
          <Icon name="settings-outline" size={24} color="#FF6B35" />
        </TouchableOpacity>
      ),
    })}>
      <Stack.Screen name="UnifiedCalendar" component={UnifiedCalendarScreen} options={{title: 'My Schedule'}} />
      <Stack.Screen name="WorkoutPlanCalendar" component={WorkoutPlanCalendarScreen} options={{title: 'Workout Plan'}} />
      <Stack.Screen name="CreateWorkoutPlan" component={CreateWorkoutPlanScreen} options={{title: 'Create Workout Plan'}} />
      <Stack.Screen name="ManageWorkoutPlan" component={ManageWorkoutPlanScreen} options={{title: 'Manage Workout Plans'}} />
      <Stack.Screen name="AIWorkoutPlan" component={AIWorkoutPlanScreen} options={{title: 'AI Workout Plan'}} />
      <Stack.Screen name="SearchWorkout" component={SearchWorkoutScreen} options={{title: 'Search Exercises'}} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{title: 'Exercise Details'}} />
      <Stack.Screen name="VideoDetail" component={VideoDetailScreen} options={{title: 'Video'}} />
      <Stack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} options={{title: 'Workout History'}} />
      <Stack.Screen name="TrainerContentManagement" component={TrainerContentManagementScreen} options={{title: 'Content Management'}} />
      <Stack.Screen name="Notification" component={NotificationScreen} options={{title: 'Notifications', headerLeft: () => null}} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{title: 'Settings', headerLeft: () => null}} />
    </Stack.Navigator>
  );
}

function TrainerStack() {
  return (
    <Stack.Navigator screenOptions={({navigation}) => ({
      headerShown: true,
      headerLeft: () => <NotificationBell navigation={navigation} />,
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={{marginRight: 15}}>
          <Icon name="settings-outline" size={24} color="#FF6B35" />
        </TouchableOpacity>
      ),
    })}>
      <Stack.Screen name="TrainerList" component={TrainerListScreen} options={{title: 'Find Trainers'}} />
      <Stack.Screen name="TrainerDetail" component={TrainerDetailScreen} options={{headerShown: false}} />
      <Stack.Screen name="TrainerOffers" component={TrainerOfferScreen} options={{title: 'My Subscriptions'}} />
      <Stack.Screen name="RateTrainer" component={RateTrainerScreen} options={{title: 'Rate Trainer'}} />
      <Stack.Screen name="MemberAnnouncements" component={MemberAnnouncementsScreen} options={{title: 'Announcements'}} />
      <Stack.Screen name="MemberSessions" component={MemberSessionScreen} options={{title: 'Sessions'}} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{headerShown: true}} />
      <Stack.Screen name="Notification" component={NotificationScreen} options={{title: 'Notifications', headerLeft: () => null}} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{title: 'Settings', headerLeft: () => null}} />
    </Stack.Navigator>
  );
}

function LeaderboardStack() {
  return (
    <Stack.Navigator screenOptions={({navigation}) => ({
      headerShown: true,
      headerLeft: () => <NotificationBell navigation={navigation} />,
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={{marginRight: 15}}>
          <Icon name="settings-outline" size={24} color="#FF6B35" />
        </TouchableOpacity>
      ),
    })}>
      <Stack.Screen name="Ranking" component={RankingScreen} options={{title: 'Leaderboard'}} />
      <Stack.Screen name="ChallengeList" component={ChallengeListScreen} options={{title: 'Challenges'}} />
      <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} options={{title: 'Challenge Details'}} />
      <Stack.Screen name="Achievement" component={AchievementScreen} options={{title: 'Achievements'}} />
      <Stack.Screen name="Notification" component={NotificationScreen} options={{title: 'Notifications', headerLeft: () => null}} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{title: 'Settings', headerLeft: () => null}} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: true}}>
      <Stack.Screen name="ProfileView" component={ProfileViewScreen} options={{title: 'Profile'}} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{title: 'Edit Profile'}} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{title: 'Change Password'}} />
      <Stack.Screen name="ProgressAnalytics" component={ProgressAnalyticsScreen} options={{title: 'Progress'}} />
      <Stack.Screen name="Notification" component={NotificationScreen} options={{title: 'Notifications'}} />
      <Stack.Screen name="Ranking" component={RankingScreen} options={{title: 'Leaderboard'}} />
      <Stack.Screen name="WorkoutPlanCalendar" component={WorkoutPlanCalendarScreen} options={{title: 'Workout Schedule'}} />
      <Stack.Screen name="DietPlanCalendar" component={DietPlanCalendarScreen} options={{title: 'Diet Plan'}} />
      <Stack.Screen name="AIDietPlan" component={AIDietPlanScreen} options={{title: 'AI Diet Plan'}} />
    </Stack.Navigator>
  );
}

export default function TrainerNavigator() {
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
          tabBarIcon: ({color, size}) => <Icon name="home" size={26} color={color} />,
        }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutStack}
        options={{
          tabBarLabel: 'Schedule',
          tabBarIcon: ({color}) => <Icon name="calendar" size={26} color={color} />,
        }}
      />
      <Tab.Screen
        name="Trainers"
        component={TrainerStack}
        options={{
          tabBarIcon: ({color, size}) => <Icon name="people" size={26} color={color} />,
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardStack}
        options={{
          popToTopOnBlur: true,
          tabBarIcon: ({color, size}) => <Icon name="trophy" size={26} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({color, size}) => <Icon name="person" size={26} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
