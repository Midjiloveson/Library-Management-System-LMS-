import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer, NavigationProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { User } from 'firebase/auth';

import { subscribeToAuthState, signOut } from '../services/authService';
import IsbnScanScreen from '../modules/camera/IsbnScanScreen';
import ResultsScreen from '../modules/results/ResultsScreen';
import LoginScreen from '../screens/LoginScreen';
import LibraryScreen from '../screens/LibraryScreen';

export type RootStackParamList = {
  Login: undefined;
  IsbnScanScreen: undefined;
  ResultsScreen: { isbn: string };
  Library: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    // Always start logged out so the login screen shows on every app launch
    signOut().finally(() => {
      unsubscribe = subscribeToAuthState(u => {
        setUser(u);
        setChecking(false);
      });
    });
    return () => unsubscribe?.();
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F0F' }}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0F0F0F' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        {user ? (
          <>
            <Stack.Screen
              name="IsbnScanScreen"
              component={IsbnScanScreen}
              options={({ navigation }: { navigation: NavigationProp<RootStackParamList> }) => ({
                title: 'Scan ISBN',
                headerRight: () => (
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TouchableOpacity onPress={() => navigation.navigate('Library')}>
                      <Text style={{ color: '#4A90D9', fontWeight: '600', fontSize: 15 }}>
                        Library
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={signOut}>
                      <Text style={{ color: '#888', fontWeight: '600', fontSize: 15 }}>
                        Sign Out
                      </Text>
                    </TouchableOpacity>
                  </View>
                ),
              })}
            />
            <Stack.Screen
              name="ResultsScreen"
              component={ResultsScreen}
              options={{ title: 'Book Info' }}
            />
            <Stack.Screen
              name="Library"
              component={LibraryScreen}
              options={{ title: 'My Library' }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
