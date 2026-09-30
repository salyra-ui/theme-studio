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
  readonly mode: Mode;
  readonly modePreference: ModePreference;
  readonly systemMode: Mode;
  readonly background: BackgroundMode;
  readonly status: 'loading' | 'ready' | 'fallback';
  readonly pending: boolean;
  readonly error: Error | null;
  readonly style: string;
}
export interface ThemeStorage {
  read(): unknown | Promise<unknown>;
  write(theme: Theme): void | Promise<void>;
  /** Same-origin cache notifications; mounted adapters apply valid remote values. */
  subscribe?(listener: (value: unknown) => void): () => void;
}
export interface ThemeOptions {
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
export interface ThemeStore {
  getSnapshot(): ThemeSnapshot;
  getServerSnapshot(): ThemeSnapshot;
  subscribe(listener: () => void): () => void;
  start(): Promise<void>;
  reload(): Promise<void>;
  stop(): void;
  setTheme(theme: Theme): void;
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
