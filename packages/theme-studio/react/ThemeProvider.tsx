'use client';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
  createThemeStore,
  mountThemeStore,
  type ThemeOptions,
  type ThemeStore,
} from '../core';
import { Context, useTheme } from './context';
/** Options initialize this provider. Use store.setTheme for subsequent changes. */
export function ThemeProvider({
  children,
  className = '',
  style,
  store: provided,
  ...options
}: ThemeOptions & {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  store?: ThemeStore;
}) {
  const [initial] = useState(options);
  const [store] = useState(() => provided ?? createThemeStore(initial));
  useEffect(
    () => mountThemeStore(store, initial.storage, initial),
    [store, initial],
  );
  return (
    <Context.Provider value={store}>
      <ThemeScope className={className} style={style}>
        {children}
      </ThemeScope>
    </Context.Provider>
  );
}

function ThemeScope({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className: string;
  style?: CSSProperties;
}) {
  const state = useTheme();
  const variables = Object.fromEntries(
    state.style.split(';').map((p) => {
      const i = p.indexOf(':');
      return [
        p.slice(0, i) === 'color-scheme' ? 'colorScheme' : p.slice(0, i),
        p.slice(i + 1),
      ];
    }),
  );
  return (
    <div
      data-disabled={state.disabled}
      data-theme={state.theme.id}
      data-mode={state.mode}
      data-mode-preference={state.modePreference}
      data-theme-status={state.status}
      className={`tk-scope ${className}`}
      style={{ ...variables, ...style } as CSSProperties}
    >
      <fieldset
        className="tk-provider-controls"
        disabled={state.disabled}
        {...(state.disabled ? { inert: '' } : {})}
        aria-disabled={state.disabled}
      >
        {children}
      </fieldset>
    </div>
  );
}
