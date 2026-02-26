'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useCallback } from 'react';
import { api } from '../api';

export function useAuth() {
  const { data: session, status } = useSession();
  const user = session?.user ?? null;
  const loading = status === 'loading';

  const login = useCallback(async (username, password) => {
    const res = await signIn('credentials', { username, password, redirect: false });
    if (res?.error) throw new Error(res.error === 'CredentialsSignin' ? 'Invalid credentials' : res.error);
    return res;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const data = await api.auth.register(username, email, password);
    const res = await signIn('credentials', { username, password, redirect: false });
    if (res?.error) throw new Error(res.error);
    return { user: data.user };
  }, []);

  const logout = useCallback(() => {
    signOut({ callbackUrl: '/login' });
  }, []);

  return { user, loading, login, register, logout };
}
