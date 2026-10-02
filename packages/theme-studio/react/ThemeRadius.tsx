'use client';
import { ThemeBorder } from './ThemeBorder';
export function ThemeRadius(
  props: Omit<Parameters<typeof ThemeBorder>[0], 'kind'>,
) {
  return <ThemeBorder {...props} kind="radius" />;
}
