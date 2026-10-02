'use client';
import { type ReactNode } from 'react';
import { useTheme, useThemeStore } from './context';
export function ThemeError({
  children,
}: {
  children: (error: Error, retry: () => Promise<void>) => ReactNode;
}) {
  const state = useTheme(),
    store = useThemeStore();
  return state.error ? <>{children(state.error, store.reload)}</> : null;
}
