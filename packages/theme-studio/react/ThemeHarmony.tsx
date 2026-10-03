'use client';
import { harmonies, type Harmony } from '../core';
import { useTheme, useThemeStore } from './context';
export function ThemeHarmony({ label = 'Color harmony' }: { label?: string }) {
  const state = useTheme(),
    store = useThemeStore();
  return (
    <div className="tk-harmony">
      <label>
        {label}
        <select
          value={state.theme.harmony ?? 'analogous'}
          onChange={(e) => store.setHarmony(e.target.value as Harmony)}
        >
          {harmonies.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={() => store.generateHarmony()}>
        Generate accent & secondary
      </button>
    </div>
  );
}
