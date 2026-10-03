'use client';
import { type ReactNode } from 'react';
import { useTheme } from './context';
export function ThemeLoading({ children }: { children: ReactNode }) {
  return useTheme().status === 'loading' ? <>{children}</> : null;
}
