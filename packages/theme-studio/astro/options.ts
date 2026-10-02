import { createThemeStore, type ThemeOptions } from '../core';

/** Only serializable options cross the Astro server/client boundary. */
export type AstroThemeOptions = Omit<
  ThemeOptions,
  'loadTheme' | 'storage' | 'modeStorage'
> & {
  src?: string;
  storageKey?: string;
  modeStorageKey?: string;
  modeStorage?: false;
};

/** Seed the same pending state on the server. Browser Root starts loading and persistence. */
export function astroThemeSnapshot(options: AstroThemeOptions) {
  const {
    src,
    storageKey,
    modeStorageKey: _modeStorageKey,
    ...themeOptions
  } = options;
  return createThemeStore({
    ...themeOptions,
    loadTheme: src ? () => undefined : undefined,
    storage: storageKey ? { read: () => null, write: () => {} } : undefined,
  }).getSnapshot();
}
