import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import ActivityLogScreen from '../screens/ActivityLogScreen';
import StepsTrackerScreen from '../screens/StepsTrackerScreen';
import ProgressScreen from '../screens/ProgressScreen';
import GoalsScreen from '../screens/GoalsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'home',
  Activités: 'barbell',
  Pas: 'walk',
  Progrès: 'stats-chart',
  Objectifs: 'flag',
  Historique: 'time',
  Profil: 'person',
};

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF5A36',
        tabBarInactiveTintColor: '#8A8F98',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Activités" component={ActivityLogScreen} />
      <Tab.Screen name="Pas" component={StepsTrackerScreen} />
      <Tab.Screen name="Progrès" component={ProgressScreen} />
      <Tab.Screen name="Objectifs" component={GoalsScreen} />
      <Tab.Screen name="Historique" component={HistoryScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
