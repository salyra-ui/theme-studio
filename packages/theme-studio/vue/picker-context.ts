import {
  inject,
  provide,
  shallowRef,
  onScopeDispose,
  type InjectionKey,
} from 'vue';
import type { ThemePickerStore } from '../core';
const key: InjectionKey<ThemePickerStore> = Symbol('theme-picker');
export const provideThemePicker = (picker: ThemePickerStore) => {
  provide(key, picker);
  return picker;
};
export function useThemePickerStore() {
  const picker = inject(key);
  if (!picker) throw new Error('Theme picker parts require ThemePickerRoot');
  return picker;
}
export function useThemePicker() {
  const picker = useThemePickerStore(),
    state = shallowRef(picker.getSnapshot());
  onScopeDispose(picker.subscribe(() => (state.value = picker.getSnapshot())));
  return state;
}
