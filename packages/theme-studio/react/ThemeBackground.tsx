'use client';
import { useEffect } from 'react';
import { useTheme, useThemeStore } from './context';
export function ThemeBackground({
  label = 'Tint background with primary',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  const state = useTheme(),
    store = useThemeStore();
  useEffect(() => {
    const fields = store.registerFields({ roles: [], background: true });
    return fields.destroy;
  }, [store]);
  return (
    <label className={`tk-background ${className}`}>
      <input
        type="checkbox"
        checked={state.background === 'tinted'}
        onChange={(e) =>
          store.setBackground(e.target.checked ? 'tinted' : 'neutral')
        }
      />
      {label}
    </label>
  );
}
