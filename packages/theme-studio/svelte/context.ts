import { getContext, setContext } from 'svelte';
import { themeModeActions } from '../core';
import type { ThemeStore, ThemeSnapshot } from '../core';
const key = Symbol('@salyra-ui/theme-studio');
export const provideTheme = (store: ThemeStore) => setContext(key, store);
export function useThemeStore(): ThemeStore {
  const store = getContext<ThemeStore>(key);
  if (!store) throw new Error('Theme components require ThemeProvider');
  return store;
}
export function useTheme() {
  const store = useThemeStore();
  return {
    subscribe(run: (state: ThemeSnapshot) => void) {
      run(store.getSnapshot());
      return store.subscribe(() => run(store.getSnapshot()));
    },
  };
}

export function useThemeMode() {
  const store = useThemeStore();
  return {
    ...themeModeActions(store),
    subscribe(
      run: (state: {
        preference: ReturnType<ThemeStore['getSnapshot']>['modePreference'];
        resolvedMode: ReturnType<ThemeStore['getSnapshot']>['mode'];
      }) => void,
    ) {
      const update = () => {
        const state = store.getSnapshot();
        run({ preference: state.modePreference, resolvedMode: state.mode });
      };
      update();
      return store.subscribe(update);
    },
  };
}
