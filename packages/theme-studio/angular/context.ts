import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { createThemeStore, type ThemeStore } from '../core';
@Injectable()
export class ThemeContext {
  private current = createThemeStore();
  private listeners = new Set<() => void>();
  private forward = () => this.listeners.forEach((fn) => fn());
  private unsubscribe = this.current.subscribe(this.forward);
  readonly store: ThemeStore = {
    getSnapshot: () => this.current.getSnapshot(),
    getServerSnapshot: () => this.current.getServerSnapshot(),
    subscribe: (fn) => {
      this.listeners.add(fn);
      return () => {
        this.listeners.delete(fn);
      };
    },
    start: () => this.current.start(),
    reload: () => this.current.reload(),
    stop: () => this.current.stop(),
    setTheme: (theme) => this.current.setTheme(theme),
    registerFields: (selection) => this.current.registerFields(selection),
    setDisabled: (disabled) => this.current.setDisabled(disabled),
    setSelection: (selection) => this.current.setSelection(selection),
    setBackground: (mode) => this.current.setBackground(mode),
    setMode: (mode) => this.current.setMode(mode),
    setSystemMode: (mode) => this.current.setSystemMode(mode),
    setName: (name) => this.current.setName(name),
    generate: (seed, options) => this.current.generate(seed, options),
    setColor: (role, hex) => this.current.setColor(role, hex),
    setBorder: (kind, target, value) =>
      this.current.setBorder(kind, target, value),
    setHarmony: (value) => this.current.setHarmony(value),
    generateHarmony: () => this.current.generateHarmony(),
  };
  constructor() {
    inject(DestroyRef).onDestroy(() => this.unsubscribe());
  }
  configure(store: ThemeStore) {
    this.unsubscribe();
    this.current = store;
    this.unsubscribe = store.subscribe(this.forward);
    this.forward();
  }
}
export function useThemeStore() {
  return inject(ThemeContext).store;
}
export function useTheme() {
  const store = useThemeStore(),
    state = signal(store.getSnapshot());
  inject(DestroyRef).onDestroy(
    store.subscribe(() => state.set(store.getSnapshot())),
  );
  return state.asReadonly();
}
