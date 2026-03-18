/**
 * App.tsx
 * ─────────────────────────────────────────────────────────────
 * PURPOSE:
 *   Root entry point. Renders the navigator and nothing else.
 *   All logic lives inside modules — App.tsx stays intentionally empty.
 * ─────────────────────────────────────────────────────────────
 */

import React from 'react';
import AppNavigator from '../navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}
