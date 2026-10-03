'use client';
import { selectedThemeId, themeList, type Theme } from '../core';
import { useTheme, useThemeStore } from './context';
export function ThemeSelect({
  themes,
  label = 'Saved themes',
  className = '',
}: {
  themes: readonly Theme[];
  label?: string;
  className?: string;
}) {
  const store = useThemeStore(),
    state = useTheme(),
    list = themeList(themes),
    value = selectedThemeId(state.theme, list) ?? '';
  return (
    <label className={`cp-format tk-select ${className}`}>
      {label}
      <select
        value={value}
        disabled={!list.length}
        onChange={(e) => {
          const theme = list.find((theme) => theme.id === e.target.value);
          if (theme) store.setTheme(theme);
        }}
      >
        <option value="" disabled>
          {list.length ? 'Custom theme' : 'No themes available'}
        </option>
        {list.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name}
          </option>
        ))}
      </select>
    </label>
  );
}
