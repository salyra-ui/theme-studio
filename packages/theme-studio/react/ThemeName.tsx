'use client';
import { type ReactNode } from 'react';
import { suggestedThemeName, type ThemeStore } from '../core';
import { useTheme, useThemeStore } from './context';
export function ThemeName({
  label = 'Theme name',
  className = '',
  children,
}: {
  label?: string;
  className?: string;
  children?: (value: {
    name: string;
    suggestedName: string;
    setName: ThemeStore['setName'];
  }) => ReactNode;
}) {
  const state = useTheme(),
    store = useThemeStore(),
    suggestion = suggestedThemeName(state.theme);
  if (children)
    return (
      <>
        {children({
          name: state.theme.name,
          suggestedName: suggestion,
          setName: store.setName,
        })}
      </>
    );
  return (
    <label className={`tk-name ${className}`}>
      {label}
      <input
        maxLength={200}
        value={state.theme.name}
        placeholder={suggestion}
        onBlur={(e) => {
          if (!e.target.value) store.setName();
        }}
        onChange={(e) => store.setName(e.target.value)}
      />
      <small>Suggested: {suggestion}</small>
    </label>
  );
}
