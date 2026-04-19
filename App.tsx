import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { loginAsAdmin } from './src/modules/api/AuthService';

export default function App() {
  useEffect(() => {
    loginAsAdmin().then((ok) => {
      if (!ok) console.warn('[App] Admin sign-in failed — check Firebase credentials in apiConfig.ts');
    });
  }, []);

  return <AppNavigator />;
}
