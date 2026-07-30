import "./global.css";
import { StatusBar } from 'expo-status-bar';
import { useEffect } from "react";
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { initDatabase } from './src/db/database';
import AppNavigator from './src/navigation/AppNavigator';
import { GoalsProvider } from './src/context/GoalsContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthScreen from './src/screens/AuthScreen';

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#FF5A36" />
      </View>
    );
  }

  return user ? <AppNavigator /> : <AuthScreen />;
}

export default function App() {
  // Database is initialized automatically in src/db/database.ts

  return (
    <NavigationContainer>
      <AuthProvider>
        <GoalsProvider>
          <RootNavigator />
        </GoalsProvider>
      </AuthProvider>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}