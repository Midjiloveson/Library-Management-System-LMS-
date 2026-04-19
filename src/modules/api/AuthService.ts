import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../../config/apiConfig';

export async function loginAsAdmin(): Promise<boolean> {
  try {
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    return true;
  } catch (err: any) {
    console.warn('[AuthService] Firebase sign-in failed:', err?.message ?? err);
    return false;
  }
}

export async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    const ok = await loginAsAdmin();
    if (!ok) return null;
  }
  try {
    return await auth.currentUser!.getIdToken();
  } catch {
    return null;
  }
}

export async function refreshToken(): Promise<string | null> {
  try {
    return await auth.currentUser?.getIdToken(true) ?? null;
  } catch {
    return null;
  }
}
