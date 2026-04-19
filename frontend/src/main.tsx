// frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications'; // [cite: 32]
import '@mantine/core/styles.css'; // [cite: 31]
import '@mantine/notifications/styles.css'; // [cite: 32]
import './index.css'; 
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider>
      {/* Add the Notifications component here */}
      <Notifications position="top-right" zIndex={1000} /> 
      
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>
);