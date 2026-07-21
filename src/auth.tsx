import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AuthApi, setToken, User } from './api';
import { signOutFirebase } from './firebaseAuth';
import {
  clearPushTokenOnBackend,
  registerAndSyncPushToken,
  subscribePushTokenRefresh,
} from './pushNotifications';
import * as SecureStore from 'expo-secure-store';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithFirebase: (idToken: string) => Promise<User>;
  signInWithDev: (phone: string) => Promise<User>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

let clearRoleOnLogout: (() => Promise<void>) | null = null;

export function registerClearRoleOnLogout(fn: () => Promise<void>) {
  clearRoleOnLogout = fn;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('zippycar_token');
      if (!token) {
        setUser(null);
        return null;
      }
      const { user: me } = await AuthApi.me();
      setUser(me);
      if (me) {
        registerAndSyncPushToken();
      }
      return me;
    } catch {
      await setToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  useEffect(() => {
    if (!user) return;
    return subscribePushTokenRefresh(() => {
      registerAndSyncPushToken();
    });
  }, [user]);

  const signInWithFirebase = useCallback(async (idToken: string) => {
    const { token, user: u } = await AuthApi.firebase(idToken);
    await setToken(token);
    setUser(u);
    await registerAndSyncPushToken();
    return u;
  }, []);

  const signInWithDev = useCallback(async (phone: string) => {
    const { token, user: u } = await AuthApi.devLogin(phone);
    await setToken(token);
    setUser(u);
    await registerAndSyncPushToken();
    return u;
  }, []);

  const signOut = useCallback(async () => {
    await clearPushTokenOnBackend();
    await setToken(null);
    setUser(null);
    await signOutFirebase();
    if (clearRoleOnLogout) await clearRoleOnLogout();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signInWithFirebase,
      signInWithDev,
      signOut,
      refreshUser,
      setUser,
    }),
    [user, loading, signInWithFirebase, signInWithDev, signOut, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
