import {
  modePreferences,
  type ModePreference,
  type ModeStorage,
  type ThemeStore,
} from './types';
export function isModePreference(value: unknown): value is ModePreference {
  return (
    typeof value === 'string' &&
    modePreferences.includes(value as ModePreference)
  );
}
export function nextThemeMode(mode: ModePreference): ModePreference {
  return modePreferences[
    (modePreferences.indexOf(mode) + 1) % modePreferences.length
  ];
}
/** Lazy browser adapter: safe to construct during SSR. */
export function browserModeStorage(key = 'theme-studio:mode'): ModeStorage {
  return {
    read: () => localStorage.getItem(key),
    write: (mode) => localStorage.setItem(key, mode),
    subscribe(listener) {
      const update = (event: StorageEvent) => {
        if (
          event.key === key &&
          event.storageArea === localStorage &&
          isModePreference(event.newValue)
        )
          listener(event.newValue);
      };
      window.addEventListener('storage', update);
      return () => window.removeEventListener('storage', update);
    },
  };
}
/** Resolve system only after mount, retaining the deterministic SSR snapshot. */
export function mountThemeMode(
  store: ThemeStore,
  storage: ModeStorage | false = browserModeStorage(),
): () => void {
  if (typeof window === 'undefined') return () => {};
  try {
    const saved = storage && storage.read();
    if (isModePreference(saved)) store.setMode(saved);
  } catch {
    /* Unavailable or corrupt persistence. */
  }
  const query =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : undefined;
  const resolve = () => {
    if (query) store.setSystemMode(query.matches ? 'dark' : 'light');
  };
  resolve();
  query?.addEventListener('change', resolve);
  let last = store.getSnapshot().modePreference,
    applyingRemote = false;
  const persist = () => {
    const mode = store.getSnapshot().modePreference;
    if (mode === last) return;
    last = mode;
    if (!storage || applyingRemote) return;
    try {
      storage.write(mode);
    } catch {
      /* Quota or private mode. */
    }
  };
  const unsubscribe = store.subscribe(persist);
  let unsubscribeStorage: (() => void) | undefined;
  try {
    unsubscribeStorage =
      (storage &&
        storage.subscribe?.((value) => {
          if (!isModePreference(value)) return;
          applyingRemote = true;
          try {
            store.setMode(value);
          } finally {
            applyingRemote = false;
          }
        })) ||
      undefined;
  } catch {
    /* Unavailable storage event source. */
  }
  return () => {
    unsubscribe();
    unsubscribeStorage?.();
    query?.removeEventListener('change', resolve);
  };
}
/** Framework-independent actions for custom buttons, selects and toggles. */
export function themeModeActions(store: ThemeStore) {
  return {
    setMode: store.setMode,
    cycle: () =>
      store.setMode(nextThemeMode(store.getSnapshot().modePreference)),
  };
}
