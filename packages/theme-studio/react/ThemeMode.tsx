'use client';
import { type ReactNode } from 'react';
import { type ModePreference } from '../core';
import { useThemeMode } from './useThemeMode';
export function ThemeMode({
  className = '',
  value,
  children,
  labels = { system: 'System', light: 'Light mode', dark: 'Dark mode' },
}: {
  className?: string;
  value?: ModePreference;
  labels?: Record<ModePreference, ReactNode>;
  children?: ReactNode | ((mode: ReturnType<typeof useThemeMode>) => ReactNode);
}) {
  const mode = useThemeMode();
  return (
    <button
      type="button"
      className={className}
      aria-pressed={value ? mode.preference === value : undefined}
      onClick={() => (value ? mode.setMode(value) : mode.cycle())}
    >
      {typeof children === 'function'
        ? children(mode)
        : (children ?? labels[value ?? mode.preference])}
    </button>
  );
}
