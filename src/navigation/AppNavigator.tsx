import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import IsbnScanScreen from '../modules/camera/IsbnScanScreen';
import ResultsScreen from '../modules/results/ResultsScreen';

export type RootStackParamList = {
  IsbnScanScreen: undefined;
  ResultsScreen: { isbn: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="IsbnScanScreen"
        screenOptions={{
          headerStyle: { backgroundColor: '#0F0F0F' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen
          name="IsbnScanScreen"
          component={IsbnScanScreen}
          options={{ title: 'Scan ISBN' }}
        />
        <Stack.Screen
          name="ResultsScreen"
          component={ResultsScreen}
          options={{ title: 'Book Info' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
