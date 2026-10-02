'use client';
import {
  ColorMarkerThumb,
  type ColorPlaneProps,
  ColorRoot,
  ColorWheelSurface,
} from '@salyra-ui/color-picker/react';
import {
  type ButtonHTMLAttributes,
  createContext,
  forwardRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  bindBorderInput,
  type BorderKind,
  createThemePickerStore,
  createThemeStore,
  mountThemeStore,
  type Role,
  type Target,
  type ThemeOptions,
  themePickerMarkers,
  themeScopeStyles,
  type ThemePickerOptions,
  type ThemePickerStore,
  type ThemeStore,
} from '../core';
import { Context, useTheme, useThemeStore } from './context';
const PickerContext = createContext<ThemePickerStore | null>(null);
export function useThemePickerStore() {
  const picker = useContext(PickerContext);
  if (!picker) throw new Error('Theme picker parts require ThemePickerRoot');
  return picker;
}
export function useThemePicker() {
  const picker = useThemePickerStore();
  return useSyncExternalStore(
    picker.subscribe,
    picker.getSnapshot,
    picker.getSnapshot,
  );
}
/** Registers selected roles, synchronizes the active color and provides context. Renders no layout. */
export function ThemePickerRoot({
  picker: provided,
  children,
  ...options
}: ThemePickerOptions & { picker?: ThemePickerStore; children: ReactNode }) {
  const theme = useThemeStore(),
    [picker] = useState(
      () => provided ?? createThemePickerStore(theme, options),
    );
  useEffect(() => picker.mount(), [picker]);
  useEffect(() => {
    if (options.disabled !== undefined) picker.setDisabled(options.disabled);
  }, [picker, options.disabled]);
  useEffect(() => {
    if (options.activeRole) picker.selectRole(options.activeRole);
  }, [picker, options.activeRole]);
  useEffect(() => {
    if (options.roles) picker.setRoles(options.roles);
  }, [picker, options.roles]);
  useEffect(() => {
    if (options.view) picker.setView(options.view);
  }, [picker, options.view]);
  return (
    <PickerContext.Provider value={picker}>
      <ColorRoot store={picker.activeColor}>{children}</ColorRoot>
    </PickerContext.Provider>
  );
}
export const ThemeRoleTrigger = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { role: Role }
>(function ThemeRoleTrigger(
  { role, children, onClick, disabled, ...attributes },
  ref,
) {
  const picker = useThemePickerStore(),
    state = useThemePicker(),
    theme = useTheme();
  return (
    <button
      type="button"
      {...attributes}
      ref={ref}
      data-tk-part="role-trigger"
      data-role={role}
      aria-pressed={state.activeRole === role}
      data-state={state.activeRole === role ? 'active' : 'inactive'}
      disabled={
        disabled ||
        theme.disabled ||
        state.colors[state.activeRole].disabled ||
        !state.roles.includes(role)
      }
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) picker.selectRole(role);
      }}
    >
      {children ?? role}
    </button>
  );
});
export function ThemePickerWheel({
  children,
  ...attributes
}: Omit<
  ColorPlaneProps,
  'view' | 'markers' | 'activeId' | 'onSelect' | 'onMarkerChange'
>) {
  const picker = useThemePickerStore(),
    state = useThemePicker(),
    markers = themePickerMarkers(state);
  return (
    <ColorWheelSurface
      {...attributes}
      markers={markers}
      activeId={state.activeRole}
      onSelect={(id) => picker.selectRole(id as Role)}
      onMarkerChange={(id, hsv) => picker.setHSV(id as Role, hsv)}
    >
      {children ??
        markers.map((marker) => (
          <ColorMarkerThumb
            key={marker.id}
            marker={marker}
            active={state.activeRole === marker.id}
            className="cp-wheel-marker"
          />
        ))}
    </ColorWheelSurface>
  );
}
/** A native numeric input. Labels, units and wrappers belong to the application. */
export const ThemeGeometryInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue'> & {
    kind?: BorderKind;
    target?: Target;
  }
>(function ThemeGeometryInput(
  { kind = 'radius', target = 'DEFAULT', disabled, ...attributes },
  forwarded,
) {
  const store = useThemeStore(),
    state = useTheme(),
    element = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const fields = store.registerFields({ roles: [], [kind]: [target] });
    const stop = bindBorderInput(element.current!, store, kind, target);
    return () => {
      stop();
      fields.destroy();
    };
  }, [store, kind, target]);
  return (
    <input
      type="number"
      min={0}
      max={1000}
      step={kind === 'radius' ? 0.125 : 1}
      aria-label={`${target} ${kind}`}
      {...attributes}
      data-tk-part="geometry-input"
      disabled={disabled || state.disabled}
      defaultValue={state.theme.structure.websitePreset.border[kind][target]}
      ref={(node) => {
        element.current = node;
        if (typeof forwarded === 'function') forwarded(node);
        else if (forwarded) forwarded.current = node;
      }}
    />
  );
});

/** Theme context and lifecycle only. Place a ThemeScope wherever CSS variables should apply. */
export function ThemeRoot({
  store: provided,
  options = {},
  children,
}: {
  store?: ThemeStore;
  options?: ThemeOptions;
  children: ReactNode;
}) {
  const [initial] = useState(options),
    [store] = useState(() => provided ?? createThemeStore(initial));
  useEffect(
    () => mountThemeStore(store, initial.storage, initial),
    [store, initial],
  );
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export const ThemeVariableScope = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function ThemeVariableScope({ style, ...attributes }, ref) {
  const state = useTheme();
  const variables = Object.fromEntries(
    Object.entries(themeScopeStyles(state)).map(([key, value]) => [
      key === 'color-scheme' ? 'colorScheme' : key,
      value,
    ]),
  );
  return (
    <div
      {...attributes}
      ref={ref}
      style={{ ...variables, ...style }}
      data-tk-part="scope"
      data-theme={state.theme.id}
      data-mode={state.mode}
      data-mode-preference={state.modePreference}
      data-theme-status={state.status}
      data-disabled={state.disabled}
    />
  );
});
export const ThemeStudio = {
  Root: ThemeRoot,
  Scope: ThemeVariableScope,
  PickerRoot: ThemePickerRoot,
  RoleTrigger: ThemeRoleTrigger,
  Wheel: ThemePickerWheel,
  GeometryInput: ThemeGeometryInput,
};
