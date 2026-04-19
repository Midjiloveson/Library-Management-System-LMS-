import { createContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import axios from 'axios';

export const AuthContext = createContext();

const API_BASE = 'http://localhost:5001/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // MongoDB profile
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          const { data } = await axios.get(`${API_BASE}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(data);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged handles setting user
  };

  const signUp = async ({ email, password, firstName, lastName, phone }) => {
    const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);
    const token = await fbUser.getIdToken();
    const { data } = await axios.post(
      `${API_BASE}/auth/profile`,
      { firstName, lastName, phone },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setUser(data);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
