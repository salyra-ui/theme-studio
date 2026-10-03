'use client';
import { channelsToHex } from '@salyra-ui/color-picker';
import {
  ColorFormatSelect,
  ColorInput,
  ColorMode,
  ColorProvider,
  ColorSurface,
  ColorViewSelect,
} from '@salyra-ui/color-picker/react';
import { useEffect, type ReactNode } from 'react';
import { type Role } from '../core';
import { useTheme, useThemeStore } from './context';
/** Compose your own layout with ColorProvider and useThemeStore().generate if preferred. */
export function ThemeGenerator({
  role = 'primary',
  wheel = false,
  disabled = false,
  children,
  className = '',
}: {
  children?: ReactNode;
  role?: Role;
  wheel?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const state = useTheme(),
    store = useThemeStore();
  useEffect(() => {
    const fields = store.registerFields({ roles: [role] });
    return fields.destroy;
  }, [store, role]);
  return (
    <ColorProvider
      disabled={disabled || state.disabled}
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
