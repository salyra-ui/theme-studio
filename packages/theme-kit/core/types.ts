export const shades = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;
export const roles = ['primary', 'secondary', 'accent'] as const;
export const harmonies = [
  'analogous',
  'triadic',
  'split-complementary',
] as const;
export type Harmony = (typeof harmonies)[number];
export type BorderKind = 'width' | 'radius';
export const targets = [
  'DEFAULT',
  'input',
  'card',
  'popover',
  'button',
  'table',
  'picker',
] as const;
export type Shade = (typeof shades)[number];
export type Role = (typeof roles)[number];
export type Target = (typeof targets)[number];
export type Mode = 'light' | 'dark';
export const modePreferences = ['system', 'light', 'dark'] as const;
export type ModePreference = (typeof modePreferences)[number];
export interface ModeStorage {
  read(): unknown;
  write(mode: ModePreference): void;
  subscribe?(listener: (value: unknown) => void): () => void;
}
export type BackgroundMode = 'neutral' | 'tinted' | 'preserve';
/** HSL channels, e.g. "210 60% 50%", compatible with the original Tailwind theme. */
export type Palette = Readonly<
  Record<Shade | 'DEFAULT' | 'foreground', string>
>;
export interface ThemeStructure {
  readonly userPreset: Readonly<Record<Role, Palette>>;
  readonly websitePreset: {
    readonly foreground: Readonly<Record<Mode, string>>;
    readonly background: Readonly<Record<Mode, string>>;
    readonly border: Readonly<
      Record<'width' | 'radius', Readonly<Record<Target, number>>>
    >;
  };
}
export interface Theme {
  readonly id: string;
  readonly name: string;
  readonly nameSource?: 'suggested' | 'custom';
  readonly backgroundMode?: BackgroundMode;
  readonly harmony?: Harmony;
  readonly structure: ThemeStructure;
}
export interface ThemeSnapshot {
  readonly theme: Theme;
  readonly disabled: boolean;
  readonly mode: Mode;
  readonly modePreference: ModePreference;
  readonly systemMode: Mode;
  readonly background: BackgroundMode;
  readonly status: 'loading' | 'ready' | 'fallback';
  readonly pending: boolean;
  readonly error: Error | null;
  readonly style: string;
  readonly selection?: import('./editor').TokenSelection;
}
export interface ThemeStorage {
  read(): unknown | Promise<unknown>;
  write(theme: Theme): void | Promise<void>;
  /** Same-origin cache notifications; mounted adapters apply valid remote values. */
  subscribe?(listener: (value: unknown) => void): () => void;
}
export interface ThemeOptions {
  disabled?: boolean;
  /** Shared export selection, also used during server rendering. */
  selection?: import('./editor').TokenSelection;
  theme?: Theme;
  fallbackTheme?: Theme;
  mode?: ModePreference;
  /** Deterministic SSR seed when preference is system. */
  systemMode?: Mode;
  /** Default: localStorage under theme-kit:mode. false disables persistence. */
  modeStorage?: ModeStorage | false;
  background?: Exclude<BackgroundMode, 'preserve'>;
  loadTheme?: (signal: AbortSignal) => unknown | Promise<unknown>;
  storage?: ThemeStorage;
  revalidateOnFocus?: boolean;
  revalidateIntervalMs?: number;
  /** Bounds a loader that never resolves; 10 seconds by default. */
  timeoutMs?: number;
}
export interface ThemeFieldRegistration {
  update(selection: import('./editor').TokenSelection): void;
  destroy(): void;
}
export interface ThemeStore {
  /** Mounted editor parts register their fields. Explicit selections take priority. */
  registerFields(
    selection: import('./editor').TokenSelection,
  ): ThemeFieldRegistration;
  getSnapshot(): ThemeSnapshot;
  getServerSnapshot(): ThemeSnapshot;
  subscribe(listener: () => void): () => void;
  start(): Promise<void>;
  reload(): Promise<void>;
  stop(): void;
  setDisabled(disabled: boolean): void;
  setTheme(theme: Theme): void;
  setSelection(selection: import('./editor').TokenSelection): void;
  setMode(mode: ModePreference): void;
  setSystemMode(mode: Mode): void;
  setName(name?: string): void;
  setBackground(mode: Exclude<BackgroundMode, 'preserve'>): void;
  generate(
    seed: string,
    options?: { roles?: readonly Role[]; harmony?: Harmony; name?: string },
  ): void;
  setColor(role: Role, hex: string): void;
  setHarmony(harmony: Harmony): void;
  generateHarmony(): void;
  setBorder(kind: BorderKind, target: Target, value: number): void;
}

export interface PaletteClasses {
  root?: string;
  item?: string;
  swatch?: string;
  label?: string;
}
export interface PaletteOptions {
  shape?: 'square' | 'circle' | 'joined';
  classes?: PaletteClasses;
  labels?: Readonly<Partial<Record<Shade, string>>>;
  shadeClasses?: Readonly<Partial<Record<Shade, string>>>;
}
