import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '../config/firebase';

export async function signIn(email: string, password: string): Promise<{ error?: string }> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return {};
  } catch (e: any) {
    const msg: Record<string, string> = {
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-not-found': 'No account found with that email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-credential': 'Incorrect email or password.',
      'auth/too-many-requests': 'Too many attempts. Try again later.',
    };
    return { error: msg[e.code] ?? e.message ?? 'Login failed.' };
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
