import {
  hexToOklch,
  oklchToHex,
  channelsToHex,
  foreground,
  hexToHsv,
  hsvToChannels,
  normalizeHex,
  hue,
  getColorName,
} from '@salyra-ui/color-picker';
import {
  roles,
  harmonies,
  type Harmony,
  shades,
  targets,
  type BackgroundMode,
  type Theme,
  type Palette,
  type Role,
  type ThemeStructure,
  type Mode,
} from './types';

export function generatePalette(seed: string): Palette {
  const hsv = hexToHsv(seed);
  const result: Record<string, string> = {};
  // Preserve the original tint/shade progression without turning gray shadows red.
  const light = [0.95, 0.9, 0.75, 0.6, 0.3],
    dark = [0.1, 0.25, 0.4, 0.55, 0.71];
  for (const [i, shade] of shades.entries()) {
    const amount = i < 5 ? light[i] : i > 5 ? dark[i - 6] : 0;
    result[shade] = hsvToChannels(
      i < 5
        ? {
            h: hsv.h,
            s: hsv.s * (1 - amount),
            v: hsv.v + (100 - hsv.v) * amount,
          }
        : { h: hsv.h, s: hsv.s, v: hsv.v * (1 - amount) },
    );
  }
  result.DEFAULT = result[500];
  result.foreground = foreground(seed);
  return Object.freeze(result) as Palette;
}
export function generateTheme(
  seed: string,
  options: {
    id?: string;
    name?: string;
    base?: Theme;
    background?: BackgroundMode;
    roles?: readonly Role[];
    harmony?: Harmony;
  } = {},
): Theme {
  seed = normalizeHex(seed);
  const harmony = options.harmony ?? options.base?.harmony ?? 'analogous';
  if (!harmonies.includes(harmony)) throw new TypeError('Invalid harmony');
  const selected = options.roles ?? roles;
  if (selected.some((role) => !roles.includes(role)))
    throw new TypeError('Invalid role');
  const colors = harmonyColors(seed, harmony);
  const userPreset = Object.fromEntries(
    roles.map((role) => [
      role,
      options.base && !selected.includes(role)
        ? options.base.structure.userPreset[role]
        : generatePalette(colors[role]),
    ]),
  ) as Record<Role, Palette>;
  let websitePreset = options.base?.structure.websitePreset ?? {
    foreground: { light: '0 0% 10%', dark: '0 0% 98%' },
    background: { light: '0 0% 100%', dark: '0 0% 8%' },
    border: {
      width: Object.fromEntries(targets.map((t) => [t, 1])),
      radius: Object.fromEntries(targets.map((t) => [t, 0.5])),
    },
  };
  const backgroundMode =
    options.background ??
    options.base?.backgroundMode ??
    (options.base ? 'preserve' : 'neutral');
  if (
    backgroundMode !== 'preserve' &&
    (!options.base || selected.includes('primary'))
  )
    websitePreset = {
      ...websitePreset,
      ...generateBackground(seed, backgroundMode),
    };
  return parseTheme({
    backgroundMode,
    harmony,
    id: options.id ?? `custom-${seed.slice(1).toLowerCase()}`,
    name:
      options.name ??
      (options.base?.nameSource === 'custom'
        ? options.base.name
        : getColorName(seed)),
    nameSource:
      options.name !== undefined || options.base?.nameSource === 'custom'
        ? 'custom'
        : 'suggested',
    structure: { userPreset, websitePreset },
  });
}
const object = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== 'object' || Array.isArray(v))
    throw new TypeError('Expected theme object');
  return v as Record<string, unknown>;
};
function channels(v: unknown): string {
  if (
    typeof v !== 'string' ||
    !/^\d+(?:\.\d+)? \d+(?:\.\d+)?% \d+(?:\.\d+)?%$/.test(v)
  )
    throw new TypeError('Invalid HSL channels');
  const [h, s, l] = v.replace(/%/g, '').split(' ').map(Number);
  if (h > 360 || s > 100 || l > 100)
    throw new TypeError('HSL channel out of range');
  return v;
}
/** Validate, copy and freeze at trust boundaries; strip unknown keys. */
export function parseTheme(value: unknown): Theme {
  const t = object(value);
  if (
    t.schemaVersion !== undefined &&
    t.schemaVersion !== 0 &&
    t.schemaVersion !== 1
  )
    throw new TypeError('Unsupported theme schema version');
  if (
    typeof t.id !== 'string' ||
    !t.id.length ||
    t.id.length > 128 ||
    typeof t.name !== 'string' ||
    t.name.length > 200
  )
    throw new TypeError('Invalid theme identity');
  if (
    t.backgroundMode !== undefined &&
    !['neutral', 'tinted', 'preserve'].includes(String(t.backgroundMode))
  )
    throw new TypeError('Invalid background mode');
  if (t.harmony !== undefined && !harmonies.includes(t.harmony as Harmony))
    throw new TypeError('Invalid harmony');
  if (
    t.nameSource !== undefined &&
    !['suggested', 'custom'].includes(String(t.nameSource))
  )
    throw new TypeError('Invalid theme name source');
  const structure = object(t.structure),
    user = object(structure.userPreset),
    web = object(structure.websitePreset),
    border = object(web.border);
  const userPreset = Object.fromEntries(
    roles.map((role) => {
      const p = object(user[role]);
      return [
        role,
        Object.freeze(
          Object.fromEntries(
            [...shades, 'DEFAULT', 'foreground'].map((key) => [
              key,
              channels(p[key]),
            ]),
          ),
        ),
      ];
    }),
  );
  const layers = Object.fromEntries(
    ['foreground', 'background'].map((layer) => {
      const p = object(web[layer]);
      return [
        layer,
        Object.freeze({ light: channels(p.light), dark: channels(p.dark) }),
      ];
    }),
  );
  const borders = Object.fromEntries(
    ['width', 'radius'].map((kind) => {
      const p = object(border[kind]);
      return [
        kind,
        Object.freeze(
          Object.fromEntries(
            targets.map((key) => {
              const n = p[key];
              if (
                typeof n !== 'number' ||
                !Number.isFinite(n) ||
                n < 0 ||
                n > 1000
              )
                throw new TypeError('Invalid border value');
              return [key, n];
            }),
          ),
        ),
      ];
    }),
  );
  return Object.freeze({
    schemaVersion: 1,
    id: t.id,
    name: t.name,
    ...(t.nameSource !== undefined ? { nameSource: t.nameSource } : {}),
    ...(t.harmony !== undefined ? { harmony: t.harmony } : {}),
    ...(t.backgroundMode !== undefined
      ? { backgroundMode: t.backgroundMode }
      : {}),
    structure: Object.freeze({
      userPreset: Object.freeze(userPreset),
      websitePreset: Object.freeze({
        ...layers,
        border: Object.freeze(borders),
      }),
    }),
  }) as unknown as Theme;
}
/** Import an existing MyUniversity /v1/theme record, including JSON Structure. */
export function fromLegacyTheme(value: unknown): Theme {
  const t = object(value);
  return parseTheme({
    id: t.ThemeID,
    name: t.Name,
    structure:
      typeof t.Structure === 'string' ? JSON.parse(t.Structure) : t.Structure,
  });
}
export function toLegacyTheme(theme: Theme): {
  ThemeID: string;
  Name: string;
  Structure: ThemeStructure;
} {
  return { ThemeID: theme.id, Name: theme.name, Structure: theme.structure };
}
export function themeVariables(
  theme: Theme,
  mode: Mode = 'light',
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const role of roles)
    for (const key of [...shades, 'DEFAULT', 'foreground'] as const)
      result[`--${role}${key === 'DEFAULT' ? '' : `-${key}`}`] =
        theme.structure.userPreset[role][key];
  const p = theme.structure.websitePreset;
  for (const kind of ['width', 'radius'] as const)
    for (const target of targets)
      result[`--border-${kind}${target === 'DEFAULT' ? '' : `-${target}`}`] =
        `${p.border[kind][target]}${kind === 'width' ? 'px' : 'rem'}`;
  result['--foreground'] = p.foreground[mode];
  result['--background'] = p.background[mode];
  result['color-scheme'] = mode;
  return result;
}
export function themeStyle(theme: Theme, mode: Mode = 'light'): string {
  return Object.entries(themeVariables(theme, mode))
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
}
export const defaultTheme = generateTheme('#6366F1', {
  id: 'default',
  name: 'Indigo',
});

/** Subtle primary hue in both surfaces, gamut-mapped to sRGB for legacy HSL tokens. */
export function generateBackground(
  seed: string,
  mode: Exclude<BackgroundMode, 'preserve'>,
): Pick<ThemeStructure['websitePreset'], 'background' | 'foreground'> {
  if (mode !== 'neutral' && mode !== 'tinted')
    throw new TypeError('Invalid background mode');
  if (mode === 'neutral')
    return {
      background: { light: '0 0% 100%', dark: '0 0% 8%' },
      foreground: { light: '0 0% 10%', dark: '0 0% 98%' },
    };
  const color = hexToOklch(seed);
  const channels = (l: number, c: number) =>
    hsvToChannels(hexToHsv(oklchToHex({ l, c, h: color.h })));
  return {
    background: {
      light: channels(0.985, Math.min(color.c * 0.08, 0.012)),
      dark: channels(0.145, Math.min(color.c * 0.16, 0.025)),
    },
    foreground: { light: '0 0% 10%', dark: '0 0% 98%' },
  };
}
export function withThemeBackground(
  theme: Theme,
  mode: Exclude<BackgroundMode, 'preserve'>,
): Theme {
  return parseTheme({
    ...theme,
    backgroundMode: mode,
    structure: {
      ...theme.structure,
      websitePreset: {
        ...theme.structure.websitePreset,
        ...generateBackground(
          channelsToHex(theme.structure.userPreset.primary.DEFAULT),
          mode,
        ),
      },
    },
  });
}

/** Hue-wheel harmonies, retaining the primary saturation and brightness. */
export function harmonyColors(
  seed: string,
  harmony: Harmony = 'analogous',
): Record<Role, string> {
  if (!harmonies.includes(harmony)) throw new TypeError('Invalid harmony');
  const color = hexToHsv(seed);
  const offsets = {
    analogous: [-30, 30],
    triadic: [120, 240],
    'split-complementary': [150, 210],
  }[harmony];
  const rotate = (offset: number) =>
    channelsToHex(hsvToChannels({ ...color, h: hue(color.h + offset) }));
  return {
    primary: normalizeHex(seed),
    secondary: rotate(offsets[0]),
    accent: rotate(offsets[1]),
  };
}
