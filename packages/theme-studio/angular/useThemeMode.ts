import { computed } from '@angular/core';
import { themeModeActions } from '../core';
import { useThemeStore } from './context';
import { useTheme } from './context';
export function useThemeMode() {
  const store = useThemeStore(),
    state = useTheme();
  return {
    preference: computed(() => state().modePreference),
    resolvedMode: computed(() => state().mode),
    ...themeModeActions(store),
  };
}
