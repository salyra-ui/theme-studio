'use client';
import { createContext, useContext, useSyncExternalStore } from 'react';
import type { ThemeStore } from '../core';
export const Context = createContext<ThemeStore | null>(null);
export function useThemeStore() {
  const store = useContext(Context);
  if (!store) throw new Error('Theme components require ThemeProvider');
  return store;
}
export function useTheme() {
  const store = useThemeStore();
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
}
