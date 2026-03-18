/**
 * AppNavigator.tsx
 * ─────────────────────────────────────────────────────────────
 * PURPOSE:
 *   Defines the navigation stack that connects all three modules:
 *     CameraScreen  →  ResultsScreen (OcrScreen alias)
 *
 *   This is the single source of truth for screen routing.
 *   Adding a new screen? Register it here — nowhere else.
 *
 * DEPENDENCIES:
 *   npm install @react-navigation/native @react-navigation/native-stack
 *   npm install react-native-screens react-native-safe-area-context
 * ─────────────────────────────────────────────────────────────
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CameraScreen from '../modules/camera/CameraScreen';
import ResultsScreen from '../modules/results/ResultsScreen';

// ─── Stack param list ──────────────────────────────────────────
// Centralises all navigation param types — TypeScript will enforce them
export type RootStackParamList = {
  CameraScreen: undefined;
  OcrScreen: { image: import('../modules/camera/cameraUtils').CapturedImage };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Navigator ────────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="CameraScreen"
        screenOptions={{
          headerStyle: { backgroundColor: '#0F0F0F' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        {/* Module 1 — Camera */}
        <Stack.Screen
          name="CameraScreen"
          component={CameraScreen}
          options={{ title: 'Scan Page' }}
        />

        {/* Module 2+3 — OCR runs on mount, results displayed */}
        <Stack.Screen
          name="OcrScreen"
          component={ResultsScreen}
          options={{ title: 'Results' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
