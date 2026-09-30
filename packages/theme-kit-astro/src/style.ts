import type { ThemeSnapshot } from '@sebytza23/theme-kit';
export function scopeStyle(state: ThemeSnapshot): string {
  return `${state.style};--tk-loading-display:${state.status === 'loading' ? 'contents' : 'none'};--tk-ready-display:${state.status === 'loading' ? 'none' : 'contents'};--tk-error-display:${state.error ? 'contents' : 'none'}`;
}
