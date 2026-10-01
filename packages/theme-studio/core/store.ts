import { mountThemeMode, isModePreference } from './mode';
import { watchThemeUpdates } from './remote';
import {
  withThemeBackground,
  defaultTheme,
  generateTheme,
  parseTheme,
  themeStyle,
} from './theme';
import type {
  Mode,
  Theme,
  ThemeOptions,
  ThemeSnapshot,
  ThemeStorage,
  ThemeStore,
} from './types';
import { type TokenSelection } from './editor';
import { harmonies } from './types';
import {
  themeColor,
  withThemeColor,
  withThemeBorder,
  withThemeName,
} from './editor';

const freezeSelection = (selection: TokenSelection) =>
  Object.freeze({
    ...selection,
    ...Object.fromEntries(
      ['roles', 'radius', 'width', 'modes']
        .filter((key) => Array.isArray(selection[key as keyof TokenSelection]))
        .map((key) => [
          key,
          Object.freeze([
            ...(selection[key as keyof TokenSelection] as readonly string[]),
          ]),
        ]),
    ),
  });
const storeOptions = new WeakMap<ThemeStore, ThemeOptions>();
export function createThemeStore(options: ThemeOptions = {}): ThemeStore {
  const fallback = parseTheme(options.fallbackTheme ?? defaultTheme);
  const initialTheme = options.theme ? parseTheme(options.theme) : fallback;
  const theme = options.background
    ? withThemeBackground(initialTheme, options.background)
    : initialTheme;
  const waiting =
    !options.theme && Boolean(options.loadTheme || options.storage);
  const modePreference = options.mode ?? 'system';
  if (!isModePreference(modePreference)) throw new TypeError('Invalid mode');
  const systemMode = options.systemMode ?? 'light';
  if (systemMode !== 'light' && systemMode !== 'dark')
    throw new TypeError('Invalid system mode');
  const mode = modePreference === 'system' ? systemMode : modePreference;
  const timeoutMs = options.timeoutMs ?? 10000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
    throw new TypeError('timeoutMs must be positive');
  let snapshot: ThemeSnapshot = Object.freeze({
    theme,
    selection: options.selection
      ? freezeSelection(options.selection)
      : undefined,
    disabled: options.disabled ?? false,
    background: theme.backgroundMode ?? 'preserve',
    mode,
    modePreference,
    systemMode,
    status: waiting ? 'loading' : 'ready',
    pending: waiting,
    error: null,
    style: themeStyle(theme, mode),
  });
  const serverSnapshot = snapshot;
  const listeners = new Set<() => void>();
  let controller: AbortController | undefined,
    revision = 0;
  const publish = (patch: Partial<ThemeSnapshot>) => {
    const next = { ...snapshot, ...patch };
    next.background = next.theme.backgroundMode ?? 'preserve';
    if (next.theme !== snapshot.theme || next.mode !== snapshot.mode)
      next.style = themeStyle(next.theme, next.mode);
    snapshot = Object.freeze(next);
    listeners.forEach((fn) => fn());
  };
  const cancel = () => {
    revision++;
    controller?.abort();
    controller = undefined;
  };
  async function load(useStorage: boolean) {
    cancel();
    const version = revision;
    const request = new AbortController();
    controller = request;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const current = () => version === revision;
    const interrupted = new Promise<never>((_, reject) => {
      request.signal.addEventListener(
        'abort',
        () => reject(new Error('Theme load cancelled')),
        { once: true },
      );
      timer = setTimeout(
        () => reject(new Error('Theme load timed out')),
        timeoutMs,
      );
    });
    publish({ pending: true, error: null });
    try {
      await Promise.race([
        (async () => {
          if (useStorage && options.storage) {
            // An explicit SSR/standalone theme is authoritative over an old browser cache.
            if (!options.theme) {
              try {
                const value = await options.storage.read();
                if (value != null && current())
                  publish({ theme: parseTheme(value), status: 'ready' });
              } catch {
                /* Ignore unavailable or corrupt cache. */
              }
            }
          }
          if (!current()) return;
          if (options.loadTheme) {
            const result = await options.loadTheme(request.signal);
            if (current())
              publish({
                theme: parseTheme(result),
                status: 'ready',
                pending: false,
              });
          } else if (current()) publish({ status: 'ready', pending: false });
        })(),
        interrupted,
      ]);
    } catch (error) {
      if (current()) {
        // Invalidate a loader that ignores AbortSignal and resolves after timeout.
        revision++;
        request.abort();
        publish({
          theme: fallback,
          status: 'fallback',
          pending: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    } finally {
      clearTimeout(timer);
      if (current()) controller = undefined;
    }
  }
  let explicitSelection = options.selection !== undefined;
  const fields = new Map<symbol, TokenSelection>();
  const updateFields = () => {
    if (explicitSelection) return;
    const values = [...fields.values()];
    const selection = values.length
      ? freezeSelection({
          roles: [...new Set(values.flatMap((value) => value.roles ?? []))],
          radius: [...new Set(values.flatMap((value) => value.radius ?? []))],
          width: [...new Set(values.flatMap((value) => value.width ?? []))],
          background: values.some((value) => value.background),
        })
      : undefined;
    if (JSON.stringify(selection) !== JSON.stringify(snapshot.selection))
      publish({ selection });
  };
  const setTheme = (value: Theme) => {
    const next = parseTheme(value);
    cancel();
    publish({ theme: next, status: 'ready', pending: false, error: null });
  };
  const store: ThemeStore = {
    setDisabled(disabled) {
      if (disabled !== snapshot.disabled) publish({ disabled });
    },
    registerFields(selection) {
      const id = Symbol('theme-fields');
      fields.set(id, freezeSelection(selection));
      updateFields();
      let disposed = false;
      return {
        update(next) {
          if (!disposed) {
            fields.set(id, freezeSelection(next));
            updateFields();
          }
        },
        destroy() {
          if (!disposed) {
            disposed = true;
            fields.delete(id);
            updateFields();
          }
        },
      };
    },
    setSelection(selection) {
      explicitSelection = true;
      const next = freezeSelection(selection);
      if (JSON.stringify(next) !== JSON.stringify(snapshot.selection))
        publish({ selection: next });
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    start: () => load(true),
    reload: () => load(false),
    stop() {
      cancel();
    },
    setTheme,
    setMode(mode) {
      if (!isModePreference(mode)) throw new TypeError('Invalid mode');
      if (snapshot.modePreference !== mode)
        publish({
          modePreference: mode,
          mode: mode === 'system' ? snapshot.systemMode : mode,
        });
    },
    setSystemMode(mode) {
      if (mode !== 'light' && mode !== 'dark')
        throw new TypeError('Invalid system mode');
      if (snapshot.systemMode !== mode)
        publish({
          systemMode: mode,
          ...(snapshot.modePreference === 'system' ? { mode } : {}),
        });
    },
    setName(name) {
      setTheme(withThemeName(snapshot.theme, name));
    },
    setBackground(mode) {
      setTheme(withThemeBackground(snapshot.theme, mode));
    },
    generate(seed, options) {
      setTheme(generateTheme(seed, { ...options, base: snapshot.theme }));
    },
    setColor: (role, hex) =>
      setTheme(withThemeColor(snapshot.theme, role, hex)),
    setBorder: (kind, target, value) =>
      setTheme(withThemeBorder(snapshot.theme, kind, target, value)),
    setHarmony(harmony) {
      if (!harmonies.includes(harmony)) throw new TypeError('Invalid harmony');
      setTheme({ ...snapshot.theme, harmony });
    },
    generateHarmony() {
      const current = snapshot.theme;
      setTheme(
        generateTheme(themeColor(current, 'primary'), {
          base: current,
          roles: ['secondary', 'accent'],
          id: current.id,
        }),
      );
    },
  };
  storeOptions.set(store, options);
  return store;
}
/** Debounced optional persistence; provider cleanup cancels I/O and flushes the last theme. */
export function mountThemeStore(
  store: ThemeStore,
  storage?: ThemeStorage,
  options: Pick<
    ThemeOptions,
    'revalidateOnFocus' | 'revalidateIntervalMs' | 'modeStorage'
  > = {},
): () => void {
  const initial = storeOptions.get(store) ?? {};
  storage ??= initial.storage;
  options = {
    ...initial,
    ...Object.fromEntries(
      Object.entries(options).filter(([, value]) => value !== undefined),
    ),
  };
  let last = store.getSnapshot().theme,
    timer: ReturnType<typeof setTimeout> | undefined,
    queued: Theme | undefined,
    applyingRemote = false;
  const write = () => {
    const value = queued;
    queued = undefined;
    if (value && storage)
      try {
        Promise.resolve(storage.write(value)).catch(() => {});
      } catch {
        /* Quota/private mode. */
      }
  };
  const unsubscribe = store.subscribe(() => {
    const state = store.getSnapshot();
    if (state.theme === last) return;
    last = state.theme;
    if (applyingRemote || state.status !== 'ready') return;
    queued = state.theme;
    clearTimeout(timer);
    timer = setTimeout(write, 150);
  });
  const unsubscribeStorage = storage?.subscribe?.((value) => {
    try {
      const remote = parseTheme(value);
      if (JSON.stringify(remote) === JSON.stringify(store.getSnapshot().theme))
        return;
      applyingRemote = true;
      clearTimeout(timer);
      queued = undefined;
      store.setTheme(remote);
    } catch {
      /* Ignore malformed cross-tab values. */
    } finally {
      applyingRemote = false;
    }
  });
  const unwatch =
    options.revalidateOnFocus || options.revalidateIntervalMs !== undefined
      ? watchThemeUpdates(store, {
          onFocus: options.revalidateOnFocus ?? false,
          intervalMs: options.revalidateIntervalMs,
        })
      : () => {};
  const unmountMode = mountThemeMode(store, options.modeStorage);
  void store.start();
  return () => {
    unsubscribe();
    unsubscribeStorage?.();
    unwatch();
    unmountMode();
    store.stop();
    clearTimeout(timer);
    write();
  };
}
/** Constructing this adapter on the server is safe; browser access happens on mount. */
export function browserStorage(key = '@salyra-ui/theme-studio'): ThemeStorage {
  return {
    read() {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data.version === 1 ? data.theme : null;
    },
    subscribe(listener) {
      const update = (event: StorageEvent) => {
        if (
          event.key !== key ||
          event.storageArea !== localStorage ||
          !event.newValue
        )
          return;
        try {
          const data = JSON.parse(event.newValue);
          if (data.version === 1) listener(data.theme);
        } catch {
          /* Corrupt external cache. */
        }
      };
      window.addEventListener('storage', update);
      return () => window.removeEventListener('storage', update);
    },
    write(theme) {
      localStorage.setItem(key, JSON.stringify({ version: 1, theme }));
    },
  };
}
