import {
  roles,
  targets,
  type Theme,
  type ThemeSnapshot,
  type Mode,
  type ModePreference,
  type Role,
  type Target,
  type Palette,
} from './types';
import { themeVariables, parseTheme } from './theme';
import { selectThemeTokens, type TokenSelection } from './editor';
export interface SelectedTheme {
  readonly id: string;
  readonly name: string;
  readonly nameSource?: Theme['nameSource'];
  readonly backgroundMode?: Theme['backgroundMode'];
  readonly structure: {
    readonly userPreset?: Readonly<Partial<Record<Role, Palette>>>;
    readonly websitePreset?: {
      readonly background?: Readonly<Partial<Record<Mode, string>>>;
      readonly foreground?: Readonly<Partial<Record<Mode, string>>>;
      readonly border?: Readonly<
        Partial<
          Record<'width' | 'radius', Readonly<Partial<Record<Target, number>>>>
        >
      >;
    };
  };
}
export interface ThemeConfiguration {
  /** Only selected fields when an export selection is configured. */
  readonly theme: SelectedTheme;
  /** Complete internal context for application rendering, not serialized in JSON. */
  readonly sourceTheme: Theme;
  readonly mode: Mode;
  readonly modePreference: ModePreference;
  readonly systemMode: Mode;
  readonly tokens: Readonly<Record<string, string>>;
  readonly css: string;
  /** Selected theme fields and mode. Merge partial exports with mergeThemeConfiguration(). */
  readonly json: string;
}
export type ThemeExportFormat = 'json' | 'css';
const configurations = new WeakMap<Theme, Map<string, ThemeConfiguration>>();
export function themeConfiguration(
  state: ThemeSnapshot,
  selection?: TokenSelection,
): ThemeConfiguration {
  selection ??= state.selection;
  const key = JSON.stringify([
    state.mode,
    state.modePreference,
    state.systemMode,
    selection,
  ]);
  const existing = configurations.get(state.theme)?.get(key);
  if (existing) return existing;
  const tokens = selection
    ? selectThemeTokens(state.theme, { mode: state.mode, ...selection })
    : Object.freeze(themeVariables(state.theme, state.mode));
  const theme = selection
    ? selectedTheme(state.theme, { mode: state.mode, ...selection })
    : state.theme;
  const mode = selection
    ? (selection.mode ?? state.mode)
    : state.modePreference;
  const result = Object.freeze({
    theme,
    sourceTheme: state.theme,
    mode: state.mode,
    modePreference: state.modePreference,
    systemMode: state.systemMode,
    tokens,
    css: Object.entries(tokens)
      .map(([key, value]) => `${key}:${value}`)
      .join(';'),
    json: JSON.stringify(
      {
        theme,
        mode,
        ...(!selection || (selection.modes?.length ?? 1) > 1
          ? { mode: state.modePreference, systemMode: state.systemMode }
          : {}),
      },
      null,
      2,
    ),
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
function selectedTheme(theme: Theme, selection: TokenSelection): SelectedTheme {
  const userPreset: Partial<Record<Role, Palette>> = {};
  for (const role of selection.roles ?? ['primary'])
    userPreset[role] = theme.structure.userPreset[role];
  const websitePreset: NonNullable<
    SelectedTheme['structure']['websitePreset']
  > = {
    ...(selection.background
      ? {
          background: Object.freeze(
            Object.fromEntries(
              (selection.modes ?? [selection.mode ?? 'light']).map((mode) => [
                mode,
                theme.structure.websitePreset.background[mode],
              ]),
            ),
          ),
          foreground: Object.freeze(
            Object.fromEntries(
              (selection.modes ?? [selection.mode ?? 'light']).map((mode) => [
                mode,
                theme.structure.websitePreset.foreground[mode],
              ]),
            ),
          ),
        }
      : {}),
    ...(selection.radius?.length || selection.width?.length
      ? {
          border: Object.freeze(
            Object.fromEntries(
              (['radius', 'width'] as const)
                .filter((kind) => selection[kind]?.length)
                .map((kind) => [
                  kind,
                  Object.freeze(
                    Object.fromEntries(
                      selection[kind]!.map((target) => [
                        target,
                        theme.structure.websitePreset.border[kind][target],
                      ]),
                    ),
                  ),
                ]),
            ),
          ),
        }
      : {}),
  };
  if (
    selection.modes?.some((mode) => mode !== 'light' && mode !== 'dark') ||
    selection.modes?.length === 0
  )
    throw new TypeError('Select one or both appearance modes');
  return Object.freeze({
    id: theme.id,
    name: theme.name,
    nameSource: theme.nameSource,
    ...(selection.background ? { backgroundMode: theme.backgroundMode } : {}),
    structure: Object.freeze({
      ...(Object.keys(userPreset).length
        ? { userPreset: Object.freeze(userPreset) }
        : {}),
      ...(Object.keys(websitePreset).length
        ? { websitePreset: Object.freeze(websitePreset) }
        : {}),
    }),
  });
}
/** Applies a selected export over a full theme, validating the merged result. */
export function mergeThemeConfiguration(
  base: Theme,
  value: string | { theme: SelectedTheme },
): Theme {
  const saved = typeof value === 'string' ? JSON.parse(value) : value;
  const patch = saved.theme;
  if (!patch || typeof patch !== 'object' || !patch.structure)
    throw new TypeError('Invalid theme configuration');
  const color = patch.structure.userPreset ?? {},
    web = patch.structure.websitePreset ?? {},
    border = web.border ?? {};
  if (
    Object.keys(color).some((key) => !roles.includes(key as Role)) ||
    Object.keys(border).some((key) => !['radius', 'width'].includes(key)) ||
    Object.values(border).some((fields) =>
      Object.keys(fields as object).some(
        (key) => !targets.includes(key as Target),
      ),
    )
  )
    throw new TypeError('Invalid theme configuration fields');
  return parseTheme({
    ...base,
    ...patch,
    structure: {
      userPreset: { ...base.structure.userPreset, ...color },
      websitePreset: {
        ...base.structure.websitePreset,
        ...web,
        foreground: {
          ...base.structure.websitePreset.foreground,
          ...web.foreground,
        },
        background: {
          ...base.structure.websitePreset.background,
          ...web.background,
        },
        border: {
          radius: {
            ...base.structure.websitePreset.border.radius,
            ...border.radius,
          },
          width: {
            ...base.structure.websitePreset.border.width,
            ...border.width,
          },
        },
      },
    },
  });
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
