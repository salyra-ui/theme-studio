import {
  channelsToHex,
  getColorName,
  normalizeHex,
} from '@sebytza23/color-picker';
import {
  generatePalette,
  generateBackground,
  parseTheme,
  themeVariables,
  generateTheme,
} from './theme';
import {
  roles,
  targets,
  type Role,
  type Theme,
  type Target,
  type BorderKind,
  type Mode,
  type Harmony,
} from './types';

/** Updates one palette. Manually selected sibling colors remain untouched. */
export function withThemeColor(theme: Theme, role: Role, input: string): Theme {
  if (!roles.includes(role)) throw new TypeError('Invalid role');
  const hex = normalizeHex(input),
    primary = role === 'primary';
  return parseTheme({
    ...theme,
    ...(primary
      ? {
          id: `custom-${hex.slice(1).toLowerCase()}`,
          name: theme.nameSource === 'custom' ? theme.name : getColorName(hex),
          nameSource: theme.nameSource === 'custom' ? 'custom' : 'suggested',
        }
      : {}),
    structure: {
      userPreset: {
        ...theme.structure.userPreset,
        [role]: generatePalette(hex),
      },
      websitePreset: {
        ...theme.structure.websitePreset,
        ...(primary &&
        theme.backgroundMode &&
        theme.backgroundMode !== 'preserve'
          ? generateBackground(hex, theme.backgroundMode)
          : {}),
      },
    },
  });
}
export function withThemeBorder(
  theme: Theme,
  kind: BorderKind,
  target: Target,
  value: number,
): Theme {
  if (
    !['width', 'radius'].includes(kind) ||
    !targets.includes(target) ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1000
  )
    throw new TypeError('Invalid border value');
  const web = theme.structure.websitePreset;
  return parseTheme({
    ...theme,
    structure: {
      ...theme.structure,
      websitePreset: {
        ...web,
        border: {
          ...web.border,
          [kind]: { ...web.border[kind], [target]: value },
        },
      },
    },
  });
}
export function themeColor(theme: Theme, role: Role): string {
  if (!roles.includes(role)) throw new TypeError('Invalid role');
  return channelsToHex(theme.structure.userPreset[role].DEFAULT);
}
export interface TokenSelection {
  /** Omitted means primary only; [] exports no color palettes. */
  roles?: readonly Role[];
  width?: readonly Target[];
  radius?: readonly Target[];
  background?: boolean;
  mode?: Mode;
  /** Background modes included in JSON. Defaults to the resolved active mode. */
  modes?: readonly Mode[];
}
/** Exports exactly the requested tokens, without unrelated colors/borders. */
export function selectThemeTokens(
  theme: Theme,
  selection: TokenSelection = {},
): Readonly<Record<string, string>> {
  if (
    selection.mode !== undefined &&
    !['light', 'dark'].includes(selection.mode)
  )
    throw new TypeError('Invalid export mode');
  const all = themeVariables(theme, selection.mode),
    result: Record<string, string> = {};
  for (const role of selection.roles ?? ['primary']) {
    if (!roles.includes(role)) throw new TypeError('Invalid role');
    for (const [key, value] of Object.entries(all))
      if (key === `--${role}` || key.startsWith(`--${role}-`))
        result[key] = value;
  }
  for (const kind of ['width', 'radius'] as const)
    for (const target of selection[kind] ?? []) {
      if (!targets.includes(target)) throw new TypeError('Invalid target');
      const key = `--border-${kind}${target === 'DEFAULT' ? '' : `-${target}`}`;
      result[key] = all[key];
    }
  if (selection.background)
    for (const key of ['--background', '--foreground', 'color-scheme'])
      result[key] = all[key];
  return Object.freeze(result);
}
export function generateThemeTokens(
  seed: string,
  options: TokenSelection & { harmony?: Harmony } = {},
): Readonly<Record<string, string>> {
  return selectThemeTokens(
    generateTheme(seed, { harmony: options.harmony }),
    options,
  );
}

export function suggestedThemeName(theme: Theme): string {
  return getColorName(themeColor(theme, 'primary'));
}
export function withThemeName(theme: Theme, name?: string): Theme {
  return parseTheme({
    ...theme,
    name: name ?? suggestedThemeName(theme),
    nameSource: name === undefined ? 'suggested' : 'custom',
  });
}
