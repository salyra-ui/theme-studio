import {
  bindMarkerWheel,
  type ColorMarker,
  createColorStore,
  wheelStyle,
  type ColorStore,
  type ColorSnapshot,
  type HSV,
} from '@salyra-ui/color-picker';
import { roles as allRoles, type Role, type ThemeStore } from './types';
import { themeColor } from './editor';

export const themePickerViews = ['area', 'wheel', 'shared-wheel'] as const;
export type ThemePickerView = (typeof themePickerViews)[number];
export interface ThemePickerSnapshot {
  readonly roles: readonly Role[];
  readonly activeRole: Role;
  readonly view: ThemePickerView;
  readonly colors: Readonly<Record<Role, ColorSnapshot>>;
}
export interface ThemePickerOptions {
  disabled?: boolean;
  /** Hide role and view selectors for a fixed composition. Defaults to false for one role. */
  controls?: boolean;
  roles?: readonly Role[];
  activeRole?: Role;
  view?: ThemePickerView;
}
export interface ThemePickerStore {
  getSnapshot(): ThemePickerSnapshot;
  getServerSnapshot(): ThemePickerSnapshot;
  subscribe(fn: () => void): () => void;
  /** Start external theme synchronization on mount; cleanup is safe to remount. */
  mount(): () => void;
  setRoles(roles: readonly Role[]): void;
  selectRole(role: Role): void;
  setView(view: ThemePickerView): void;
  setHSV(role: Role, hsv: Partial<HSV>): void;
  readonly activeColor: ColorStore;
}
export function createThemePickerStore(
  theme: ThemeStore,
  options: ThemePickerOptions = {},
): ThemePickerStore {
  const validate = (values: readonly Role[]) => {
    if (
      !values.length ||
      new Set(values).size !== values.length ||
      values.some((role) => !allRoles.includes(role))
    )
      throw new TypeError('Select one or more unique theme roles');
    return Object.freeze([...values]);
  };
  const colors = Object.fromEntries(
    allRoles.map((role) => [
      role,
      createColorStore(
        themeColor(theme.getSnapshot().theme, role),
        'hex',
        'area',
        theme.getSnapshot().disabled || !!options.disabled,
      ),
    ]),
  ) as Record<Role, ColorStore>;
  let selected = validate(options.roles ?? allRoles),
    active = options.activeRole ?? selected[0],
    view = options.view ?? 'shared-wheel';
  if (!selected.includes(active) || !themePickerViews.includes(view))
    throw new TypeError('Invalid active role or picker view');
  const listeners = new Set<() => void>(),
    colorListeners = new Set<() => void>();
  const capture = (): ThemePickerSnapshot =>
    Object.freeze({
      roles: selected,
      activeRole: active,
      view,
      colors: Object.freeze(
        Object.fromEntries(
          allRoles.map((role) => [role, colors[role].getSnapshot()]),
        ),
      ) as ThemePickerSnapshot['colors'],
    });
  let snapshot = capture(),
    syncing = false,
    mounts = 0,
    unsubscribe: (() => void) | undefined,
    fieldRegistration: import('./types').ThemeFieldRegistration | undefined;
  const server = snapshot,
    serverColor = colors[active].getServerSnapshot();
  const publish = () => {
    snapshot = capture();
    listeners.forEach((fn) => fn());
    colorListeners.forEach((fn) => fn());
  };
  for (const role of allRoles)
    colors[role].subscribe(() => {
      if (syncing) return;
      const hex = colors[role].getSnapshot().hex;
      if (themeColor(theme.getSnapshot().theme, role) !== hex)
        theme.setColor(role, hex);
      publish();
    });
  const sync = () => {
    const current = theme.getSnapshot().theme;
    let changed = false;
    syncing = true;
    try {
      for (const role of allRoles) {
        const disabled = theme.getSnapshot().disabled || !!options.disabled;
        if (colors[role].getSnapshot().disabled !== disabled) {
          colors[role].setDisabled(disabled);
          changed = true;
        }
        const hex = themeColor(current, role);
        if (hex !== colors[role].getSnapshot().hex) {
          colors[role].setHex(hex);
          changed = true;
        }
      }
    } finally {
      syncing = false;
    }
    if (changed) publish();
  };
  const selectRole = (role: Role) => {
    if (!selected.includes(role))
      throw new TypeError('Role is not included in this picker');
    if (active !== role) {
      active = role;
      publish();
    }
  };
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => server,
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    mount() {
      if (mounts++ === 0) {
        fieldRegistration = theme.registerFields({ roles: selected });
        sync();
        unsubscribe = theme.subscribe(sync);
      }
      let disposed = false;
      return () => {
        if (!disposed) {
          disposed = true;
          if (--mounts === 0) {
            unsubscribe?.();
            unsubscribe = undefined;
            fieldRegistration?.destroy();
            fieldRegistration = undefined;
          }
        }
      };
    },
    selectRole,
    setRoles(values) {
      selected = validate(values);
      fieldRegistration?.update({ roles: selected });
      if (!selected.includes(active)) active = selected[0];
      publish();
    },
    setView(value) {
      if (!themePickerViews.includes(value))
        throw new TypeError('Invalid picker view');
      if (view !== value) {
        view = value;
        publish();
      }
    },
    setHSV(role, hsv) {
      if (!selected.includes(role))
        throw new TypeError('Role is not included in this picker');
      colors[role].setHSV(hsv);
    },
    activeColor: {
      setDisabled: (disabled) => colors[active].setDisabled(disabled),
      getSnapshot: () => colors[active].getSnapshot(),
      getServerSnapshot: () => serverColor,
      getColor: () => colors[active].getColor(),
      getValue: (format) => colors[active].getValue(format),
      subscribe(fn) {
        colorListeners.add(fn);
        return () => {
          colorListeners.delete(fn);
        };
      },
      setAlpha: (alpha) => colors[active].setAlpha(alpha),
      setHex: (hex) => colors[active].setHex(hex),
      setHSV: (hsv) => colors[active].setHSV(hsv),
      setFormat: (format) => colors[active].setFormat(format),
      setView: (value) => colors[active].setView(value),
    },
  };
}
export const sharedWheelStyle = () => wheelStyle({ h: 0, s: 100, v: 100 });
export function themeMarkerStyle(
  color: ColorSnapshot,
  active: boolean,
): string {
  const a = (color.h * Math.PI) / 180;
  return `left:${50 + (Math.cos(a) * color.s) / 2}%;top:${50 + (Math.sin(a) * color.s) / 2}%;background:${color.hex};z-index:${active ? 2 : 1}`;
}
/** Theme adapter: geometry, gestures and marker rendering belong to color-picker. */
export function bindThemeWheel(
  element: HTMLElement,
  picker: ThemePickerStore,
): () => void {
  return bindMarkerWheel(element, {
    getMarkers: () => themePickerMarkers(picker.getSnapshot()),
    getActiveId: () => picker.getSnapshot().activeRole,
    select: (id) => picker.selectRole(id as Role),
    setHSV: (id, hsv) => picker.setHSV(id as Role, hsv),
  });
}
export function themePickerMarkers(
  state: ThemePickerSnapshot,
): readonly ColorMarker[] {
  return state.roles.map((role) => ({
    id: role,
    color: state.colors[role],
    label: state.roles.length === 1 ? '' : role[0].toUpperCase(),
    ariaLabel: `Select ${role} marker`,
  }));
}
