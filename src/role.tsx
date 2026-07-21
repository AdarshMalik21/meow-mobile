import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { registerClearRoleOnLogout } from './auth';

export type RoleMode = 'rider' | 'driver';

type RoleContextValue = {
  mode: RoleMode | null;
  roleReady: boolean;
  setMode: (mode: RoleMode) => Promise<void>;
  clearMode: () => Promise<void>;
};

const RoleContext = createContext<RoleContextValue | null>(null);
const KEY = 'zippycar_role_mode';

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<RoleMode | null>(null);
  const [roleReady, setRoleReady] = useState(false);

  const clearMode = useCallback(async () => {
    setModeState(null);
    await AsyncStorage.removeItem(KEY);
  }, []);

  useEffect(() => {
    registerClearRoleOnLogout(clearMode);
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === 'rider' || v === 'driver') setModeState(v);
      else setModeState(null);
      setRoleReady(true);
    });
  }, [clearMode]);

  const setMode = useCallback(async (next: RoleMode) => {
    setModeState(next);
    await AsyncStorage.setItem(KEY, next);
  }, []);

  const value = useMemo(
    () => ({ mode, roleReady, setMode, clearMode }),
    [mode, roleReady, setMode, clearMode]
  );
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
