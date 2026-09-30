'use client';
export * from '../core';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  ColorSurface,
  ColorViewSelect,
  ColorWheel,
  ColorFormatSelect,
  ColorMode,
  ColorProvider,
  ColorArea,
  ColorSlider,
  ColorInput,
} from '@sebytza23/color-picker-react';
import { channelsToHex } from '@sebytza23/color-picker';
import {
  themeModeActions,
  suggestedThemeName,
  type ModePreference,
  themeList,
  selectedThemeId,
  themeConfiguration,
  type ThemeConfiguration,
  type ThemeExportFormat,
  type TokenSelection,
  themePickerMarkers,
  createThemePickerStore,
  bindThemeWheel,
  sharedWheelStyle,
  themeMarkerStyle,
  themePickerViews,
  roles as allRoles,
  type ThemePickerOptions,
  type ThemePickerStore,
  type ThemePickerView,
  harmonies,
  type Harmony,
  type Target,
  type BorderKind,
  createThemeStore,
  mountThemeStore,
  shades,
  type ThemeOptions,
  type ThemeStore,
  type Theme,
  type Role,
} from '../core';
const Context = createContext<ThemeStore | null>(null);
export function useThemeStore() {
  const store = useContext(Context);
  if (!store) throw new Error('Theme components require ThemeProvider');
  return store;
}
export function useTheme() {
  const store = useThemeStore();
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
}
/** Options initialize this provider. Use store.setTheme for subsequent changes. */
export function ThemeProvider({
  children,
  className = '',
  style,
  store: provided,
  ...options
}: ThemeOptions & {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  store?: ThemeStore;
}) {
  const [initial] = useState(options);
  const [store] = useState(() => provided ?? createThemeStore(initial));
  useEffect(
    () => mountThemeStore(store, initial.storage, initial),
    [store, initial],
  );
  return (
    <Context.Provider value={store}>
      <ThemeScope className={className} style={style}>
        {children}
      </ThemeScope>
    </Context.Provider>
  );
}
function ThemeScope({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className: string;
  style?: CSSProperties;
}) {
  const state = useTheme();
  const variables = Object.fromEntries(
    state.style.split(';').map((p) => {
      const i = p.indexOf(':');
      return [
        p.slice(0, i) === 'color-scheme' ? 'colorScheme' : p.slice(0, i),
        p.slice(i + 1),
      ];
    }),
  );
  return (
    <div
      data-theme={state.theme.id}
      data-mode={state.mode}
      data-mode-preference={state.modePreference}
      data-theme-status={state.status}
      className={`tk-scope ${className}`}
      style={{ ...variables, ...style } as CSSProperties}
    >
      {children}
    </div>
  );
}
export function ThemeLoading({ children }: { children: ReactNode }) {
  return useTheme().status === 'loading' ? <>{children}</> : null;
}
export function ThemeReady({ children }: { children: ReactNode }) {
  return useTheme().status !== 'loading' ? <>{children}</> : null;
}
export function ThemeError({
  children,
}: {
  children: (error: Error, retry: () => Promise<void>) => ReactNode;
}) {
  const state = useTheme(),
    store = useThemeStore();
  return state.error ? <>{children(state.error, store.reload)}</> : null;
}
export function ThemeSwatch({
  theme,
  children = theme.name,
  className = '',
}: {
  theme: Theme;
  children?: ReactNode;
  className?: string;
}) {
  const store = useThemeStore(),
    state = useTheme();
  return (
    <button
      type="button"
      className={className}
      aria-pressed={state.theme.id === theme.id}
      onClick={() => store.setTheme(theme)}
    >
      {children}
    </button>
  );
}
export function useThemeMode() {
  const state = useTheme(), store = useThemeStore();
  return { preference: state.modePreference, resolvedMode: state.mode, ...themeModeActions(store) };
}
export function ThemeMode({ className = '', value, children, labels = { system: 'System', light: 'Light mode', dark: 'Dark mode' } }: {
  className?: string; value?: ModePreference;
  labels?: Record<ModePreference, ReactNode>;
  children?: ReactNode | ((mode: ReturnType<typeof useThemeMode>) => ReactNode);
}) {
  const mode = useThemeMode();
  return <button type="button" className={className} aria-pressed={value ? mode.preference === value : undefined}
    onClick={() => value ? mode.setMode(value) : mode.cycle()}>
    {typeof children === 'function' ? children(mode) : children ?? labels[value ?? mode.preference]}
  </button>;
}
export function ThemeName({ label = 'Theme name', className = '', children }: {
  label?: string; className?: string;
  children?: (value: { name: string; suggestedName: string; setName: ThemeStore['setName'] }) => ReactNode;
}) {
  const state = useTheme(), store = useThemeStore(), suggestion = suggestedThemeName(state.theme);
  if (children) return <>{children({ name: state.theme.name, suggestedName: suggestion, setName: store.setName })}</>;
  return <label className={`tk-name ${className}`}>{label}<input maxLength={200} value={state.theme.name}
    placeholder={suggestion} onBlur={(e) => { if (!e.target.value) store.setName(); }} onChange={(e) => store.setName(e.target.value)} />
    <small>Suggested: {suggestion}</small></label>;
}
export function ThemePalette({
  role = 'primary',
  className = '',
}: {
  role?: Role;
  className?: string;
}) {
  const state = useTheme();
  return (
    <div className={`tk-palette ${className}`}>
      {shades.map((shade) => (
        <div key={shade}>
          <span>{shade}</span>
          <div
            className="tk-shade"
            style={{
              background: `hsl(${state.theme.structure.userPreset[role][shade]})`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
/** Compose your own layout with ColorProvider and useThemeStore().generate if preferred. */
export function ThemeGenerator({
  role = 'primary',
  wheel = false,
  children,
  className = '',
}: {
  children?: ReactNode;
  role?: Role;
  wheel?: boolean;
  className?: string;
}) {
  const state = useTheme(),
    store = useThemeStore();
  return (
    <ColorProvider
      view={wheel ? 'wheel' : 'area'}
      value={channelsToHex(state.theme.structure.userPreset[role].DEFAULT)}
      onChange={(hex) => store.setColor(role, hex)}
    >
      <div className={`tk-generator ${className}`}>
        {children ?? (
          <>
            <ColorViewSelect />
            <ColorSurface />
            <ColorFormatSelect />
            <ColorInput />
            <ColorMode />
          </>
        )}
      </div>
    </ColorProvider>
  );
}
export function ThemeBackground({
  label = 'Tint background with primary',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  const state = useTheme(),
    store = useThemeStore();
  return (
    <label className={`tk-background ${className}`}>
      <input
        type="checkbox"
        checked={state.background === 'tinted'}
        onChange={(e) =>
          store.setBackground(e.target.checked ? 'tinted' : 'neutral')
        }
      />
      {label}
    </label>
  );
}

export const ThemeColor = ThemeGenerator;
export function ThemeHarmony({ label = 'Color harmony' }: { label?: string }) {
  const state = useTheme(),
    store = useThemeStore();
  return (
    <div className="tk-harmony">
      <label>
        {label}
        <select
          value={state.theme.harmony ?? 'analogous'}
          onChange={(e) => store.setHarmony(e.target.value as Harmony)}
        >
          {harmonies.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={() => store.generateHarmony()}>
        Generate accent & secondary
      </button>
    </div>
  );
}
export function ThemeBorder({
  kind = 'width',
  target = 'DEFAULT',
  label,
}: {
  kind?: BorderKind;
  target?: Target;
  label?: string;
}) {
  const state = useTheme(),
    store = useThemeStore(),
    value = state.theme.structure.websitePreset.border[kind][target];
  return (
    <label className="tk-border">
      {label ?? `${target} border ${kind}`}
      <input
        type="number"
        min={0}
        max={1000}
        step={kind === 'width' ? 1 : 0.125}
        value={value}
        onChange={(e) => {
          const n = e.currentTarget.valueAsNumber;
          if (Number.isFinite(n) && n >= 0 && n <= 1000)
            store.setBorder(kind, target, n);
        }}
      />
      {kind === 'width' ? 'px' : 'rem'}
    </label>
  );
}
export function ThemeRadius(
  props: Omit<Parameters<typeof ThemeBorder>[0], 'kind'>,
) {
  return <ThemeBorder {...props} kind="radius" />;
}
export function ThemeBorderWidth(
  props: Omit<Parameters<typeof ThemeBorder>[0], 'kind'>,
) {
  return <ThemeBorder {...props} kind="width" />;
}

const cssObject = (css: string) =>
  Object.fromEntries(
    css.split(';').map((part) => {
      const i = part.indexOf(':');
      return [
        part.slice(0, i).replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
        part.slice(i + 1),
      ];
    }),
  ) as CSSProperties;
export function ThemeWheel({ picker }: { picker: ThemePickerStore }) {
  const state = useSyncExternalStore(
    picker.subscribe,
    picker.getSnapshot,
    picker.getServerSnapshot,
  );
  return (
    <ColorWheel
      className="tk-shared-wheel"
      label="Shared theme color wheel"
      markers={themePickerMarkers(state)}
      activeId={state.activeRole}
      onSelect={(id) => picker.selectRole(id as Role)}
      onMarkerChange={(id, hsv) => picker.setHSV(id as Role, hsv)}
    />
  );
}
export function ThemePicker({
  picker: provided,
  children,
  ...options
}: ThemePickerOptions & { picker?: ThemePickerStore; children?: ReactNode }) {
  const theme = useThemeStore(),
    [picker] = useState(
      () => provided ?? createThemePickerStore(theme, options),
    );
  const state = useSyncExternalStore(
    picker.subscribe,
    picker.getSnapshot,
    picker.getServerSnapshot,
  );
  useEffect(() => picker.mount(), [picker]);
  return (
    <ColorProvider store={picker.activeColor}>
      <div className="tk-picker tk-generator">
        <label className="cp-format">
          Theme picker view
          <select
            value={state.view}
            onChange={(e) => picker.setView(e.target.value as ThemePickerView)}
          >
            {themePickerViews.map((view) => (
              <option key={view} value={view}>
                {view === 'area'
                  ? 'Rectangle'
                  : view === 'wheel'
                    ? 'Wheel'
                    : 'Shared wheel'}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="tk-role-options">
          <legend>Visible roles</legend>
          {allRoles.map((role) => (
            <label key={role}>
              <input
                type="checkbox"
                checked={state.roles.includes(role)}
                disabled={
                  state.roles.length === 1 && state.roles.includes(role)
                }
                onChange={(e) =>
                  picker.setRoles(
                    e.target.checked
                      ? [...state.roles, role]
                      : state.roles.filter((r) => r !== role),
                  )
                }
              />
              {role}
            </label>
          ))}
        </fieldset>
        <div className="tk-role-tabs" aria-label="Active color">
          {state.roles.map((role) => (
            <button
              key={role}
              type="button"
              aria-pressed={state.activeRole === role}
              onClick={() => picker.selectRole(role)}
            >
              <span style={{ background: state.colors[role].hex }} />
              {role}
            </button>
          ))}
        </div>
        {state.view === 'shared-wheel' ? (
          <ThemeWheel picker={picker} />
        ) : state.view === 'wheel' ? (
          <ColorWheel />
        ) : (
          <ColorArea />
        )}
        <p className="tk-editing" aria-live="polite">
          Editing {state.activeRole}
        </p>
        {children ?? (
          <>
            <ColorSlider channel={state.view === 'area' ? 'h' : 'v'} />
            <ColorFormatSelect />
            <ColorInput />
            <ColorMode />
          </>
        )}
      </div>
    </ColorProvider>
  );
}

export function ThemeSelect({
  themes,
  label = 'Saved themes',
  className = '',
}: {
  themes: readonly Theme[];
  label?: string;
  className?: string;
}) {
  const store = useThemeStore(),
    state = useTheme(),
    list = themeList(themes),
    value = selectedThemeId(state.theme, list) ?? '';
  return (
    <label className={`cp-format tk-select ${className}`}>
      {label}
      <select
        value={value}
        disabled={!list.length}
        onChange={(e) => {
          const theme = list.find((theme) => theme.id === e.target.value);
          if (theme) store.setTheme(theme);
        }}
      >
        <option value="" disabled>
          {list.length ? 'Custom theme' : 'No themes available'}
        </option>
        {list.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name}
          </option>
        ))}
      </select>
    </label>
  );
}
export function ThemeExport({
  format = 'json',
  selection,
  onChange,
  children,
  className = '',
}: {
  format?: ThemeExportFormat;
  selection?: TokenSelection;
  onChange?: (configuration: ThemeConfiguration) => void;
  children?: (configuration: ThemeConfiguration) => ReactNode;
  className?: string;
}) {
  const state = useTheme(),
    configuration = themeConfiguration(state, selection),
    selectionKey = JSON.stringify(selection),
    callback = useRef(onChange);
  callback.current = onChange;
  useEffect(
    () => callback.current?.(themeConfiguration(state, selection)),
    [state.theme, state.mode, state.modePreference, state.systemMode, selectionKey],
  );
  return children ? (
    <>{children(configuration)}</>
  ) : (
    <pre className={`tk-export ${className}`} aria-label="Theme configuration">
      {configuration[format]}
    </pre>
  );
}
