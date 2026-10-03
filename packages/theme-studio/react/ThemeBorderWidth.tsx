'use client';
import { ThemeBorder } from './ThemeBorder';
export function ThemeBorderWidth(
  props: Omit<Parameters<typeof ThemeBorder>[0], 'kind'>,
) {
  return <ThemeBorder {...props} kind="width" />;
}
