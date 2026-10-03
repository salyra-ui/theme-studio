'use client';
import { themeModeActions } from '../core';
import { useTheme, useThemeStore } from './context';
export function useThemeMode() {
  const state = useTheme(),
    store = useThemeStore();
  return {
    preference: state.modePreference,
    resolvedMode: state.mode,
    ...themeModeActions(store),
  };
}
