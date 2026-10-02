'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  themeConfiguration,
  type ThemeConfiguration,
  type ThemeExportFormat,
  type TokenSelection,
} from '../core';
import { useTheme } from './context';
export function ThemeExport({
  format = 'json',
  selection,
  onChange,
  children,
  className = '',
}: {
  format?: ThemeExportFormat;
  selection?: TokenSelection;
  onChange?: (configuration: ThemeConfiguration) => void;
  children?: (configuration: ThemeConfiguration) => ReactNode;
  className?: string;
}) {
  const state = useTheme(),
    configuration = themeConfiguration(state, selection),
    selectionKey = JSON.stringify(selection),
    callback = useRef(onChange);
  callback.current = onChange;
  useEffect(
    () => callback.current?.(themeConfiguration(state, selection)),
    [
      state.theme,
      state.mode,
      state.modePreference,
      state.systemMode,
      selectionKey,
    ],
  );
  return children ? (
    <>{children(configuration)}</>
  ) : (
    <pre className={`tk-export ${className}`} aria-label="Theme configuration">
      {configuration[format]}
    </pre>
  );
}
