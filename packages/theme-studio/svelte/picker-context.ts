import { getContext, setContext } from 'svelte';
import type { ThemePickerStore } from '../core';
const key = Symbol('theme-picker');
export const provideThemePicker = (picker: ThemePickerStore) =>
  setContext(key, picker);
export function useThemePickerStore() {
  const picker = getContext<ThemePickerStore>(key);
  if (!picker) throw new Error('Theme picker parts require ThemePickerRoot');
  return picker;
}
export function useThemePicker() {
  const picker = useThemePickerStore();
  return {
    subscribe(
      run: (state: ReturnType<ThemePickerStore['getSnapshot']>) => void,
    ) {
      run(picker.getSnapshot());
      return picker.subscribe(() => run(picker.getSnapshot()));
    },
  };
}
