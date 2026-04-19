import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import '@mantine/core/styles.css';


export default function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/dashboard" />} /> {/* Added this route */}
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}