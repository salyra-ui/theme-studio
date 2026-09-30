import type { Theme, ThemeSnapshot, Mode, ModePreference } from './types';
import { themeVariables, parseTheme } from './theme';
import { selectThemeTokens, type TokenSelection } from './editor';
export interface ThemeConfiguration {
  readonly theme: Theme;
  readonly mode: Mode;
  readonly modePreference: ModePreference;
  readonly systemMode: Mode;
  readonly tokens: Readonly<Record<string, string>>;
  readonly css: string;
  /** Round-trippable theme + selected mode, suitable for saving to an API. */
  readonly json: string;
}
export type ThemeExportFormat = 'json' | 'css';
const configurations = new WeakMap<Theme, Map<string, ThemeConfiguration>>();
export function themeConfiguration(
  state: ThemeSnapshot,
  selection?: TokenSelection,
): ThemeConfiguration {
  const key = JSON.stringify([state.mode, state.modePreference, state.systemMode, selection]);
  const existing = configurations.get(state.theme)?.get(key);
  if (existing) return existing;
  const tokens = selection
    ? selectThemeTokens(state.theme, { mode: state.mode, ...selection })
    : Object.freeze(themeVariables(state.theme, state.mode));
  const result = Object.freeze({
    theme: state.theme,
    mode: state.mode,
    modePreference: state.modePreference,
    systemMode: state.systemMode,
    tokens,
    css: Object.entries(tokens)
      .map(([key, value]) => `${key}:${value}`)
      .join(';'),
    json: JSON.stringify({ theme: state.theme, mode: state.modePreference, systemMode: state.systemMode }, null, 2),
  });
  if (Object.isFrozen(state.theme)) {
    const cache =
      configurations.get(state.theme) ?? new Map<string, ThemeConfiguration>();
    if (cache.size >= 16) cache.delete(cache.keys().next().value!);
    cache.set(key, result);
    configurations.set(state.theme, cache);
  }
  return result;
}
/** A list may change over time; validate IDs so selection is unambiguous. */
export function themeList(themes: readonly Theme[]): readonly Theme[] {
  const result = themes.map(parseTheme);
  if (new Set(result.map((theme) => theme.id)).size !== result.length)
    throw new TypeError('Theme list IDs must be unique');
  return Object.freeze(result);
}
export function selectedThemeId(
  theme: Theme,
  themes: readonly Theme[],
): string | undefined {
  const candidate = themes.find((value) => value.id === theme.id);
  return candidate && JSON.stringify(candidate) === JSON.stringify(theme)
    ? candidate.id
    : undefined;
}
