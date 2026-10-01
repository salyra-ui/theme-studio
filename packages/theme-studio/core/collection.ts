import { parseTheme } from './theme';
import type { Theme } from './types';
export interface ThemeCollectionSnapshot {
  readonly recent: readonly Theme[];
  readonly favorites: readonly Theme[];
}
export interface ThemeCollectionStorage {
  read(): unknown;
  write(value: ThemeCollectionSnapshot): void;
}
export function browserThemeCollectionStorage(
  key = '@salyra-ui/theme-studio:library',
): ThemeCollectionStorage {
  return {
    read: () => JSON.parse(localStorage.getItem(key) ?? 'null'),
    write: (value) => localStorage.setItem(key, JSON.stringify(value)),
  };
}
export function createThemeCollection(
  options: {
    limit?: number;
    storage?: ThemeCollectionStorage;
    favorites?: readonly Theme[];
  } = {},
) {
  const limit = options.limit ?? 12;
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000)
    throw new TypeError('Theme collection limit must be between 1 and 1000');
  const normalize = (value: unknown): readonly Theme[] => {
    if (!Array.isArray(value)) throw new TypeError('Expected a list of themes');
    const parsed = value.map(parseTheme),
      seen = new Set<string>();
    return Object.freeze(
      parsed
        .filter((t) => {
          if (seen.has(t.id)) return false;
          seen.add(t.id);
          return true;
        })
        .slice(0, limit),
    );
  };
  let state: ThemeCollectionSnapshot = Object.freeze({
    recent: Object.freeze([]),
    favorites: normalize(options.favorites ?? []),
  });
  const listeners = new Set<() => void>();
  const publish = (next: ThemeCollectionSnapshot, persist = true) => {
    if (JSON.stringify(state) === JSON.stringify(next)) return;
    state = Object.freeze(next);
    listeners.forEach((fn) => fn());
    if (persist)
      try {
        options.storage?.write(state);
      } catch {
        /* Persistence is optional. */
      }
  };
  return {
    getSnapshot: () => state,
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    load() {
      try {
        const data = options.storage?.read() as ThemeCollectionSnapshot | null;
        if (data)
          publish(
            {
              recent: normalize(data.recent),
              favorites: normalize(data.favorites),
            },
            false,
          );
      } catch {
        /* Ignore unavailable or corrupt storage. */
      }
    },
    remember(theme: Theme) {
      const value = parseTheme(theme);
      publish({
        ...state,
        recent: normalize([
          value,
          ...state.recent.filter((t) => t.id !== value.id),
        ]),
      });
    },
    toggleFavorite(theme: Theme) {
      const value = parseTheme(theme);
      publish({
        ...state,
        favorites: normalize(
          state.favorites.some((t) => t.id === value.id)
            ? state.favorites.filter((t) => t.id !== value.id)
            : [value, ...state.favorites],
        ),
      });
    },
    clearRecent() {
      publish({ ...state, recent: Object.freeze([]) });
    },
  };
}
