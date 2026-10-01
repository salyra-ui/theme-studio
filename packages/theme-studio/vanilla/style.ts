import type { ThemeSnapshot } from '../core';
export function scopeStyle(state: ThemeSnapshot): string {
  return `${state.style};--tk-loading-display:${state.status === 'loading' ? 'contents' : 'none'};--tk-ready-display:${state.status === 'loading' ? 'none' : 'contents'};--tk-error-display:${state.error ? 'contents' : 'none'}`;
}

/** Update generated variables without discarding caller-owned inline styles. */
export function applyScopeStyle(
  element: HTMLElement,
  state: ThemeSnapshot,
): void {
  for (const declaration of scopeStyle(state).split(';')) {
    const separator = declaration.indexOf(':');
    if (separator <= 0) continue;
    element.style.setProperty(
      declaration.slice(0, separator),
      declaration.slice(separator + 1),
    );
  }
}
