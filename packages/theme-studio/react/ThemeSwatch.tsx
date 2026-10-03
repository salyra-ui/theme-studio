'use client';
import { type ReactNode } from 'react';
import { type Theme } from '../core';
import { useTheme, useThemeStore } from './context';
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
