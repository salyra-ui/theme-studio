import {
  computed,
  inject,
  provide,
  shallowRef,
  onScopeDispose,
  type InjectionKey,
} from 'vue';
import { themeModeActions } from '../core';
import type { ThemeStore } from '../core';
const key: InjectionKey<ThemeStore> = Symbol('@sebytza23/theme-kit');
export function provideTheme(store: ThemeStore) {
  provide(key, store);
  return store;
}
export function useThemeStore() {
  const store = inject(key);
  if (!store) throw new Error('Theme components require ThemeProvider');
  return store;
}
export function watchTheme(store: ThemeStore) {
  const state = shallowRef(store.getSnapshot());
  onScopeDispose(
    store.subscribe(() => {
      state.value = store.getSnapshot();
    }),
  );
  return state;
}
export function useTheme() {
  return watchTheme(useThemeStore());
}

export function useThemeMode() {
  const store = useThemeStore(), state = watchTheme(store);
  return { preference: computed(() => state.value.modePreference), resolvedMode: computed(() => state.value.mode), ...themeModeActions(store) };
}
