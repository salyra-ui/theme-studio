import { createHistory, type HistoryController } from '@salyra-ui/color-picker';
import { createThemeStore } from './store';
import { themeColor } from './editor';
import { generateTheme } from './theme';
import {
  roles,
  targets,
  type Role,
  type Target,
  type ThemeStore,
} from './types';

const read = (store: ThemeStore) => {
  const s = store.getSnapshot();
  return { theme: s.theme, mode: s.modePreference };
};
export function createThemeHistory(
  store: ThemeStore,
  options?: { limit?: number },
): HistoryController {
  return createHistory(
    {
      read: () => read(store),
      subscribe: store.subscribe,
      write(value) {
        store.setTheme(value.theme);
        store.setMode(value.mode);
      },
    },
    options,
  );
}
export type ThemeLock =
  Role | 'background' | `radius:${Target}` | `width:${Target}`;
export interface ThemeEditorSnapshot {
  readonly dirty: boolean;
  readonly conflict: boolean;
  readonly live: boolean;
  readonly locked: readonly ThemeLock[];
}
/** Isolated editor store. Pass editor.store to any framework provider. */
export function createThemeEditor(
  target: ThemeStore,
  options: {
    live?: boolean;
    historyLimit?: number;
    locked?: readonly ThemeLock[];
  } = {},
) {
  const initial = target.getSnapshot();
  const store = createThemeStore({
    theme: initial.theme,
    mode: initial.modePreference,
    systemMode: initial.systemMode,
    selection: initial.selection,
    disabled: initial.disabled,
    modeStorage: false,
  });
  const history = createThemeHistory(store, { limit: options.historyLimit });
  const listeners = new Set<() => void>();
  let baseline = JSON.stringify(read(target)),
    syncing = false,
    disposed = false;
  let state: ThemeEditorSnapshot = Object.freeze({
    dirty: false,
    conflict: false,
    live: options.live ?? false,
    locked: Object.freeze([]),
  });
  const emit = (patch: Partial<ThemeEditorSnapshot> = {}) => {
    state = Object.freeze({ ...state, ...patch });
    listeners.forEach((fn) => fn());
  };
  const validLock = (value: string) =>
    roles.includes(value as Role) ||
    value === 'background' ||
    (/^(radius|width):/.test(value) &&
      targets.includes(value.split(':')[1] as Target));
  const setLocked = (field: ThemeLock, locked = true) => {
    if (!validLock(field)) throw new TypeError('Invalid locked theme field');
    const next = new Set(state.locked);
    locked ? next.add(field) : next.delete(field);
    emit({ locked: Object.freeze([...next]) });
  };
  const commit = () => {
    syncing = true;
    try {
      const s = store.getSnapshot();
      target.setTheme(s.theme);
      target.setMode(s.modePreference);
    } finally {
      syncing = false;
    }
    baseline = JSON.stringify(read(target));
    emit({ dirty: false, conflict: false });
  };
  const reset = () => {
    const current = target.getSnapshot();
    syncing = true;
    try {
      store.setTheme(current.theme);
      store.setSystemMode(current.systemMode);
      store.setMode(current.modePreference);
      store.setDisabled(current.disabled);
    } finally {
      syncing = false;
    }
    baseline = JSON.stringify(read(target));
    history.clear();
    emit({ dirty: false, conflict: false });
  };
  const draftSubscription = store.subscribe(() => {
    if (syncing || disposed) return;
    const dirty = JSON.stringify(read(store)) !== baseline;
    if (state.live && dirty) commit();
    else if (dirty !== state.dirty) emit({ dirty });
  });
  const targetSubscription = target.subscribe(() => {
    if (syncing || disposed) return;
    store.setDisabled(target.getSnapshot().disabled);
    store.setSystemMode(target.getSnapshot().systemMode);
    if (JSON.stringify(read(target)) === baseline) return;
    if (state.dirty) emit({ conflict: true });
    else reset();
  });
  const generate = store.generate;
  store.generate = (seed, config = {}) => {
    const selected =
      config.roles ?? store.getSnapshot().selection?.roles ?? roles;
    const unlocked = selected.filter((role) => !state.locked.includes(role));
    if (!unlocked.length) return;
    const current = store.getSnapshot().theme;
    let next = generateTheme(seed, {
      ...config,
      roles: unlocked,
      base: current,
      id: current.id,
    });
    if (state.locked.includes('background'))
      next = {
        ...next,
        structure: {
          ...next.structure,
          websitePreset: current.structure.websitePreset,
        },
      };
    store.setTheme(next);
  };
  store.generateHarmony = () => {
    const s = store.getSnapshot();
    store.generate(themeColor(s.theme, 'primary'), {
      roles: (s.selection?.roles ?? roles).filter((role) => role !== 'primary'),
    });
  };
  for (const field of options.locked ?? []) setLocked(field);
  return {
    store,
    history,
    getSnapshot: () => state,
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    setLocked,
    apply(config: { force?: boolean } = {}) {
      if (disposed) return;
      if (state.conflict && !config.force)
        throw new Error(
          'The applied theme changed. Cancel to load it or apply with force to replace it.',
        );
      commit();
    },
    cancel() {
      if (!disposed) reset();
    },
    setLive(live: boolean) {
      if (disposed || live === state.live) return;
      if (live) {
        if (state.conflict)
          throw new Error(
            'Resolve the theme conflict before enabling live editing',
          );
        commit();
      }
      emit({ live });
    },
    destroy() {
      disposed = true;
      draftSubscription();
      targetSubscription();
      history.destroy();
      store.stop();
      store.generate = generate;
      listeners.clear();
    },
  };
}
