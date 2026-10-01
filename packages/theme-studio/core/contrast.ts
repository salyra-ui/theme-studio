import {
  channelsToHex,
  colorContrast,
  type ContrastResult,
} from '@salyra-ui/color-picker';
import { themeColor } from './editor';
import { roles, type Role, type ThemeSnapshot } from './types';
/** Check a role's text against its surface without changing the theme. */
export function themeContrast(
  state: ThemeSnapshot,
  role: Role = 'primary',
): ContrastResult {
  if (!roles.includes(role)) throw new TypeError('Invalid contrast role');
  return colorContrast(
    channelsToHex(state.theme.structure.userPreset[role].foreground),
    themeColor(state.theme, role),
  );
}
